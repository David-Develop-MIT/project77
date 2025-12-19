import React from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function NotificationBell({ count = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
    >
      <Bell className="w-5 h-5 text-slate-600" />
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold text-white"
            >
              {count > 9 ? '9+' : count}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}