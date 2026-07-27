const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const owner = process.env.FACTORY_OWNER || deployer.address;
  const treasury = process.env.PROTOCOL_TREASURY || owner;
  const protocolFeeShareBps = Number(process.env.PROTOCOL_FEE_SHARE_BPS || "2000");
  if (!hre.ethers.isAddress(owner) || owner === hre.ethers.ZeroAddress) {
    throw new Error("FACTORY_OWNER must be a non-zero address");
  }
  if (!hre.ethers.isAddress(treasury) || treasury === hre.ethers.ZeroAddress) {
    throw new Error("PROTOCOL_TREASURY must be a non-zero address");
  }
  if (!Number.isInteger(protocolFeeShareBps) || protocolFeeShareBps < 0 || protocolFeeShareBps > 5_000) {
    throw new Error("PROTOCOL_FEE_SHARE_BPS must be an integer from 0 through 5000");
  }

  const Factory = await hre.ethers.getContractFactory("ProbabilityMarketFactory");
  const factory = await Factory.deploy(owner, treasury, protocolFeeShareBps);
  await factory.waitForDeployment();
  const deployment = await factory.deploymentTransaction().wait();
  console.log(JSON.stringify({
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    address: await factory.getAddress(),
    transactionHash: deployment.hash,
    owner,
    protocolTreasury: treasury,
    protocolFeeShareBps,
    permissionlessCreation: false,
  }, null, 2));
  console.log("Factory is non-upgradeable. Revenue terms affect future markets only. UNAUDITED/testnet-only.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
