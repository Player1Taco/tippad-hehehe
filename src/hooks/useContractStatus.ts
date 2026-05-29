import { useState, useEffect, useCallback } from 'react';
import {
  TIPPAD_REGISTRY_ADDRESS,
  RPC_URL,
  CURRENT_NETWORK,
  IS_TESTNET,
  getExplorerAddressUrl,
} from '../config/contracts';

interface ContractStatus {
  /** Whether the TippadRegistry contract is currently paused */
  isPaused: boolean;
  /** Whether the initial contract status check is in progress */
  isLoading: boolean;
  /** Error message if the contract check failed */
  error: string | null;
  /** Timestamp of the last successful check */
  lastChecked: number | null;
  /** Manually trigger a re-check of the contract status */
  refetch: () => Promise<void>;
  /** The resolved contract address being used */
  contractAddress: string;
  /** The current network name */
  network: string;
  /** Whether the current network is a testnet */
  isTestnet: boolean;
  /** Block explorer URL for the contract */
  explorerUrl: string;
}

/**
 * Custom hook to check the TippadRegistry contract's paused() state.
 * 
 * Reads the contract address from environment-based configuration:
 *   - VITE_TIPPAD_REGISTRY_ADDRESS overrides the default for any network
 *   - VITE_NETWORK selects the network (mainnet, sepolia, goerli, localhost, hardhat)
 *   - Falls back to sepolia in development, mainnet in production
 * 
 * In production, this would call the actual smart contract's paused() view function
 * using the configured RPC_URL. Currently simulates the check with realistic async behavior.
 */
export function useContractStatus(): ContractStatus {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const contractAddress = TIPPAD_REGISTRY_ADDRESS;
  const explorerUrl = getExplorerAddressUrl(contractAddress);

  const checkPauseState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate that we have a contract address configured
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(
          `TippadRegistry address not configured for network "${CURRENT_NETWORK}". ` +
          `Set VITE_TIPPAD_REGISTRY_ADDRESS in your .env file.`
        );
      }

      // Simulate an RPC call to TippadRegistry.paused()
      // In production, this would be:
      //
      //   const provider = new ethers.JsonRpcProvider(RPC_URL);
      //   const contract = new ethers.Contract(
      //     contractAddress,  // From config/contracts.ts (env-driven)
      //     ['function paused() view returns (bool)'],
      //     provider
      //   );
      //   const paused = await contract.paused();
      //
      // Using RPC_URL: ${RPC_URL}
      // Using contract: ${contractAddress}
      // On network: ${CURRENT_NETWORK}

      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

      // Simulate contract state — in production this reads from chain
      // For demo purposes, the contract is NOT paused (normal operation)
      const simulatedPauseState = false;

      setIsPaused(simulatedPauseState);
      setLastChecked(Date.now());

      if (import.meta.env.DEV) {
        console.log('[useContractStatus] Check complete', {
          network: CURRENT_NETWORK,
          address: contractAddress,
          rpcUrl: RPC_URL,
          isPaused: simulatedPauseState,
          isTestnet: IS_TESTNET,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check contract status';
      setError(message);
      // Default to not paused on error to avoid blocking users unnecessarily
      // but log the error for monitoring
      console.error(
        `[useContractStatus] Failed to check TippadRegistry.paused() on ${CURRENT_NETWORK}:`,
        message,
        { contractAddress, rpcUrl: RPC_URL }
      );
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  useEffect(() => {
    checkPauseState();

    // Poll every 30 seconds to keep pause state fresh
    const interval = setInterval(checkPauseState, 30_000);
    return () => clearInterval(interval);
  }, [checkPauseState]);

  return {
    isPaused,
    isLoading,
    error,
    lastChecked,
    refetch: checkPauseState,
    contractAddress,
    network: CURRENT_NETWORK,
    isTestnet: IS_TESTNET,
    explorerUrl,
  };
}
