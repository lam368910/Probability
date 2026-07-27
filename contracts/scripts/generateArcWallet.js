const fs = require("node:fs");
const path = require("node:path");
const { Wallet } = require("ethers");

const envPath = path.join(__dirname, "..", ".env.arc.local");

if (fs.existsSync(envPath)) {
  const existing = fs.readFileSync(envPath, "utf8");
  const privateKey = existing.match(/^ARC_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
  const recordedAddress = existing.match(/^ARC_DEPLOYER_ADDRESS=(.+)$/m)?.[1]?.trim();
  if (!privateKey) {
    throw new Error("Existing .env.arc.local has no ARC_PRIVATE_KEY; refusing to overwrite it");
  }
  let wallet;
  try {
    wallet = new Wallet(privateKey);
  } catch {
    throw new Error("Existing .env.arc.local contains an invalid ARC_PRIVATE_KEY; refusing to overwrite it");
  }
  if (recordedAddress && recordedAddress.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error("ARC_DEPLOYER_ADDRESS does not match ARC_PRIVATE_KEY; refusing to continue");
  }
  console.log(JSON.stringify({
    created: false,
    address: wallet.address,
    message: "Existing, internally consistent Arc testnet wallet preserved.",
  }, null, 2));
  process.exit(0);
}

const wallet = Wallet.createRandom();
const contents = [
  "# Testnet-only deployment wallet. Never commit or reuse for real assets.",
  `ARC_PRIVATE_KEY=${wallet.privateKey}`,
  `ARC_DEPLOYER_ADDRESS=${wallet.address}`,
  "ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.io",
  "",
].join("\n");

fs.writeFileSync(envPath, contents, { encoding: "utf8", mode: 0o600, flag: "wx" });
console.log(JSON.stringify({
  created: true,
  address: wallet.address,
  faucet: "https://faucet.circle.com/",
  warning: "Testnet-only wallet. The private key remains in ignored contracts/.env.arc.local.",
}, null, 2));
