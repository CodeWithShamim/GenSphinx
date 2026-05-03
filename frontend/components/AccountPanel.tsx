"use client";

import { useState } from "react";
import { User, LogOut, AlertCircle, ExternalLink, ShieldCheck, Wallet, ChevronRight, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { usePlayerScore } from "@/lib/hooks/useRiddleMaster";
import { success, error, userRejected } from "@/lib/utils/toast";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";

const METAMASK_INSTALL_URL = "https://metamask.io/download/";

export function AccountPanel() {
  const {
    address,
    isConnected,
    isMetaMaskInstalled,
    isOnCorrectNetwork,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchWalletAccount,
  } = useWallet();

  const { data: score = 0 } = usePlayerScore(address);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError("");
      await connectWallet();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setConnectionError(err.message || "Failed to connect to MetaMask");

      if (err.message?.includes("rejected")) {
        userRejected("Connection cancelled");
      } else {
        error("Failed to connect wallet", {
          description: err.message || "Check your MetaMask and try again."
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsModalOpen(false);
  };

  const handleSwitchAccount = async () => {
    try {
      setIsSwitching(true);
      setConnectionError("");
      await switchWalletAccount();
    } catch (err: any) {
      console.error("Failed to switch account:", err);
      if (!err.message?.includes("rejected")) {
        setConnectionError(err.message || "Failed to switch account");
        error("Failed to switch account", {
          description: err.message || "Please try again."
        });
      } else {
        userRejected("Account switch cancelled");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="gradient" disabled={isLoading} className="rounded-xl h-10 px-5 font-bold">
            <Wallet className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </DialogTrigger>
        <DialogContent className="brand-card border-accent/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Connect Wallet</DialogTitle>
            <DialogDescription className="text-white/40">
              Access the digital oracle with GenLayer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {!isMetaMaskInstalled ? (
              <>
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    MetaMask Missing
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Please install MetaMask to interact with the Sphinx. It is a secure gateway to blockchain applications.
                  </p>
                </div>

                <Button
                  onClick={() => window.open(METAMASK_INSTALL_URL, "_blank")}
                  variant="gradient"
                  className="w-full h-14 text-lg rounded-2xl"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Get MetaMask
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleConnect}
                  variant="gradient"
                  className="w-full h-14 text-lg rounded-2xl group"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </Button>

                {connectionError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                    {connectionError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                    {[
                        "Authorize connection",
                        "Verify GenLayer network",
                        "Begin your journey"
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/40 font-medium">
                            <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent font-bold">{i+1}</div>
                            {step}
                        </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-1 pr-4 cursor-pointer transition-all shadow-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/30 shadow-inner">
                <User className="w-4 h-4 text-accent" />
            </div>
            <div className="flex flex-col">
                <AddressDisplay address={address} maxLength={6} className="text-xs font-bold leading-none" />
                <span className="text-[10px] font-black text-accent tracking-widest uppercase">{score} PTS</span>
            </div>
          </motion.div>
        </DialogTrigger>
      </div>

      <DialogContent className="brand-card border-accent/20 max-w-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Sentinel Profile</DialogTitle>
          <DialogDescription className="text-white/40">Your status in the GenSphinx arena</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/20">
                <span>Identity</span>
                <span className="text-accent/60">Verified</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                <AddressDisplay address={address} maxLength={12} className="font-mono text-sm" />
                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-accent transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">Accumulated Wit</span>
                <div className="text-2xl font-black text-accent leading-none">{score} <span className="text-xs opacity-50">PTS</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">Network Path</span>
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", isOnCorrectNetwork ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-yellow-500 animate-pulse")} />
                    <span className="text-xs font-bold">{isOnCorrectNetwork ? "GENLAYER" : "UNKNOWN"}</span>
                </div>
            </div>
          </div>

          {!isOnCorrectNetwork && (
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[11px] font-medium leading-relaxed">
              You are currently out of sync with GenLayer. Please align your network path in MetaMask.
            </div>
          )}

          <div className="pt-6 border-t border-white/5 space-y-3">
            <Button
              onClick={handleSwitchAccount}
              variant="outline"
              className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 font-bold"
              disabled={isSwitching || isLoading}
            >
              <User className="w-4 h-4 mr-2 text-white/40" />
              Switch Account
            </Button>

            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="w-full h-12 rounded-xl border-red-500/10 hover:bg-red-500/5 text-red-500/60 hover:text-red-500 font-bold transition-all"
              disabled={isSwitching || isLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
