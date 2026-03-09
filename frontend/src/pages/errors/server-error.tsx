import { motion, type Variants } from "framer-motion";
import { ArrowLeftIcon, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ErrorDithering } from "@/components/error-dithering";

const fadeCenter: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const iconPulse: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      ease: [0.42, 0, 0.58, 1],
      repeat: Infinity,
    },
  },
};

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center items-center px-4 h-[100vh] bg-background relative overflow-hidden">
      <ErrorDithering />
      
        <motion.div
          className="text-center relative z-10"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={fadeCenter}
        >
          <div className="flex items-center justify-center gap-6 mb-10">
            <motion.span
              className="text-7xl md:text-8xl font-bold text-foreground/80 select-none"
              variants={fadeCenter}
            >
              5
            </motion.span>

            <motion.div
              className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-destructive/10"
              variants={iconPulse}
              animate={["visible", "pulse"]}
            >
              <ServerCrash className="w-12 h-12 md:w-16 md:h-16 text-destructive" />
            </motion.div>

            <motion.span
              className="text-7xl md:text-8xl font-bold text-foreground/80 select-none"
              variants={fadeCenter}
            >
              0
            </motion.span>
          </div>

          <motion.h1
            className="mb-4 text-3xl md:text-5xl font-semibold tracking-tight text-foreground"
            variants={fadeCenter}
          >
            Server breakdown
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-md text-base md:text-lg text-muted-foreground/70"
            variants={fadeCenter}
          >
            Something went wrong on our end. Our team has been notified and is
            working to fix it. Please try again later.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3"
            variants={fadeCenter}
          >
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2 rounded-full hover:scale-105 transition-all duration-500 cursor-pointer"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="gap-2 rounded-full hover:scale-105 transition-all duration-500 cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Home
            </Button>
          </motion.div>
        </motion.div>
      
    </div>
  );
}
