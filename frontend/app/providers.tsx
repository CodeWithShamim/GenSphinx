"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WalletProvider } from "@/lib/genlayer/WalletProvider";
import { projectId, studionet, metadata } from "@/lib/genlayer/wagmi-config";

// Setup queryClient
const queryClient = new QueryClient();

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks: [studionet]
});

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [studionet],
  projectId,
  metadata,
  features: {
    analytics: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': 'oklch(0.65 0.22 300)',
    '--w3m-border-radius-master': '12px'
  }
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {children}
        </WalletProvider>
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          offset="80px"
          toastOptions={{
            style: {
              background: 'oklch(0.25 0.08 265 / 0.8)',
              border: '1px solid oklch(0.30 0.10 265 / 0.4)',
              color: 'oklch(0.98 0 0)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
