"use client";

import React, { createContext, useContext, useMemo, ReactNode, useEffect, useRef } from "react";
import { useAccount, useDisconnect, useChainId, useSwitchChain, useConnectorClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "4221");

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  isMetaMaskInstalled: boolean;
  isOnCorrectNetwork: boolean;
  provider: any | null;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchWalletAccount: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

/**
 * WalletProvider component that manages wallet state using Wagmi and AppKit
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useAppKit();
  const { data: connectorClient } = useConnectorClient();
  const switchAttempted = useRef(false);

  const isOnCorrectNetwork = useMemo(() => chainId === TARGET_CHAIN_ID, [chainId]);

  // Automatic network switch
  useEffect(() => {
    if (isConnected && !isOnCorrectNetwork && !switchAttempted.current) {
      console.log(`[WalletProvider] Auto-switching to chain ${TARGET_CHAIN_ID}`);
      switchAttempted.current = true;
      switchChain({ chainId: TARGET_CHAIN_ID });
    }
    
    // Reset the ref if we are on the correct network or disconnected
    if (isOnCorrectNetwork || !isConnected) {
      switchAttempted.current = false;
    }
  }, [isConnected, isOnCorrectNetwork, switchChain]);

  const connectWallet = async () => {
    await open();
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const switchWalletAccount = async () => {
    if (!isOnCorrectNetwork) {
      try {
        await switchChain({ chainId: TARGET_CHAIN_ID });
      } catch (err) {
        console.error("Failed to switch network:", err);
        // Fallback to AppKit modal if wagmi switch fails
        await open({ view: 'Networks' });
      }
    } else {
      await open({ view: 'Account' });
    }
  };

  const value: WalletContextValue = {
    address: (address as string) || null,
    chainId: chainId || null,
    isConnected,
    isLoading: isConnecting || isReconnecting,
    isMetaMaskInstalled: true, // Wagmi handles this internally
    isOnCorrectNetwork,
    provider: connectorClient?.transport || null,
    connectWallet,
    disconnectWallet,
    switchWalletAccount,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
