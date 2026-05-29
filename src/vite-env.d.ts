/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Target network: mainnet | sepolia | goerli | localhost | hardhat */
  readonly VITE_NETWORK?: string;
  /** TippadRegistry contract address override */
  readonly VITE_TIPPAD_REGISTRY_ADDRESS?: string;
  /** Custom RPC endpoint URL */
  readonly VITE_RPC_URL?: string;
  /** Chain ID override */
  readonly VITE_CHAIN_ID?: string;
  /** Block explorer base URL override */
  readonly VITE_BLOCK_EXPLORER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
