import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const privateKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const accounts = privateKey ? [privateKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mantle_mainnet: {
      url: process.env.MANTLE_RPC_URL || "https://rpc.mantle.xyz",
      accounts,
      chainId: 5000
    },
    mantle_testnet: {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts,
      chainId: 5003
    }
  },
  etherscan: {
    apiKey: {
      mantle_mainnet: process.env.MANTLESCAN_API_KEY || "placeholder",
      mantle_testnet: process.env.MANTLESCAN_API_KEY || "placeholder"
    },
    customChains: [
      {
        network: "mantle_mainnet",
        chainId: 5000,
        urls: {
          apiURL: "https://explorer.mantle.xyz/api",
          browserURL: "https://explorer.mantle.xyz"
        }
      },
      {
        network: "mantle_testnet",
        chainId: 5003,
        urls: {
          apiURL: "https://explorer.sepolia.mantle.xyz/api",
          browserURL: "https://explorer.sepolia.mantle.xyz"
        }
      }
    ]
  }
};

export default config;
