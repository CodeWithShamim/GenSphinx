"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AccountPanel } from "./AccountPanel";
import { Logo } from "./Logo";
import { Brain } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "py-3 px-4 md:px-8" 
          : "py-6 px-4 md:px-12"
      }`}
    >
      <div
        className={`max-w-7xl mx-auto transition-all duration-300 ${
          isScrolled 
            ? "bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
            : "bg-transparent px-0 py-0"
        }`}
      >
        <div className="flex items-center justify-between h-12">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
                <Logo variant="mark" size="md" />
                <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-accent/20 blur-md rounded-full -z-10"
                />
            </div>
            <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black tracking-tighter">GenSphinx</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity">Intelligent</span>
            </div>
          </div>

          {/* Center: Quote (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium text-white/40 italic bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
            <Brain className="w-3.5 h-3.5 text-accent" />
            <span>&quot;The Sphinx is the guardian of the digital oracle&quot;</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <AccountPanel />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
