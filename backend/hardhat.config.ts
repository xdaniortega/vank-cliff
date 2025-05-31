import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.mnemonic ? process.env.mnemonic : '']
    },
    flow: {
      url: process.env.FLOW_RPC_URL,
      accounts: [process.env.mnemonic ? process.env.mnemonic : '']
    },
  }
};

export default config;
