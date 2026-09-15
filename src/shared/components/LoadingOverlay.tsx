import { AnimatePresence, motion } from "framer-motion";
import { LoaderIcon } from "lucide-react";
import { useLoadingStore } from "@/shared/store/loading.store";

export default function LoadingOverlay() {
  const { visible, message } = useLoadingStore();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-white dark:bg-gray-900 px-8 py-6 shadow-xl border border-gray-100 dark:border-gray-800"
          >
            <LoaderIcon className="animate-spin size-8 text-brand-500 dark:text-brand-400" />
            {message && (
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {message}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
