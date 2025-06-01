export const CONTRACT_ADDRESSES = {
  // Flow EVM (chainId: 747)
  flow: {
    companyLiquidityManager: '0x337591DcBD295e7F2548705F1daC1c661ed864d6',
    mockDAI: '0x5c5B7a1D518F8f9819e6300C44E8f5a98c853C55',
    mockToken: '0x9c63B2b36358120789D087429483684d7d30f8eF',
    mockPool: '0xC66Ed0d585DF3EF59D042637E87F8800D9733350'
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