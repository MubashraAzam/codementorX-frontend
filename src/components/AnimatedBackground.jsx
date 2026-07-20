import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
      {/* Soft Blurred Orbs — mirrors the landing's ambient palette */}
      <motion.div
        className="absolute top-[-12%] right-[-8%] w-[42%] h-[42%] rounded-full filter blur-3xl opacity-60"
        style={{ background: "rgba(244,155,0,0.14)" }}
        animate={{
          x: [0, 60, 0],
          y: [0, 70, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-[-12%] left-[-8%] w-[36%] h-[36%] rounded-full filter blur-3xl opacity-60"
        style={{ background: "rgba(37,54,124,0.10)" }}
        animate={{
          x: [0, 50, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-[38%] left-[30%] w-[28%] h-[28%] rounded-full filter blur-3xl opacity-50"
        style={{ background: "rgba(224,71,58,0.07)" }}
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Floating Code Snippets */}
      <motion.div
        className="absolute text-6xl font-mono text-accent/10 font-bold select-none top-[15%] left-[25%]"
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {"{ }"}
      </motion.div>

      <motion.div
        className="absolute text-8xl font-mono text-accent/10 font-bold select-none bottom-[20%] right-[15%]"
        animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        {"</>"}
      </motion.div>

      <motion.div
        className="absolute text-7xl font-mono text-accent/10 font-bold select-none top-[40%] right-[5%]"
        animate={{ y: [0, -25, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        {"[ ]"}
      </motion.div>
    </div>
  );
}
