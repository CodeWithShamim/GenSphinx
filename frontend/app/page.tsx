"use client";

import { Navbar } from "@/components/Navbar";
import { RiddleGame } from "@/components/RiddleGame";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - Padding to account for fixed navbar */}
      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              GenSphinx
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Challenge yourself with AI-generated riddles on the GenLayer blockchain.
              <br />
              Solve riddles, earn points, and climb the global leaderboard.
            </p>
          </div>

          {/* Game Content */}
          <div className="animate-slide-up">
            <RiddleGame />
          </div>

          {/* Info Section */}
          <div className="mt-12 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-bold mb-6">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="text-accent font-bold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent text-sm">1</span>
                  Generate Riddle
                </div>
                <p className="text-sm text-muted-foreground">
                  Click 'Generate' to have the GenLayer AI create a unique riddle just for you, stored directly on the blockchain.
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-accent font-bold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent text-sm">2</span>
                  Submit Answer
                </div>
                <p className="text-sm text-muted-foreground">
                  Type your answer. The GenLayer Intelligent Contract uses an LLM to evaluate your response semantically.
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-accent font-bold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent text-sm">3</span>
                  Climb Leaderboard
                </div>
                <p className="text-sm text-muted-foreground">
                  Each correct answer increases your score. Compete with the community to see who is the ultimate Riddle Master!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <a
                  href="https://genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Powered by GenLayer
                </a>
                <a
                  href="https://studio.genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Studio
                </a>
                <a
                  href="https://docs.genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Docs
                </a>
              </div>
              <div>
                © 2026 GenSphinx • Built for GenLayer Community
              </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
