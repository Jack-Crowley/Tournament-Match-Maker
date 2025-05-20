import { motion } from "framer-motion";

export const Checkbox = ({ checked, onChange, deep=false }: { deep?:boolean, checked: boolean; onChange: () => void }) => {
  return (
    <motion.div
      className={`ml-3 relative w-5 h-5 rounded-md border-2 ${deep ? "border-deep" : "border-soft"} flex items-center justify-center cursor-pointer`}
      style={{ backgroundColor: checked ? deep ? "#31216b" : "#7864c0" : "transparent" }}
      onClick={() => {
        onChange();
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {checked && (
        <motion.svg
          className="w-3 h-3 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <polyline points="20 6 9 17 4 12" />
        </motion.svg>
      )}
    </motion.div>
  );
};

export const CheckboxWithEvent = ({ checked, onChange, deep=false }: { deep?:boolean, checked: boolean; onChange: (e : any) => void }) => {
  return (
    <motion.div
      className={`relative w-5 h-5 rounded-md border-2 ${deep ? "border-deep" : "border-soft"} flex items-center justify-center cursor-pointer`}
      style={{ backgroundColor: checked ? deep ? "#31216b" : "#7864c0" : "transparent" }}
      onClick={(e) => onChange(e)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {checked && (
        <motion.svg
          className="w-3 h-3 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <polyline points="20 6 9 17 4 12" />
        </motion.svg>
      )}
    </motion.div>
  );
};