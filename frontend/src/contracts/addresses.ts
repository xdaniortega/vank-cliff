export const CONTRACT_ADDRESSES = {
  // Flow EVM (chainId: 747)
  flow: {
    companyLiquidityManager: '0x8861eD313bd3548C160Cd66d305957A418CC4E8A',
    mockDAI: '0xfA2E46102F25b0a694A931C3A5ad8C78a994E13D',
    mockToken: '0xaaCA746b49D0F6021d4D8AdB6Bc7d25d0366cC96',
    mockPool: '0xaB726376c4A028C0B13AD6FCf3f2f695EBDabAd0'
  },
  // Hardhat local (chainId: 31337)
  localhost: {
    companyLiquidityManager: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    mockDAI: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    mockToken: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    mockPool: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
  }
} as const;

export const CHAIN_IDS = {
  FLOW: 747,
  LOCALHOST: 31337
} as const;

export const getContractAddress = (chainId: number, contractName: keyof typeof CONTRACT_ADDRESSES.flow) => {
  switch (chainId) {
    case CHAIN_IDS.FLOW:
      return CONTRACT_ADDRESSES.flow[contractName];
    case CHAIN_IDS.LOCALHOST:
      return CONTRACT_ADDRESSES.localhost[contractName];
    default:
      throw new Error(`Chain ID ${chainId} not supported`);
  }
}; 