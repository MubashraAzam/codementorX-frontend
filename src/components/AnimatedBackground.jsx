import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
      {/* Soft Blurred Blobs */}
      <motion.div 
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div 
        className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        animate={{
          x: [0, -50, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Floating Code Snippets */}
      <motion.div
        className="absolute text-6xl font-mono text-gray-200 font-bold opacity-30 select-none top-[15%] left-[25%]"
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {"{ }"}
      </motion.div>

      <motion.div
        className="absolute text-8xl font-mono text-gray-200 font-bold opacity-30 select-none bottom-[20%] right-[15%]"
        animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        {"</>"}
      </motion.div>

      <motion.div
        className="absolute text-7xl font-mono text-gray-200 font-bold opacity-30 select-none top-[40%] right-[5%]"
        animate={{ y: [0, -25, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        {"[ ]"}
      </motion.div>
    </div>
  );
}
