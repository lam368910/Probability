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

describe("ProbabilityMarketFactory", function () {
  let owner, alice, oracle, marketOwner;
  let token, factory, closeTime;

  beforeEach(async function () {
    [owner, alice, oracle, marketOwner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy();
    await token.waitForDeployment();
    const Factory = await ethers.getContractFactory("ProbabilityMarketFactory");
    factory = await Factory.deploy(owner.address, owner.address, 2000);
    await factory.waitForDeployment();
    closeTime = (await ethers.provider.getBlock("latest")).timestamp + 3600;
  });

  function create(sender = owner, question = "Will factory tests pass?", overrides = {}) {
    return factory.connect(sender).createMarket(
      overrides.collateral ?? token.target,
      question,
      overrides.closeTime ?? closeTime,
      overrides.feeBps ?? 250,
      overrides.minimumReserve ?? tokens(10),
      overrides.oracle ?? oracle.address,
      overrides.marketOwner ?? marketOwner.address
    );
  }

  it("creates and registers a market with explicit independent roles", async function () {
    const tx = await create();
    const receipt = await tx.wait();
    const createdLog = receipt.logs
      .map((log) => { try { return factory.interface.parseLog(log); } catch { return null; } })
      .find((log) => log && log.name === "MarketCreated");
    const marketAddress = createdLog.args.market;
    const Market = await ethers.getContractFactory("BinaryPredictionMarket");
    const market = Market.attach(marketAddress);

    expect(await factory.marketCount()).to.equal(1n);
    expect(await factory.marketAt(0)).to.equal(marketAddress);
    expect(await factory.isMarket(marketAddress)).to.equal(true);
    expect(await market.owner()).to.equal(marketOwner.address);
    expect(await market.oracle()).to.equal(oracle.address);
    expect(await market.collateral()).to.equal(token.target);
    expect(await market.minimumReserve()).to.equal(tokens(10));
    expect(await market.feeBps()).to.equal(250n);
    expect(await market.protocolFeeShareBps()).to.equal(2000n);
    expect(await market.protocolTreasury()).to.equal(owner.address);
  });

  it("is owner-only by default and can explicitly enable permissionless creation", async function () {
    await expectRevert(create(alice), "Unauthorized");
    await expectRevert(factory.connect(alice).setPermissionlessCreation(true), "Unauthorized");
    await factory.connect(owner).setPermissionlessCreation(true);
    await create(alice);
    expect(await factory.marketCount()).to.equal(1n);
  });

  it("supports two-step factory ownership", async function () {
    await factory.connect(owner).transferOwnership(alice.address);
    await expectRevert(factory.connect(oracle).acceptOwnership(), "Unauthorized");
    await factory.connect(alice).acceptOwnership();
    expect(await factory.owner()).to.equal(alice.address);
    await expectRevert(create(owner), "Unauthorized");
    await create(alice);
  });

  it("updates protocol revenue terms for future markets without changing existing ones", async function () {
    await create();
    const firstAddress = await factory.marketAt(0);
    const Market = await ethers.getContractFactory("BinaryPredictionMarket");
    const first = Market.attach(firstAddress);
    await expectRevert(factory.connect(alice).setProtocolFeeConfig(alice.address, 1000), "Unauthorized");
    await factory.setProtocolFeeConfig(alice.address, 1000);
    await create(owner, "Second market?");
    const second = Market.attach(await factory.marketAt(1));
    expect(await first.protocolTreasury()).to.equal(owner.address);
    expect(await first.protocolFeeShareBps()).to.equal(2000n);
    expect(await second.protocolTreasury()).to.equal(alice.address);
    expect(await second.protocolFeeShareBps()).to.equal(1000n);
    await expectRevert(factory.setProtocolFeeConfig(ethers.ZeroAddress, 1000), "ZeroAddress");
    await expectRevert(factory.setProtocolFeeConfig(owner.address, 5001), "InvalidProtocolFeeShare");
  });

  it("validates all safety-relevant creation parameters", async function () {
    await expectRevert(create(owner, "", {}), "InvalidQuestion");
    await expectRevert(create(owner, "x".repeat(513), {}), "InvalidQuestion");
    await expectRevert(create(owner, "question", { collateral: alice.address }), "InvalidCollateral");
    await expectRevert(create(owner, "question", { closeTime: 1 }), "InvalidCloseTime");
    await expectRevert(create(owner, "question", { feeBps: 1001 }), "InvalidFee");
    await expectRevert(create(owner, "question", { minimumReserve: 0 }), "InvalidMinimumReserve");
    await expectRevert(create(owner, "question", { oracle: ethers.ZeroAddress }), "ZeroAddress");
    await expectRevert(create(owner, "question", { marketOwner: ethers.ZeroAddress }), "ZeroAddress");
  });

  it("provides bounded, ordered pagination over multiple markets", async function () {
    await create(owner, "Market one?");
    await create(owner, "Market two?");
    await create(owner, "Market three?");
    const first = await factory.marketAt(0);
    const second = await factory.marketAt(1);
    const third = await factory.marketAt(2);

    expect(await factory.getMarkets(0, 2)).to.deep.equal([first, second]);
    expect(await factory.getMarkets(2, 2)).to.deep.equal([third]);
    expect(await factory.getMarkets(3, 10)).to.deep.equal([]);
    await expectRevert(factory.getMarkets(4, 1), "InvalidPagination");
    await expectRevert(factory.getMarkets(0, 101), "InvalidPagination");
  });
});
