import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ServiceCard({ icon: Icon, title, description, color, selected, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl p-6 transition-all duration-300",
        "bg-white border-2 shadow-sm hover:shadow-xl",
        selected ? `border-${color} ring-2 ring-${color}/20` : "border-slate-100 hover:border-slate-200"
      )}
      style={{
        borderColor: selected ? color : undefined,
        boxShadow: selected ? `0 8px 30px ${color}20` : undefined
      }}
    >
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      
      <h3 className="font-semibold text-slate-800 text-lg mb-1">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}