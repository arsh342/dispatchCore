import { motion, type Variants } from "framer-motion";
import { ArrowLeftIcon, CloudOff } from "lucide-react";
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

const cloudVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  float: {
    y: [-3, 3],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 4,
      ease: [0.42, 0, 0.58, 1],
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export default function ServiceUnavailablePage() {
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
              className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted"
              variants={cloudVariants}
              animate={["visible", "float"]}
            >
              <CloudOff className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
            </motion.div>

            <motion.span
              className="text-7xl md:text-8xl font-bold text-foreground/80 select-none"
              variants={fadeCenter}
            >
              3
            </motion.span>
          </div>

          <motion.h1
            className="mb-4 text-3xl md:text-5xl font-semibold tracking-tight text-foreground"
            variants={fadeCenter}
          >
            Under maintenance
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-md text-base md:text-lg text-muted-foreground/70"
            variants={fadeCenter}
          >
            We're performing scheduled maintenance to improve your experience.
            We'll be back shortly — thanks for your patience.
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
              Refresh Page
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
