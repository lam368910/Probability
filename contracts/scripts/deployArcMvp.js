const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const ARC_CHAIN_ID = 5_042_002n;
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const DEFAULT_CLOSE_TIME = Math.floor(Date.UTC(2026, 7, 20, 16, 0, 0) / 1000);
const OUTPUT_DIR = path.join(__dirname, "..", "deployments");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "arc-testnet.json");
const MIN_NATIVE_GAS_BALANCE = hre.ethers.parseUnits("0.2", 18);
const MIN_MAX_FEE_PER_GAS = hre.ethers.parseUnits("20", "gwei");
const MIN_PRIORITY_FEE_PER_GAS = hre.ethers.parseUnits("1", "gwei");
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

function validateAddress(name, value) {
  if (!hre.ethers.isAddress(value) || value === hre.ethers.ZeroAddress) {
    throw new Error(`${name} must be a non-zero address`);
  }
}

async function arcFeeOverrides() {
  const feeData = await hre.ethers.provider.getFeeData();
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
    && feeData.maxPriorityFeePerGas > MIN_PRIORITY_FEE_PER_GAS
    ? feeData.maxPriorityFeePerGas
    : MIN_PRIORITY_FEE_PER_GAS;
  let maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > MIN_MAX_FEE_PER_GAS
    ? feeData.maxFeePerGas
    : MIN_MAX_FEE_PER_GAS;
  if (maxFeePerGas < maxPriorityFeePerGas) maxFeePerGas = maxPriorityFeePerGas;
  return { maxFeePerGas, maxPriorityFeePerGas };
}

