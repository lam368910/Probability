require("@nomicfoundation/hardhat-ethers");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env.arc.local"), quiet: true });

const arcPrivateKey = process.env.ARC_PRIVATE_KEY?.trim();
if (arcPrivateKey && !/^0x[0-9a-fA-F]{64}$/.test(arcPrivateKey)) {
  throw new Error("ARC_PRIVATE_KEY must be a 0x-prefixed 32-byte hex private key");
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 500 },
      viaIR: true,
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.io",
      chainId: 5042002,
      accounts: arcPrivateKey ? [arcPrivateKey] : [],
    },
  },
};
