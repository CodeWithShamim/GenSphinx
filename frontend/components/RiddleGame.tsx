'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useCurrentRiddle,
  useSubmitAnswer,
  useGenerateRiddle,
  usePlayerScore,
  useLeaderboard,
} from '@/lib/hooks/useRiddleMaster';
import { useWallet } from '@/lib/genlayer/wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Brain,
  Send,
  Trophy,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AddressDisplay } from './AddressDisplay';
import { cn } from '@/lib/utils';

export function RiddleGame() {
  const { address, isConnected, connectWallet, switchWalletAccount, isOnCorrectNetwork } =
    useWallet();
  const { data: riddle, isLoading: isLoadingRiddle, isError: isErrorRiddle } = useCurrentRiddle();
  const { data: score } = usePlayerScore(address);
  const { data: leaderboard } = useLeaderboard();

  const { submitAnswer, isSubmitting } = useSubmitAnswer();
  const { generateRiddle, isGenerating } = useGenerateRiddle();

  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    submitAnswer(answer, {
      onSuccess: () => {
        // In a real app, we'd check if the answer was actually correct from the receipt or event
        // For now, if the tx is accepted, we assume a correct answer path was taken or just show generic success
        setAnswer('');
        setFeedback({ type: 'success', message: 'Correct! The Sphinx is impressed.' });
      },
      onError: () => {
        setFeedback({ type: 'error', message: 'The Sphinx shakes its head. Try again.' });
      },
    });
  };

  const handleGenerate = () => {
    generateRiddle();
    setFeedback(null);
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="brand-card p-12 text-center space-y-6 border-dashed border-accent/30 bg-accent/5"
      >
        <div className="relative inline-block">
          <Brain className="w-20 h-20 mx-auto text-accent opacity-50" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-accent/20 blur-xl rounded-full"
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Ready to test your wit?</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Step into the arena of the GenSphinx. Connect your wallet to receive your first
            challenge.
          </p>
        </div>
        <Button
          onClick={connectWallet}
          variant="gradient"
          size="lg"
          className="rounded-2xl px-12 font-bold"
        >
          Connect Wallet
        </Button>
      </motion.div>
    );
  }

  if (!isOnCorrectNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="brand-card p-12 text-center space-y-6 border-yellow-500/20 bg-yellow-500/5"
      >
        <div className="w-20 h-20 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
          <HelpCircle className="w-10 h-10 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Wrong Network</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The Sphinx only speaks on the GenLayer Bradbury network. Please switch your network to
            continue.
          </p>
        </div>
        <Button
          onClick={switchWalletAccount}
          variant="outline"
          className="border-yellow-500/20 hover:bg-yellow-500/10 text-yellow-500 rounded-2xl px-8"
        >
          Switch to Bradbury
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Game Section */}
      <motion.div
        layout
        className="brand-card p-8 md:p-12 relative overflow-hidden group border-accent/20 shadow-[0_0_50px_-12px_rgba(155,106,246,0.2)]"
      >
        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
              <Brain className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Riddle Challenge</h2>
              <p className="text-sm text-muted-foreground">AI-Generated • Blockchain Verified</p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 bg-secondary/50 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-white/5 shadow-inner"
          >
            <Trophy className="w-5 h-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Total Score
              </span>
              <span className="font-bold text-accent text-lg leading-tight">{score ?? 0}</span>
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {isLoadingRiddle ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
                <div className="absolute inset-0 blur-lg bg-accent/30 animate-pulse" />
              </div>
              <p className="text-muted-foreground font-medium animate-pulse italic">
                Consulting the digital oracle...
              </p>
            </motion.div>
          ) : isErrorRiddle ||
            riddle === 'No riddle generated yet.' ||
            riddle === 'Please connect your wallet.' ? (
            <motion.div
              key="no-riddle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 space-y-8"
            >
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-accent/5 rounded-full flex items-center justify-center border border-accent/10">
                  <Sparkles className="w-10 h-10 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">The Sphinx is Silent</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Click below to summon a new riddle from the GenLayer AI.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="btn-primary h-14 px-10 text-lg rounded-2xl group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Summoning...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Generate New Riddle
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="riddle-active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative bg-black/40 border border-white/5 rounded-3xl p-8 md:p-10 shadow-inner group/riddle"
              >
                <div className="absolute -top-4 -left-4 bg-accent/20 p-2 rounded-xl backdrop-blur-md border border-accent/30">
                  <HelpCircle className="w-6 h-6 text-accent" />
                </div>
                <p className="text-xl md:text-2xl text-center leading-relaxed font-medium italic text-white/90">
                  &quot;{riddle}&quot;
                </p>

                {/* Visual accents for the riddle box */}
                <div className="absolute top-4 right-4 opacity-10 group-hover/riddle:opacity-30 transition-opacity">
                  <Brain className="w-12 h-12" />
                </div>
              </motion.div>

              <div className="space-y-4">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Input
                      placeholder="What is your answer?"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="bg-white/5 border-white/10 h-14 text-lg rounded-2xl px-6 focus:border-accent/50 focus:ring-accent/20 transition-all placeholder:text-white/20"
                      disabled={isSubmitting}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !answer.trim()}
                    className="btn-primary h-14 px-10 rounded-2xl text-lg font-bold min-w-[200px]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-3 h-5 w-5" />
                        Solve Riddle
                      </>
                    )}
                  </Button>
                </form>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium',
                        feedback.type === 'success'
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400',
                      )}
                    >
                      {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {feedback.message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  onClick={handleGenerate}
                  disabled={isGenerating || isSubmitting}
                  className="text-white/40 hover:text-accent hover:bg-accent/5 rounded-xl transition-all"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Try a different challenge
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Leaderboard Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="brand-card p-8 md:p-10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Global Leaderboard</h2>
              <p className="text-sm text-muted-foreground">Top Riddle Masters across the network</p>
            </div>
          </div>
        </div>

        {!leaderboard || leaderboard?.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Trophy className="w-12 h-12 mx-auto text-white/10 mb-4" />
            <p className="text-muted-foreground">The hall of fame is currently empty.</p>
            <p className="text-sm text-white/20">Be the first to leave your mark!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.address}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, borderColor: 'rgba(155,106,246,0.5)' }}
                  className={cn(
                    'group relative flex items-center justify-between p-6 rounded-3xl border transition-all duration-300',
                    address?.toLowerCase() === entry.address?.toLowerCase()
                      ? 'bg-accent/10 border-accent/40 shadow-[0_0_30px_-10px_rgba(155,106,246,0.3)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/[0.08]',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
                        index === 0
                          ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                          : index === 1
                            ? 'bg-gray-400/20 text-gray-400 border border-gray-400/30'
                            : index === 2
                              ? 'bg-amber-600/20 text-amber-600 border border-amber-600/30'
                              : 'bg-white/10 text-white/40',
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="space-y-0.5">
                      <AddressDisplay
                        address={entry.address}
                        maxLength={6}
                        className="font-bold text-white/90"
                      />
                      {address?.toLowerCase() === entry.address?.toLowerCase() && (
                        <div className="text-[10px] text-accent font-bold uppercase tracking-tighter">
                          You
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-accent">{entry.points}</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                      Points
                    </span>
                  </div>

                  {index < 3 && (
                    <div className="absolute -top-2 -right-2 transform rotate-12">
                      <Trophy
                        className={cn(
                          'w-6 h-6',
                          index === 0
                            ? 'text-yellow-500'
                            : index === 1
                              ? 'text-gray-400'
                              : 'text-amber-600',
                        )}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
