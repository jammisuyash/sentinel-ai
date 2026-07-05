import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal content body */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-lg rounded-lg border border-slate-900 bg-slate-950 p-6 shadow-2xl overflow-hidden select-none z-10"
          >
            {/* Tactical Grid Overlay & Corner Designs */}
            <div className="absolute inset-0 tactical-grid opacity-[0.05] pointer-events-none" />
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-800" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-800" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-800" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-800" />

            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
                <h3 className="font-display font-semibold tracking-wider text-sm uppercase text-slate-100">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded hover:bg-slate-900 text-slate-500 hover:text-slate-300 flex items-center justify-center transition-colors border border-transparent hover:border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Slot */}
            <div className="relative z-10 max-h-[70vh] overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
