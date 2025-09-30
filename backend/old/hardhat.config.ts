import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";
import * as dotenv from "dotenv";
import { EndpointId } from '@layerzerolabs/lz-definitions'
import "@nomicfoundation/hardhat-verify";


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
      },
      evmVersion: "paris"
    }
  },
  typechain: {
    outDir: "../typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["externalArtifacts/*.json"],
    dontOverrideCompile: false
  },
  networks: {
    'flow-evm': {
      url: 'https://rpc.flowscan.org',
      chainId: 747,
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
    },
    'localhost': {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : ""],
      chainId: 11155111
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
  },
  etherscan: {
    apiKey: {
      // No se requiere API key para Blockscout
      'flow-evm': "not-required",
      'localhost': "not-required"
    },
    customChains: [
      {
        network: "flow-evm",
        chainId: 747,
        urls: {
          apiURL: "https://eth.blockscout.com/api",
          browserURL: "https://eth.blockscout.com"
        }
      },
      {
        network: "localhost",
        chainId: 31337,
        urls: {
          apiURL: "http://localhost:4000/api", // Asumiendo que tienes un Blockscout local
          browserURL: "http://localhost:4000"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;
