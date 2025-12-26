import React from 'react';
import { motion } from 'framer-motion';

export default function IndicadorDigitando({ nome }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500"
    >
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-slate-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-slate-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-slate-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
        />
      </div>
      <span>{nome} está digitando...</span>
    </motion.div>
  );
}