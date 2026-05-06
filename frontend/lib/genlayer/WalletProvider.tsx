"use client";

import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useAccount, useDisconnect, useChainId, useSwitchChain, useConnectorClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { studionet } from "./wagmi-config";

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

  const isOnCorrectNetwork = useMemo(() => chainId === studionet.id, [chainId]);

  const connectWallet = async () => {
    await open();
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const switchWalletAccount = async () => {
    if (!isOnCorrectNetwork) {
      try {
        await switchChain({ chainId: studionet.id });
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
