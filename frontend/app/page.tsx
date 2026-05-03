"use client";

import { Navbar } from "@/components/Navbar";
import { RiddleGame } from "@/components/RiddleGame";
import { AmbientBackground } from "@/components/AmbientBackground";
import { motion } from "framer-motion";
import { Sparkles, Brain, Trophy } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-accent/30 selection:text-white">
      <AmbientBackground />
      
      {/* Navbar */}
      <Navbar />

      {/* Main Content - Padding to account for fixed navbar */}
      <main className="flex-grow pt-32 pb-20 px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold mb-4"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Blockchain Gaming
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
            >
              GenSphinx
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Challenge yourself with intelligent, AI-generated riddles stored on the GenLayer blockchain.
              Prove your wit, earn points, and climb the leaderboard.
            </motion.p>
          </div>

          {/* Game Content */}
          <div className="relative">
            {/* Subtle glow behind the game */}
            <div className="absolute inset-0 bg-accent/5 blur-[100px] -z-10 rounded-full scale-75" />
            <RiddleGame />
          </div>

          {/* Info Section - Modernized */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 space-y-12"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">How it Works</h2>
              <div className="w-20 h-1 bg-accent/30 mx-auto rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Sparkles,
                  title: "Generate Riddle",
                  desc: "Click 'Generate' to have the GenLayer AI create a unique riddle just for you, stored directly on the blockchain."
                },
                {
                  icon: Brain,
                  title: "Submit Answer",
                  desc: "Type your answer. The GenLayer Intelligent Contract uses an LLM to evaluate your response semantically."
                },
                {
                  icon: Trophy,
                  title: "Climb Leaderboard",
                  desc: "Each correct answer increases your score. Compete with the community to see who is the ultimate Riddle Master!"
                }
              ].map((item, i) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="brand-card p-8 group hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-20 bg-black/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-sm">
              <div className="flex items-center gap-8">
                <a
                  href="https://genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-colors font-medium"
                >
                  Powered by GenLayer
                </a>
                <a
                  href="https://studio.genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-colors font-medium"
                >
                  Studio
                </a>
                <a
                  href="https://docs.genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-colors font-medium"
                >
                  Docs
                </a>
              </div>
              <div className="text-white/20 font-medium">
                © 2026 GenSphinx • Built for GenLayer Community
              </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
