
import { motion } from "framer-motion";

const GoldCard = ({ children }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="
        bg-[#1a1610]/70 
        border border-[#c8a96a]/30 
        backdrop-blur-md 
        rounded-2xl 
        p-6 
        shadow-lg
        shadow-black/40
      "
    >
      {children}
    </motion.div>
  );
};

export default GoldCard;