import { motion } from "framer-motion";

const AppLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">

      {/* 🌄 FIXED BACKGROUND (GLOBAL LAYER) */}
      <div className="fixed inset-0 w-screen h-screen pointer-events-none">
        
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-40"
          alt="background"
        />

       
      </div>

      {/* CONTENT LAYER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 min-h-screen text-[#e7d7b1]"
      >
        {children}
      </motion.div>

    </div>
  );
};

export default AppLayout;