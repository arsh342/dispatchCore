import { motion, type Variants } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/cosmic-globe";
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

const globeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  floating: {
    y: [-4, 4],
    transition: {
      duration: 5,
      ease: [0.42, 0, 0.58, 1],
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export default function NotFoundPage() {
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
              className="relative w-24 h-24 md:w-32 md:h-32"
              variants={globeVariants}
              animate={["visible", "floating"]}
            >
              <Globe />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.08)_0%,transparent_70%)]" />
            </motion.div>

            <motion.span
              className="text-7xl md:text-8xl font-bold text-foreground/80 select-none"
              variants={fadeCenter}
            >
              4
            </motion.span>
          </div>

          <motion.h1
            className="mb-4 text-3xl md:text-5xl font-semibold tracking-tight text-foreground"
            variants={fadeCenter}
          >
            Lost in transit
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-md text-base md:text-lg text-muted-foreground/70"
            variants={fadeCenter}
          >
            The page you're looking for couldn't be found. It may have been
            moved, deleted, or never existed.
          </motion.p>

          <motion.div variants={fadeCenter}>
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
