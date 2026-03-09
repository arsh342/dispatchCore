import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-card/30"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 ring-8 ring-primary/5">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </motion.div>
  );
}
