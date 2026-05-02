"use client";

import { useState } from "react";
import {
  useCurrentRiddle,
  useSubmitAnswer,
  useGenerateRiddle,
  usePlayerScore,
  useLeaderboard,
} from "@/lib/hooks/useRiddleMaster";
import { useWallet } from "@/lib/genlayer/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Brain, Send, Trophy, Sparkles, AlertCircle } from "lucide-react";
import { AddressDisplay } from "./AddressDisplay";

export function RiddleGame() {
  const { address, isConnected } = useWallet();
  const { data: riddle, isLoading: isLoadingRiddle, isError: isErrorRiddle } = useCurrentRiddle();
  const { data: score } = usePlayerScore(address);
  const { data: leaderboard } = useLeaderboard();
  
  const { submitAnswer, isSubmitting } = useSubmitAnswer();
  const { generateRiddle, isGenerating } = useGenerateRiddle();
  
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    submitAnswer(answer, {
      onSuccess: () => setAnswer(""),
    });
  };

  const handleGenerate = () => {
    generateRiddle();
  };

  if (!isConnected) {
    return (
      <div className="brand-card p-8 text-center space-y-4">
        <Brain className="w-16 h-16 mx-auto text-accent opacity-50" />
        <h2 className="text-2xl font-bold">Ready to test your wit?</h2>
        <p className="text-muted-foreground">Connect your wallet to start playing the AI Riddle Master game.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Game Section */}
      <div className="brand-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full border border-accent/30">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="font-bold text-accent">Score: {score ?? 0}</span>
            </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-accent" />
          <h2 className="text-2xl font-bold">GenSphinx</h2>
        </div>

        {isLoadingRiddle ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">Fetching your riddle from the blockchain...</p>
          </div>
        ) : isErrorRiddle || riddle === "No riddle generated yet." || riddle === "Please connect your wallet." ? (
          <div className="text-center py-12 space-y-6">
            <div className="space-y-2">
                <Sparkles className="w-12 h-12 mx-auto text-accent opacity-50" />
                <h3 className="text-xl font-semibold">No active riddle</h3>
                <p className="text-muted-foreground">Ask the AI to challenge you with a new riddle!</p>
            </div>
            <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                size="lg"
                className="bg-accent hover:bg-accent/80 text-white px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate New Riddle"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 italic text-lg md:text-xl text-center">
              "{riddle}"
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 h-12 text-lg"
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || !answer.trim()}
                className="h-12 px-8 bg-accent hover:bg-accent/80 text-white text-lg font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                Submit Answer
              </Button>
            </form>

            <div className="flex justify-center">
                <Button 
                    variant="ghost" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || isSubmitting}
                    className="text-muted-foreground hover:text-accent"
                >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Skip / Get New Riddle
                </Button>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="brand-card p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          GenSphinx Leaderboard
        </h2>

        {!leaderboard || leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No scores yet. Be the first to solve a riddle!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard.map((entry, index) => (
              <div 
                key={entry.address}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  address?.toLowerCase() === entry.address?.toLowerCase() 
                  ? "bg-accent/20 border-accent/50" 
                  : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground w-6">#{index + 1}</span>
                  <AddressDisplay address={entry.address} maxLength={6} />
                </div>
                <div className="font-bold text-accent">{entry.points} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
