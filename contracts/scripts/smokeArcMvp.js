const hre = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");

const ARC_CHAIN_ID = 5_042_002n;
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const deploymentPath = path.join(__dirname, "..", "deployments", "arc-testnet.json");

function loadDeployment() {
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  for (const field of ["factory", "market", "factoryOwner", "marketOwner", "oracle", "protocolTreasury"]) {
    if (!hre.ethers.isAddress(deployment[field]) || deployment[field] === hre.ethers.ZeroAddress) {
      throw new Error(`Deployment field ${field} must be a non-zero address`);
    }
  }
  if (BigInt(deployment.chainId) !== ARC_CHAIN_ID) throw new Error("Deployment file is not for Arc Testnet");
  return deployment;
}

async function main() {
  const deployment = loadDeployment();
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== ARC_CHAIN_ID || network.chainId !== BigInt(deployment.chainId)) {
    throw new Error(`Deployment chain mismatch: connected to ${network.chainId}`);
  }

  const [factoryCode, marketCode, usdcCode] = await Promise.all([
    hre.ethers.provider.getCode(deployment.factory),
    hre.ethers.provider.getCode(deployment.market),
    hre.ethers.provider.getCode(ARC_USDC),
  ]);
  if (factoryCode === "0x" || marketCode === "0x" || usdcCode === "0x") {
    throw new Error("Factory, market, or Arc USDC bytecode is missing on the connected chain");
  }

  const factory = await hre.ethers.getContractAt("ProbabilityMarketFactory", deployment.factory);
  const market = await hre.ethers.getContractAt("BinaryPredictionMarket", deployment.market);
  const usdc = new hre.ethers.Contract(
    ARC_USDC,
    ["function balanceOf(address) view returns (uint256)"],
    hre.ethers.provider,
  );
  const [
    marketCount, registered, factoryOwner, pendingFactoryOwner, factoryTreasury, factoryFeeShare,
    initialized, phase, yesReserve, noReserve, required, collateralBalance,
    collateral, marketOwner, oracle, marketTreasury, marketFeeShare,
  ] = await Promise.all([
    factory.marketCount(),
    factory.isMarket(deployment.market),
    factory.owner(),
    factory.pendingOwner(),
    factory.protocolTreasury(),
    factory.protocolFeeShareBps(),
    market.initialized(),
    market.phase(),
    market.yesReserve(),
    market.noReserve(),
    market.requiredCollateral(),
    usdc.balanceOf(deployment.market),
    market.collateral(),
    market.owner(),
    market.oracle(),
    market.protocolTreasury(),
    market.protocolFeeShareBps(),
  ]);

  const result = {
    chainId: Number(network.chainId),
    factory: deployment.factory,
    market: deployment.market,
    marketCount: marketCount.toString(),
    registered,
    initialized,
    phase: Number(phase),
    yesReserve: yesReserve.toString(),
    noReserve: noReserve.toString(),
    requiredCollateral: required.toString(),
    collateralBalance: collateralBalance.toString(),
    factoryOwner,
    pendingFactoryOwner,
    marketOwner,
    oracle,
    protocolTreasury: marketTreasury,
    protocolFeeShareBps: marketFeeShare.toString(),
  };
  const expectedFactoryOwner = deployment.factoryOwner.toLowerCase();
  const ownershipIsCorrect = factoryOwner.toLowerCase() === expectedFactoryOwner
    || (
      deployment.pendingFactoryOwnershipAcceptance
      && pendingFactoryOwner.toLowerCase() === expectedFactoryOwner
    );
  if (
    !registered || marketCount === 0n || !initialized || yesReserve === 0n || noReserve === 0n
    || collateral.toLowerCase() !== ARC_USDC.toLowerCase()
    || marketOwner.toLowerCase() !== deployment.marketOwner.toLowerCase()
    || oracle.toLowerCase() !== deployment.oracle.toLowerCase()
    || factoryTreasury.toLowerCase() !== deployment.protocolTreasury.toLowerCase()
    || marketTreasury.toLowerCase() !== deployment.protocolTreasury.toLowerCase()
    || factoryFeeShare !== BigInt(deployment.protocolFeeShareBps)
    || marketFeeShare !== BigInt(deployment.protocolFeeShareBps)
    || collateralBalance < required
    || !ownershipIsCorrect
  ) {
    throw new Error(`Arc smoke test failed: ${JSON.stringify(result)}`);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
