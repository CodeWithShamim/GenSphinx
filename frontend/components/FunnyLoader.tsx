'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Brain, Sparkles } from 'lucide-react';

const FUNNY_MESSAGES = [
  "Consulting the digital oracle...",
  "The Sphinx is drinking coffee...",
  "Asking a rubber duck for the answer...",
  "Feeding the server some cookies...",
  "Teaching a cat how to solve riddles...",
  "Calculating the meaning of life (it's 42)...",
  "Doing some digital yoga...",
  "Spinning up the brain gears...",
  "Waking up the internet...",
  "Polishing the crystal ball...",
  "Debugging the matrix...",
  "Mining some extra brain cells...",
  "Searching for the lost sock...",
  "Negotiating with the bits and bytes...",
  "Charging the riddle batteries...",
];

const FUNNY_EMOJIS = ["🧙‍♂️", "🤖", "🐱‍💻", "🧠", "⚡️", "🍪", "🦄", "🎭", "🍕", "🚀"];

interface FunnyLoaderProps {
  isOpen: boolean;
  message?: string;
}

export function FunnyLoader({ isOpen, message }: FunnyLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(FUNNY_MESSAGES[0]);
  const [currentEmoji, setCurrentEmoji] = useState(FUNNY_EMOJIS[0]);

  // Stable random positions for sparkles to prevent re-calculation on every render
  const sparklePositions = useMemo(() => 
    [...Array(6)].map(() => ({
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
    })), []);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentMessage(prev => {
        const remaining = FUNNY_MESSAGES.filter(m => m !== prev);
        return remaining[Math.floor(Math.random() * remaining.length)];
      });
      setCurrentEmoji(prev => {
        const remaining = FUNNY_EMOJIS.filter(e => e !== prev);
        return remaining[Math.floor(Math.random() * remaining.length)];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto"
        >
          <div className="relative max-w-md w-full p-8 text-center space-y-8">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 180, 360],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="w-64 h-64 bg-accent/20 rounded-full blur-3xl"
              />
            </div>

            {/* Funny Character Animation Area */}
            <div className="relative h-40 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEmoji}
                  initial={{ scale: 0, y: 20, opacity: 0 }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, -5, 5, 0],
                    y: 0,
                    opacity: 1
                  }}
                  exit={{ scale: 0, y: -20, opacity: 0 }}
                  transition={{ 
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                  className="text-8xl cursor-default select-none z-10"
                >
                  {currentEmoji}
                </motion.div>
              </AnimatePresence>

              {/* Dancing Sparkles */}
              {sparklePositions.map((pos, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: pos.x,
                    y: pos.y,
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                  className="absolute text-2xl"
                >
                  ✨
                </motion.div>
              ))}

              {/* Floating Icons */}
              <motion.div
                animate={{ y: [-10, 10, -10], x: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 left-1/4 text-accent opacity-30"
              >
                <Brain className="w-8 h-8" />
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10], x: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute bottom-0 right-1/4 text-accent opacity-30"
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
            </div>

            {/* Message Area */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.h3
                  key={currentMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-400"
                >
                  {message || currentMessage}
                </motion.h3>
              </AnimatePresence>
              
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 bg-accent rounded-full"
                  />
                ))}
              </div>
            </div>

            <p className="text-muted-foreground text-sm font-medium italic">
              Please wait while we do some magic...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
