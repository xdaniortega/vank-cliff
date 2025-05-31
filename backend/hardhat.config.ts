import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";
import * as dotenv from "dotenv";
import { EndpointId } from '@layerzerolabs/lz-definitions'

// Import tasks
import "./tasks/payroll";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.FLOW_RPC_URL || "",
        blockNumber: process.env.BLOCK_NUMBER ? parseInt(process.env.BLOCK_NUMBER) : undefined
      }
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
      chainId: 11155111
    },
    flow: {
      url: process.env.FLOW_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
      chainId: 1337
    },
    optimism_testnet: {
      eid: EndpointId.OPTSEP_V2_TESTNET,
      url: process.env.RPC_URL_OP_SEPOLIA || 'https://optimism-sepolia.gateway.tenderly.co',
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
  },
  avalanche_testnet: {
      eid: EndpointId.AVALANCHE_V2_TESTNET,
      url: process.env.RPC_URL_FUJI || 'https://avalanche-fuji.drpc.org',
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
  },
  arbitrum_testnet: {
      eid: EndpointId.ARBSEP_V2_TESTNET,
      url: process.env.RPC_URL_ARB_SEPOLIA || 'https://arbitrum-sepolia.gateway.tenderly.co',
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
