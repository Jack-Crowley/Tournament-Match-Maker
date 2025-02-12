"use client"

import { motion } from 'framer-motion';

export const SpinningLoader = ({ text = "" }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[83vh]">
      {text && (
        <h1 className='mb-8'>{text}</h1>
      )}

      <motion.div
        className="w-16 h-16 border-4 border-[#604BAC] border-t-[#9380d7] rounded-full"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      />
      
    </div>
  );
};