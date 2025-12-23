import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationToast({ title, description, icon, color, onClose, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-20 right-4 z-[100] max-w-sm"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
        onClick={onClick}
      >
        <div 
          className="h-1.5"
          style={{ backgroundColor: color || '#3b82f6' }}
        />
        <div className="p-4">
          <div className="flex items-start gap-3">
            {icon && (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
              <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="rounded-lg flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}