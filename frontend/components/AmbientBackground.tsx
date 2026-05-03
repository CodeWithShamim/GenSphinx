"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Primary Gradient Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"
      />

      {/* Secondary Gradient Orb */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          x: [0, -50, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue/10 blur-[150px]"
      />

      {/* Tertiary Accent Orb */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-pink/10 blur-[100px]"
      />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
    </div>
  );
}
