import React from 'react';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <header className="w-full max-w-6xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center text-white">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight"
      >
        Exchange Knowledge. Master New Skills.
      </motion.h2>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl font-light"
      >
        Connect with real-world experts, trade your unique talents, and build global connections entirely peer-to-peer.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-10 flex gap-4"
      >
        <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-medium tracking-wide transition-all shadow-lg shadow-indigo-600/20">
          Find a Mentor
        </button>
        <button className="border border-gray-700 hover:border-gray-500 px-6 py-3 rounded-xl font-medium tracking-wide transition-all bg-gray-900/40 backdrop-blur-sm">
          Offer a Skill
        </button>
      </motion.div>
    </header>
  );
};

export default Header;