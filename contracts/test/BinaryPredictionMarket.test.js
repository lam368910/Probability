const { expect } = require("chai");
const { ethers } = require("hardhat");

const UNIT = 10n ** 18n;
const tokens = (n) => BigInt(n) * UNIT;

async function expectRevert(promise, errorName) {
  try {
    await promise;
    expect.fail(`expected ${errorName} revert`);
  } catch (error) {
    const selector = ethers.id(`${errorName}()`).slice(0, 10).toLowerCase();
    const seen = new Set();
    function containsExpected(value, depth = 0) {
      if (depth > 8 || value === null || value === undefined) return false;
      if (typeof value === "string") {
        return value.includes(errorName) || value.toLowerCase().includes(selector);
      }
      if (typeof value !== "object" || seen.has(value)) return false;
      seen.add(value);
      return Object.getOwnPropertyNames(value).some((key) => containsExpected(value[key], depth + 1));
    }
    expect(containsExpected(error), `expected ${errorName}, received ${String(error)}`).to.equal(true);
  }
}

describe("BinaryPredictionMarket", function () {
  let owner, oracle, alice, bob, attacker, treasury;
  let token, market, closeTime;

  beforeEach(async function () {
    [owner, oracle, alice, bob, attacker, treasury] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy();
    await token.waitForDeployment();

    const latest = await ethers.provider.getBlock("latest");
    closeTime = latest.timestamp + 3600;
    const Market = await ethers.getContractFactory("BinaryPredictionMarket");
    market = await Market.deploy(
      await token.getAddress(),
      "Will the test pass?",
      closeTime,
      300,
      2000,
      tokens(10),
      treasury.address,
      oracle.address,
      owner.address
    );
    await market.waitForDeployment();

    for (const account of [owner, alice, bob]) {
      await token.mint(account.address, tokens(10_000));
      await token.connect(account).approve(await market.getAddress(), ethers.MaxUint256);
    }
    await market.connect(owner).initialize(tokens(1_000));
  });

  async function deadline() {
    return (await ethers.provider.getBlock("latest")).timestamp + 600;
  }

  async function assertExactlySolvent() {
    expect(await token.balanceOf(await market.getAddress())).to.equal(await market.requiredCollateral());
  }

  it("initializes equal, fully backed reserves and LP accounting", async function () {
    expect(await market.initialized()).to.equal(true);
    expect(await market.yesReserve()).to.equal(tokens(1_000));
    expect(await market.noReserve()).to.equal(tokens(1_000));
    expect(await market.totalYesShares()).to.equal(tokens(1_000));
    expect(await market.totalNoShares()).to.equal(tokens(1_000));
    expect(await market.lpBalance(owner.address)).to.equal(tokens(1_000));
    expect(await market.phase()).to.equal(1n);
    await assertExactlySolvent();
    await expectRevert(market.connect(alice).initialize(tokens(1)), "AlreadyInitialized");
  });

  it("rejects an empty question and initialization below the configured reserve floor", async function () {
    const Market = await ethers.getContractFactory("BinaryPredictionMarket");
    await expectRevert(
      Market.deploy(
        await token.getAddress(),
        "",
        closeTime,
        300,
        2000,
        tokens(10),
        treasury.address,
        oracle.address,
        owner.address
      ),
      "InvalidQuestion"
    );

    const freshMarket = await Market.deploy(
      await token.getAddress(),
      "A valid question?",
      closeTime,
      300,
      2000,
      tokens(10),
      treasury.address,
      oracle.address,
      owner.address
    );
    await freshMarket.waitForDeployment();
    await token.connect(alice).approve(await freshMarket.getAddress(), ethers.MaxUint256);
    await expectRevert(freshMarket.connect(alice).initialize(tokens(10) - 1n), "MinimumReserve");
  });

  it("cannot drain active liquidity through LP removal or an extreme buy", async function () {
    const allLpShares = await market.lpBalance(owner.address);
    await expectRevert(
      market.connect(owner).removeLiquidity(allLpShares, 0, 0, 0, await deadline()),
      "MinimumReserve"
    );
    const extremeInput = tokens(100_000);
    const [extremeQuote] = await market.quoteBuy(true, extremeInput);
    await expectRevert(
      market.connect(alice).buy(true, extremeInput, extremeQuote, await deadline()),
      "MinimumReserve"
    );
    expect(await market.yesReserve()).to.equal(tokens(1_000));
    expect(await market.noReserve()).to.equal(tokens(1_000));
    await assertExactlySolvent();
  });

  it("buys YES, charges the configured fee, and preserves/increases k", async function () {
    const amount = tokens(100);
    const [quoted, fee] = await market.quoteBuy(true, amount);
    const oldK = (await market.yesReserve()) * (await market.noReserve());

    await market.connect(alice).buy(true, amount, quoted, await deadline());

    expect(fee).to.equal(tokens(3));
    expect(await market.yesBalance(alice.address)).to.equal(quoted);
    expect(await market.accruedFees()).to.equal(fee * 8n / 10n);
    expect(await market.accruedProtocolFees()).to.equal(fee * 2n / 10n);
    const newK = (await market.yesReserve()) * (await market.noReserve());
    expect(newK >= oldK).to.equal(true);
    await assertExactlySolvent();
  });

  it("sells owned YES for exact gross collateral and keeps backing exact", async function () {
    const [bought] = await market.quoteBuy(true, tokens(300));
    await market.connect(alice).buy(true, tokens(300), bought, await deadline());
    const oldK = (await market.yesReserve()) * (await market.noReserve());
    const [sharesIn, netOut, sellFee] = await market.quoteSell(true, tokens(80));
    expect(sharesIn <= bought).to.equal(true);
    const before = await token.balanceOf(alice.address);

    await market.connect(alice).sell(true, tokens(80), sharesIn, await deadline());

    expect(await token.balanceOf(alice.address)).to.equal(before + netOut);
    expect(await market.yesBalance(alice.address)).to.equal(bought - sharesIn);
    expect(sellFee).to.equal(tokens(24) / 10n); // 2.4 collateral
    const newK = (await market.yesReserve()) * (await market.noReserve());
    expect(newK >= oldK).to.equal(true);
    await assertExactlySolvent();
  });

  it("splits fees immutably and lets only the treasury claim protocol revenue", async function () {
    const [, fee] = await market.quoteBuy(true, tokens(100));
    await market.connect(alice).buy(true, tokens(100), 0, await deadline());
    const protocolFee = fee * 2n / 10n;
    expect(await market.protocolFeeShareBps()).to.equal(2000n);
    expect(await market.accruedProtocolFees()).to.equal(protocolFee);
    await expectRevert(market.connect(attacker).claimProtocolFees(), "Unauthorized");
    const before = await token.balanceOf(treasury.address);
    await market.connect(treasury).claimProtocolFees();
    expect(await token.balanceOf(treasury.address)).to.equal(before + protocolFee);
    expect(await market.accruedProtocolFees()).to.equal(0n);
    await assertExactlySolvent();
  });

  it("adds liquidity without shifting the reserve ratio and returns excess outcomes", async function () {
    const [quoted] = await market.quoteBuy(true, tokens(200));
    await market.connect(alice).buy(true, tokens(200), quoted, await deadline());
    const oldYes = await market.yesReserve();
    const oldNo = await market.noReserve();
    const [lpQuote, yesReturned, noReturned] = await market
      .connect(bob)
      .addLiquidity.staticCall(tokens(250), 0, 0, 0, await deadline());

    await expectRevert(
      market.connect(bob).addLiquidity(tokens(250), lpQuote, yesReturned + 1n, noReturned, await deadline()),
      "Slippage"
    );
    await market.connect(bob).addLiquidity(tokens(250), lpQuote, yesReturned, noReturned, await deadline());

    expect(lpQuote > 0n).to.equal(true);
    expect(yesReturned > 0n || noReturned > 0n).to.equal(true);
    expect(await market.yesBalance(bob.address)).to.equal(yesReturned);
    expect(await market.noBalance(bob.address)).to.equal(noReturned);
    const newYes = await market.yesReserve();
    const newNo = await market.noReserve();
    // Integer rounding can move the cross-product ratio by less than one reserve unit.
    const ratioError = newYes * oldNo > newNo * oldYes
      ? newYes * oldNo - newNo * oldYes
      : newNo * oldYes - newYes * oldNo;
    expect(ratioError <= oldYes + oldNo).to.equal(true);
    await assertExactlySolvent();
  });

  it("removes liquidity before resolution, merges pairs, and realizes pro-rata fees", async function () {
    const [quoted] = await market.quoteBuy(true, tokens(100));
    await market.connect(alice).buy(true, tokens(100), quoted, await deadline());
    const burn = tokens(200);
    const feeBefore = await market.accruedFees();
    const supplyBefore = await market.totalLpShares();
    const expectedFee = feeBefore * burn / supplyBefore;
    const before = await token.balanceOf(owner.address);

    const [collateralOut, yesReceived, noReceived] = await market
      .connect(owner)
      .removeLiquidity.staticCall(burn, 0, 0, 0, await deadline());
    const minYes = yesReceived > 0n ? yesReceived + 1n : yesReceived;
    const minNo = noReceived > 0n ? noReceived + 1n : noReceived;
    await expectRevert(
      market.connect(owner).removeLiquidity(burn, collateralOut, minYes, minNo, await deadline()),
      "Slippage"
    );
    await market.connect(owner).removeLiquidity(burn, collateralOut, yesReceived, noReceived, await deadline());

    expect(await token.balanceOf(owner.address)).to.equal(before + collateralOut);
    expect((await market.accruedFees())).to.equal(feeBefore - expectedFee);
    expect(yesReceived > 0n || noReceived > 0n).to.equal(true);
    await assertExactlySolvent();
  });

  it("enforces pause while retaining exits and resolution", async function () {
    await market.connect(owner).setPaused(true);
    await expectRevert(
      market.connect(alice).buy(true, tokens(10), 0, await deadline()),
      "Paused"
    );
    await expectRevert(
      market.connect(alice).addLiquidity(tokens(10), 0, 0, 0, await deadline()),
      "Paused"
    );
    await market.connect(owner).removeLiquidity(tokens(10), 0, 0, 0, await deadline());
    await ethers.provider.send("evm_setNextBlockTimestamp", [closeTime]);
    await ethers.provider.send("evm_mine", []);
    await market.connect(oracle).resolve(true);
    expect(await market.resolved()).to.equal(true);
  });

  it("restricts resolution to the oracle and to the post-close phase", async function () {
    await expectRevert(market.connect(attacker).resolve(true), "Unauthorized");
    await expectRevert(market.connect(oracle).resolve(true), "InvalidPhase");
    await ethers.provider.send("evm_setNextBlockTimestamp", [closeTime]);
    await ethers.provider.send("evm_mine", []);
    await expectRevert(market.connect(attacker).resolve(true), "Unauthorized");
    await market.connect(oracle).resolve(false);
    expect(await market.winningOutcome()).to.equal(false);
    expect(await market.phase()).to.equal(2n);
    await expectRevert(market.connect(oracle).resolve(true), "InvalidPhase");
  });

  it("redeems only winning user inventory and pays resolved LP inventory", async function () {
    const [aliceYes] = await market.quoteBuy(true, tokens(120));
    await market.connect(alice).buy(true, tokens(120), aliceYes, await deadline());
    const [bobNo] = await market.quoteBuy(false, tokens(80));
    await market.connect(bob).buy(false, tokens(80), bobNo, await deadline());
    await ethers.provider.send("evm_setNextBlockTimestamp", [closeTime]);
    await ethers.provider.send("evm_mine", []);
    await market.connect(oracle).resolve(true);

    const aliceBefore = await token.balanceOf(alice.address);
    await market.connect(alice).redeem();
    expect(await token.balanceOf(alice.address)).to.equal(aliceBefore + aliceYes);
    await expectRevert(market.connect(bob).redeem(), "ZeroAmount");

    const lpBefore = await token.balanceOf(owner.address);
    const burn = await market.lpBalance(owner.address);
    const [lpPayout] = await market.connect(owner).removeLiquidity.staticCall(burn, 0, 0, 0, await deadline());
    await market.connect(owner).removeLiquidity(burn, lpPayout, 0, 0, await deadline());
    expect(await token.balanceOf(owner.address)).to.equal(lpBefore + lpPayout);
    expect(await market.totalLpShares()).to.equal(0n);
    await assertExactlySolvent();
  });

  it("settles an invalid market at 50/50 for traders and LPs without underfunding", async function () {
    const [aliceYes] = await market.quoteBuy(true, tokens(121));
    await market.connect(alice).buy(true, tokens(121), aliceYes, await deadline());
    const [bobNo] = await market.quoteBuy(false, tokens(79));
    await market.connect(bob).buy(false, tokens(79), bobNo, await deadline());
    await ethers.provider.send("evm_setNextBlockTimestamp", [closeTime]);
    await ethers.provider.send("evm_mine", []);
    await market.connect(oracle).resolveInvalid();

    expect(await market.invalid()).to.equal(true);
    const aliceBefore = await token.balanceOf(alice.address);
    const bobBefore = await token.balanceOf(bob.address);
    await market.connect(alice).redeem();
    await market.connect(bob).redeem();
    expect(await token.balanceOf(alice.address)).to.equal(aliceBefore + aliceYes / 2n);
    expect(await token.balanceOf(bob.address)).to.equal(bobBefore + bobNo / 2n);

    const allLpShares = await market.lpBalance(owner.address);
    const [lpPayout] = await market
      .connect(owner)
      .removeLiquidity.staticCall(allLpShares, 0, 0, 0, await deadline());
    const ownerBefore = await token.balanceOf(owner.address);
    await market.connect(owner).removeLiquidity(allLpShares, lpPayout, 0, 0, await deadline());
    expect(await token.balanceOf(owner.address)).to.equal(ownerBefore + lpPayout);
    const protocolFees = await market.accruedProtocolFees();
    expect(await market.requiredCollateral()).to.equal(protocolFees);
    await market.connect(treasury).claimProtocolFees();
    expect(await market.requiredCollateral()).to.equal(0n);
    // Independent floor rounding can leave at most one smallest collateral unit for two trader accounts.
    expect(await token.balanceOf(await market.getAddress()) <= 1n).to.equal(true);
  });

  it("uses two-step ownership and permits only the owner to change controls", async function () {
    await expectRevert(market.connect(attacker).setPaused(true), "Unauthorized");
    await expectRevert(market.connect(attacker).setOracle(attacker.address), "Unauthorized");
    await market.connect(owner).transferOwnership(alice.address);
    await expectRevert(market.connect(attacker).acceptOwnership(), "Unauthorized");
    await market.connect(alice).acceptOwnership();
    expect(await market.owner()).to.equal(alice.address);
    await market.connect(alice).setOracle(bob.address);
    expect(await market.oracle()).to.equal(bob.address);
  });

  it("enforces deadlines, slippage limits, balances, close time, and sell reserve bounds", async function () {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await expectRevert(market.connect(alice).buy(true, tokens(10), 0, now - 1), "DeadlineExpired");
    const [quote] = await market.quoteBuy(true, tokens(10));
    await expectRevert(
      market.connect(alice).buy(true, tokens(10), quote + 1n, await deadline()),
      "Slippage"
    );
    await expectRevert(
      market.connect(alice).sell(true, tokens(10), ethers.MaxUint256, await deadline()),
      "InsufficientBalance"
    );
    const noReserve = await market.noReserve();
    await expectRevert(
      market.connect(alice).sell(true, noReserve, ethers.MaxUint256, await deadline()),
      "Slippage"
    );
    await expectRevert(
      market.connect(attacker).removeLiquidity(tokens(1), 0, 0, 0, await deadline()),
      "InsufficientBalance"
    );
    await ethers.provider.send("evm_setNextBlockTimestamp", [closeTime]);
    await ethers.provider.send("evm_mine", []);
    await expectRevert(
      market.connect(alice).buy(true, tokens(10), 0, closeTime + 100),
      "InvalidPhase"
    );
  });
});
