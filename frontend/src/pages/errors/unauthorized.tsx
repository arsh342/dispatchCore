import { motion, type Variants } from "framer-motion";
import { ArrowLeftIcon, LockKeyhole } from "lucide-react";
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

const lockVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  wiggle: {
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.6,
      ease: [0.42, 0, 0.58, 1],
      repeat: Infinity,
      repeatDelay: 4,
    },
  },
};

export default function UnauthorizedPage() {
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
              4
            </motion.span>

            <motion.div
              className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10"
              variants={lockVariants}
              animate={["visible", "wiggle"]}
            >
              <LockKeyhole className="w-12 h-12 md:w-16 md:h-16 text-primary" />
            </motion.div>

            <motion.span
              className="text-7xl md:text-8xl font-bold text-foreground/80 select-none"
              variants={fadeCenter}
            >
              1
            </motion.span>
          </div>

          <motion.h1
            className="mb-4 text-3xl md:text-5xl font-semibold tracking-tight text-foreground"
            variants={fadeCenter}
          >
            Authentication required
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-md text-base md:text-lg text-muted-foreground/70"
            variants={fadeCenter}
          >
            You need to sign in to access this page. Please log in with your
            credentials to continue.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3"
            variants={fadeCenter}
          >
            <Button
              onClick={() => navigate("/login")}
              className="gap-2 rounded-full hover:scale-105 transition-all duration-500 cursor-pointer"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
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
