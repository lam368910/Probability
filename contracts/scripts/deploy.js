const hre = require("hardhat");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const collateral = required("COLLATERAL_ADDRESS");
  const question = required("MARKET_QUESTION");
  const closeTime = BigInt(required("CLOSE_TIME"));
  const feeBps = Number(required("FEE_BPS"));
  const protocolFeeShareBps = Number(required("PROTOCOL_FEE_SHARE_BPS"));
  const minimumReserve = BigInt(required("MINIMUM_RESERVE"));
  const protocolTreasury = required("PROTOCOL_TREASURY");
  const oracle = required("ORACLE_ADDRESS");
  const owner = required("OWNER_ADDRESS");

  for (const [name, value] of [["COLLATERAL_ADDRESS", collateral], ["PROTOCOL_TREASURY", protocolTreasury], ["ORACLE_ADDRESS", oracle], ["OWNER_ADDRESS", owner]]) {
    if (!hre.ethers.isAddress(value) || value === hre.ethers.ZeroAddress) {
      throw new Error(`${name} must be a non-zero address`);
    }
  }
  if (!Number.isInteger(protocolFeeShareBps) || protocolFeeShareBps < 0 || protocolFeeShareBps > 5_000) {
    throw new Error("PROTOCOL_FEE_SHARE_BPS must be an integer from 0 through 5000");
  }
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1_000) {
    throw new Error("FEE_BPS must be an integer from 0 through 1000");
  }
  if (minimumReserve <= 0n) throw new Error("MINIMUM_RESERVE must be greater than zero");
  const latest = await hre.ethers.provider.getBlock("latest");
  if (closeTime <= BigInt(latest.timestamp)) throw new Error("CLOSE_TIME must be in the future");

  const Market = await hre.ethers.getContractFactory("BinaryPredictionMarket");
  const market = await Market.deploy(
    collateral,
    question,
    closeTime,
    feeBps,
    protocolFeeShareBps,
    minimumReserve,
    protocolTreasury,
    oracle,
    owner
  );
  await market.waitForDeployment();
  const deployment = await market.deploymentTransaction().wait();

  console.log(JSON.stringify({
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    address: await market.getAddress(),
    transactionHash: deployment.hash,
    collateral,
    question,
    closeTime: closeTime.toString(),
    feeBps,
    protocolFeeShareBps,
    protocolTreasury,
    minimumReserve: minimumReserve.toString(),
    oracle,
    owner,
  }, null, 2));
  console.log("Market is not initialized. Approve collateral, then call initialize(seedAmount).\nUNAUDITED: testnet use only.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
