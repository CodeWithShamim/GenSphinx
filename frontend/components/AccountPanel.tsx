"use client";

import { User, LogOut, Wallet, ExternalLink } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { usePlayerScore } from "@/lib/hooks/useRiddleMaster";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

export function AccountPanel() {
  const {
    address,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchWalletAccount,
    isOnCorrectNetwork,
  } = useWallet();

  const { data: score = 0 } = usePlayerScore(address);

  if (!isConnected) {
    return (
      <Button 
        onClick={connectWallet} 
        disabled={isLoading} 
        variant="gradient" 
        className="rounded-xl h-10 px-5 font-bold shadow-lg hover:shadow-accent/20 transition-all"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <Dialog>
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

      <DialogContent className="brand-card border-accent/20 max-w-sm overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Sentinel Profile</DialogTitle>
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
              You are currently out of sync with GenLayer. Please align your network path in your wallet.
            </div>
          )}

          <div className="pt-6 border-t border-white/5 space-y-3">
            <Button
              onClick={switchWalletAccount}
              variant="outline"
              className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 font-bold"
            >
              <User className="w-4 h-4 mr-2 text-white/40" />
              Manage Account
            </Button>

            <Button
              onClick={disconnectWallet}
              variant="outline"
              className="w-full h-12 rounded-xl border-red-500/10 hover:bg-red-500/5 text-red-500/60 hover:text-red-500 font-bold transition-all"
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
