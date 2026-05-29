/**
 * Contract Configuration
 * 
 * Centralized configuration for all smart contract addresses and network settings.
 * Supports mainnet, testnet (Goerli/Sepolia), and local development environments.
 * 
 * Environment variables (set in .env files):
 *   VITE_TIPPAD_REGISTRY_ADDRESS  — Override contract address for any network
 *   VITE_NETWORK                  — Target network (mainnet | sepolia | goerli | localhost | hardhat)
 *   VITE_RPC_URL                  — Custom RPC endpoint
 *   VITE_CHAIN_ID                 — Chain ID override
 *   VITE_BLOCK_EXPLORER_URL       — Block explorer base URL
 */

// ============ Types ============

export type NetworkName = 'mainnet' | 'sepolia' | 'goerli' | 'localhost' | 'hardhat';

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorerUrl: string;
  contracts: {
    tippadRegistry: string;
  };
  isTestnet: boolean;
}

// ============ Network Configurations ============

const NETWORK_CONFIGS: Record<NetworkName, NetworkConfig> = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://etherscan.io',
    contracts: {
      tippadRegistry: '0x0000000000000000000000000000000000000000', // Not yet deployed to mainnet
    },
    isTestnet: false,
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    contracts: {
      tippadRegistry: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Testnet deployment
    },
    isTestnet: true,
  },
  goerli: {
    name: 'Goerli Testnet',
    chainId: 5,
    rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    contracts: {
      tippadRegistry: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Goerli deployment
    },
    isTestnet: true,
  },
  localhost: {
    name: 'Localhost (Hardhat)',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: '',
    contracts: {
      tippadRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Default Hardhat deploy address
    },
    isTestnet: true,
  },
  hardhat: {
    name: 'Hardhat Network',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: '',
    contracts: {
      tippadRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    },
    isTestnet: true,
  },
};

// ============ Environment Variable Resolution ============

/**
 * Resolves the current network from environment variables.
 * Falls back to 'sepolia' for development safety.
 */
function resolveNetwork(): NetworkName {
  const envNetwork = import.meta.env.VITE_NETWORK as string | undefined;

  if (envNetwork && envNetwork in NETWORK_CONFIGS) {
    return envNetwork as NetworkName;
  }

  // Default to sepolia in development, mainnet in production
  if (import.meta.env.DEV) {
    return 'sepolia';
  }

  return 'mainnet';
}

/**
 * Resolves the active network configuration, applying any environment variable overrides.
 */
function resolveNetworkConfig(): NetworkConfig {
  const network = resolveNetwork();
  const baseConfig = { ...NETWORK_CONFIGS[network] };

  // Deep clone contracts to avoid mutating the original
  baseConfig.contracts = { ...baseConfig.contracts };

  // Apply environment variable overrides
  const envRegistryAddress = import.meta.env.VITE_TIPPAD_REGISTRY_ADDRESS as string | undefined;
  if (envRegistryAddress && isValidAddress(envRegistryAddress)) {
    baseConfig.contracts.tippadRegistry = envRegistryAddress;
  }

  const envRpcUrl = import.meta.env.VITE_RPC_URL as string | undefined;
  if (envRpcUrl) {
    baseConfig.rpcUrl = envRpcUrl;
  }

  const envChainId = import.meta.env.VITE_CHAIN_ID as string | undefined;
  if (envChainId && !isNaN(Number(envChainId))) {
    baseConfig.chainId = Number(envChainId);
  }

  const envExplorerUrl = import.meta.env.VITE_BLOCK_EXPLORER_URL as string | undefined;
  if (envExplorerUrl) {
    baseConfig.blockExplorerUrl = envExplorerUrl;
  }

  return baseConfig;
}

// ============ Validation ============

/**
 * Validates an Ethereum address format (basic checksum-agnostic check).
 */
function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// ============ Exports ============

/** The currently active network name */
export const CURRENT_NETWORK: NetworkName = resolveNetwork();

/** The fully resolved network configuration with env overrides applied */
export const NETWORK_CONFIG: NetworkConfig = resolveNetworkConfig();

/** The TippadRegistry contract address for the current network */
export const TIPPAD_REGISTRY_ADDRESS: string = NETWORK_CONFIG.contracts.tippadRegistry;

/** The RPC URL for the current network */
export const RPC_URL: string = NETWORK_CONFIG.rpcUrl;

/** The chain ID for the current network */
export const CHAIN_ID: number = NETWORK_CONFIG.chainId;

/** The block explorer URL for the current network */
export const BLOCK_EXPLORER_URL: string = NETWORK_CONFIG.blockExplorerUrl;

/** Whether the current network is a testnet */
export const IS_TESTNET: boolean = NETWORK_CONFIG.isTestnet;

/** All available network configurations (for network switcher UI) */
export const ALL_NETWORKS = NETWORK_CONFIGS;

/**
 * Get the block explorer URL for a specific contract address.
 */
export function getExplorerAddressUrl(address: string): string {
  if (!BLOCK_EXPLORER_URL) return '';
  return `${BLOCK_EXPLORER_URL}/address/${address}`;
}

/**
 * Get the block explorer URL for a specific transaction hash.
 */
export function getExplorerTxUrl(txHash: string): string {
  if (!BLOCK_EXPLORER_URL) return '';
  return `${BLOCK_EXPLORER_URL}/tx/${txHash}`;
}

/**
 * Log the current contract configuration (for debugging).
 * Only logs in development mode.
 */
export function logContractConfig(): void {
  if (import.meta.env.DEV) {
    console.log('[Tippad Contract Config]', {
      network: CURRENT_NETWORK,
      chainId: CHAIN_ID,
      tippadRegistry: TIPPAD_REGISTRY_ADDRESS,
      rpcUrl: RPC_URL,
      isTestnet: IS_TESTNET,
      explorerUrl: BLOCK_EXPLORER_URL,
    });
  }
}

// Auto-log config in development
logContractConfig();