async function main() {
  if (fs.existsSync(OUTPUT_PATH) && process.env.ALLOW_ARC_DEPLOYMENT_OVERWRITE !== "true") {
    throw new Error(
      `Deployment file already exists at ${OUTPUT_PATH}; set ALLOW_ARC_DEPLOYMENT_OVERWRITE=true only for an intentional replacement`,
    );
  }
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("Set ARC_PRIVATE_KEY in contracts/.env.arc.local");

  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== ARC_CHAIN_ID) throw new Error(`Unexpected chain ID ${network.chainId}`);

  const owner = process.env.FACTORY_OWNER || deployer.address;
  const treasury = process.env.PROTOCOL_TREASURY || deployer.address;
  const oracle = process.env.ORACLE_ADDRESS || deployer.address;
  const marketOwner = process.env.OWNER_ADDRESS || deployer.address;
  const protocolFeeShareBps = Number(process.env.PROTOCOL_FEE_SHARE_BPS || "2000");
  const feeBps = Number(process.env.FEE_BPS || "30");
  const seedAmount = BigInt(process.env.SEED_AMOUNT || "5000000"); // 5 USDC, 6 decimals
  const minimumReserve = BigInt(process.env.MINIMUM_RESERVE || "1000000");
  const closeTime = Number(process.env.CLOSE_TIME || DEFAULT_CLOSE_TIME);
  const question = process.env.MARKET_QUESTION
    || "Will the Arc Programmable Money Hackathon reach Demo Day on August 20, 2026?";

  for (const [name, value] of [
    ["FACTORY_OWNER", owner],
    ["PROTOCOL_TREASURY", treasury],
    ["ORACLE_ADDRESS", oracle],
    ["OWNER_ADDRESS", marketOwner],
  ]) validateAddress(name, value);
  if (!Number.isInteger(protocolFeeShareBps) || protocolFeeShareBps < 0 || protocolFeeShareBps > 5_000) {
    throw new Error("PROTOCOL_FEE_SHARE_BPS must be an integer from 0 through 5000");
  }
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1_000) {
    throw new Error("FEE_BPS must be an integer from 0 through 1000");
  }
  if (!question || Buffer.byteLength(question, "utf8") > 512) {
    throw new Error("MARKET_QUESTION must contain 1 through 512 UTF-8 bytes");
  }
  if (minimumReserve <= 0n) throw new Error("MINIMUM_RESERVE must be greater than zero");
  if (!Number.isSafeInteger(closeTime) || closeTime <= Math.floor(Date.now() / 1000)) {
    throw new Error("CLOSE_TIME must be a future Unix timestamp within JavaScript's safe integer range");
  }
  if (seedAmount < minimumReserve) throw new Error("SEED_AMOUNT must be at least MINIMUM_RESERVE");

  const gasBalance = await hre.ethers.provider.getBalance(deployer.address);
  const usdcCode = await hre.ethers.provider.getCode(ARC_USDC);
  if (usdcCode === "0x") throw new Error(`No Arc USDC contract at ${ARC_USDC}; verify network configuration`);
  const usdc = new hre.ethers.Contract(ARC_USDC, ERC20_ABI, deployer);
  const [collateralBalance, decimals] = await Promise.all([
    usdc.balanceOf(deployer.address),
    usdc.decimals(),
  ]);
  if (decimals !== 6n) throw new Error(`Unexpected Arc USDC decimals: ${decimals}`);
  if (gasBalance < MIN_NATIVE_GAS_BALANCE) {
    throw new Error(`Fund ${deployer.address} with at least 0.2 Arc Testnet USDC for gas`);
  }
  // Arc's native gas balance and ERC-20 USDC interface share underlying value but use different precision.
  // Keep one ERC-20 USDC beyond the seed so deployment gas cannot consume the collateral allocation.
  if (collateralBalance < seedAmount + 1_000_000n) {
    throw new Error(`Arc USDC balance ${collateralBalance} must cover seed ${seedAmount} plus a 1 USDC gas buffer`);
  }

  const Factory = await hre.ethers.getContractFactory("ProbabilityMarketFactory");
  // The deployer must temporarily own the owner-gated factory to create the initial market.
  const factory = await Factory.deploy(deployer.address, treasury, protocolFeeShareBps, await arcFeeOverrides());
  await factory.waitForDeployment();
  const factoryReceipt = await factory.deploymentTransaction().wait(1);
  const factoryAddress = await factory.getAddress();
  console.log(JSON.stringify({ step: "factory-deployed", address: factoryAddress, transactionHash: factoryReceipt.hash }));

  const createTx = await factory.createMarket(
    ARC_USDC,
    question,
    closeTime,
    feeBps,
    minimumReserve,
    oracle,
    marketOwner,
    await arcFeeOverrides(),
  );
  const createReceipt = await createTx.wait(1);
  const marketAddress = await factory.marketAt(0);
  console.log(JSON.stringify({ step: "market-created", address: marketAddress, transactionHash: createReceipt.hash }));
  const market = await hre.ethers.getContractAt("BinaryPredictionMarket", marketAddress, deployer);

  const approveTx = await usdc.approve(marketAddress, seedAmount, await arcFeeOverrides());
  await approveTx.wait(1);
  if (await usdc.allowance(deployer.address, marketAddress) < seedAmount) {
    throw new Error("Arc USDC approval did not establish the requested allowance");
  }
  const initializeTx = await market.initialize(seedAmount, await arcFeeOverrides());
  const initializeReceipt = await initializeTx.wait(1);
  console.log(JSON.stringify({ step: "market-initialized", address: marketAddress, transactionHash: initializeReceipt.hash }));

  let ownershipTransferHash = null;
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    const ownershipTx = await factory.transferOwnership(owner, await arcFeeOverrides());
    ownershipTransferHash = (await ownershipTx.wait(1)).hash;
    console.log(JSON.stringify({
      step: "factory-ownership-transfer-started",
      pendingOwner: owner,
      transactionHash: ownershipTransferHash,
    }));
  }

  const deployment = {
    network: "arcTestnet",
    chainId: Number(ARC_CHAIN_ID),
    rpcUrl: "https://rpc.testnet.arc.io",
    explorerUrl: "https://testnet.arcscan.app",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    factoryOwner: owner,
    pendingFactoryOwnershipAcceptance: owner.toLowerCase() !== deployer.address.toLowerCase(),
    marketOwner,
    oracle,
    protocolTreasury: treasury,
    usdc: ARC_USDC,
    factory: factoryAddress,
    market: marketAddress,
    question,
    closeTime,
    feeBps,
    protocolFeeShareBps,
    minimumReserve: minimumReserve.toString(),
    seedAmount: seedAmount.toString(),
    transactions: {
      factoryDeployment: factoryReceipt.hash,
      marketCreation: createReceipt.hash,
      marketInitialization: initializeReceipt.hash,
      factoryOwnershipTransfer: ownershipTransferHash,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify(deployment, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
