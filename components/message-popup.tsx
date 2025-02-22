import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface MessagePopupProps {
  color: 'green' | 'red' | 'blue' | 'yellow';
  children: React.ReactNode;
  index: number;
  onClose: () => void;
}

export const MessagePopup: React.FC<MessagePopupProps> = ({ color, children, index, onClose }) => {
  const colorsBorder = {
    green: 'border-green-300',
    red: 'border-red-300',
    blue: 'border-blue-300',
    yellow: 'border-yellow-300',
  };

  const colorsFill = {
    green: 'bg-green-700',
    red: 'bg-red-700',
    blue: 'bg-blue-700',
    yellow: 'bg-yellow-700',
  };

  return (
    <motion.div
      className={`w-[60%] ml-[20%] mx-auto absolute p-3 rounded-md shadow-lg text-white ${colorsBorder[color]} ${colorsFill[color]}`}
      style={{
        top: `${index * 60 + 20}px`,
      }}
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-medium">{children}</h1>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </motion.div>
  );
};