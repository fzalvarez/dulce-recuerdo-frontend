import { LoaderIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
            <LoaderIcon className="animate-spin size-8" />
            <span>Dulce Recuerdo</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Cargando...
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
