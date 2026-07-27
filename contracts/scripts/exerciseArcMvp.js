const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const ARC_CHAIN_ID = 5_042_002n;
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const DEPLOYMENT_PATH = path.join(__dirname, "..", "deployments", "arc-testnet.json");
const TRADE_AMOUNT = 100_000n; // 0.10 USDC through the 6-decimal ERC-20 interface.
const LIQUIDITY_AMOUNT = 100_000n;
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

const withSlippage = (value) => value === 0n ? 0n : value * 99n / 100n;

async function feeOverrides() {
  const feeData = await hre.ethers.provider.getFeeData();
  const priorityFloor = hre.ethers.parseUnits("1", "gwei");
  const maxFeeFloor = hre.ethers.parseUnits("20", "gwei");
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > priorityFloor
    ? feeData.maxPriorityFeePerGas
    : priorityFloor;
  const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > maxFeeFloor
    ? feeData.maxFeePerGas
    : maxFeeFloor;
  return { maxFeePerGas, maxPriorityFeePerGas };
}

async function main() {
  if (!fs.existsSync(DEPLOYMENT_PATH)) throw new Error("Run deploy:arc before exercise:arc");
  const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, "utf8"));
  if (deployment.transactions?.demoBuy && process.env.ALLOW_ARC_DEMO_REPEAT !== "true") {
    throw new Error("Demo transactions already exist; set ALLOW_ARC_DEMO_REPEAT=true only to exercise again");
  }

  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== ARC_CHAIN_ID) throw new Error(`Unexpected chain ID ${network.chainId}`);
  const [actor] = await hre.ethers.getSigners();
  if (!actor) throw new Error("Set ARC_PRIVATE_KEY in contracts/.env.arc.local");

  const usdc = new hre.ethers.Contract(ARC_USDC, ERC20_ABI, actor);
  const market = await hre.ethers.getContractAt("BinaryPredictionMarket", deployment.market, actor);
  const startingBalance = await usdc.balanceOf(actor.address);
  if (startingBalance < TRADE_AMOUNT + LIQUIDITY_AMOUNT + 100_000n) {
    throw new Error("Keep at least 0.30 testnet USDC available for the two demo actions and gas");
  }

  const approveBuy = await usdc.approve(deployment.market, TRADE_AMOUNT, await feeOverrides());
  await approveBuy.wait(1);
  const [quotedShares] = await market.quoteBuy(true, TRADE_AMOUNT);
  if (quotedShares === 0n) throw new Error("YES quote returned zero shares");
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const buyTx = await market.buy(true, TRADE_AMOUNT, withSlippage(quotedShares), deadline, await feeOverrides());
  const buyReceipt = await buyTx.wait(1);
  console.log(JSON.stringify({ step: "demo-buy-final", transactionHash: buyReceipt.hash }));

  const approveLiquidity = await usdc.approve(deployment.market, LIQUIDITY_AMOUNT, await feeOverrides());
  await approveLiquidity.wait(1);
  const [yesReserve, noReserve, totalLpShares] = await Promise.all([
    market.yesReserve(),
    market.noReserve(),
    market.totalLpShares(),
  ]);
  const largestReserve = yesReserve > noReserve ? yesReserve : noReserve;
  const lpShares = LIQUIDITY_AMOUNT * totalLpShares / largestReserve;
  if (lpShares === 0n) throw new Error("Liquidity amount is too small to mint LP shares");
  const yesReturned = LIQUIDITY_AMOUNT - yesReserve * lpShares / totalLpShares;
  const noReturned = LIQUIDITY_AMOUNT - noReserve * lpShares / totalLpShares;
  const liquidityTx = await market.addLiquidity(
    LIQUIDITY_AMOUNT,
    withSlippage(lpShares),
    withSlippage(yesReturned),
    withSlippage(noReturned),
    deadline,
    await feeOverrides(),
  );
  const liquidityReceipt = await liquidityTx.wait(1);
  console.log(JSON.stringify({ step: "demo-liquidity-final", transactionHash: liquidityReceipt.hash }));

  deployment.transactions.demoBuy = buyReceipt.hash;
  deployment.transactions.demoLiquidity = liquidityReceipt.hash;
  deployment.demoActor = actor.address;
  deployment.demoAmounts = {
    buyYes: TRADE_AMOUNT.toString(),
    addLiquidity: LIQUIDITY_AMOUNT.toString(),
  };
  fs.writeFileSync(DEPLOYMENT_PATH, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");

  const [finalYesReserve, finalNoReserve, finalCollateral, finalBalance] = await Promise.all([
    market.yesReserve(),
    market.noReserve(),
    market.requiredCollateral(),
    usdc.balanceOf(deployment.market),
  ]);
  console.log(JSON.stringify({
    actor: actor.address,
    buyTransaction: buyReceipt.hash,
    liquidityTransaction: liquidityReceipt.hash,
    yesReserve: finalYesReserve.toString(),
    noReserve: finalNoReserve.toString(),
    requiredCollateral: finalCollateral.toString(),
    collateralBalance: finalBalance.toString(),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
