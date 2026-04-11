import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type LoadingPackageProps = {
  text?: string;
  delay?: number;
  className?: string;
};

/**
 * Shared delayed loader used across pages/components.
 * It only appears if loading lasts longer than `delay`.
 */
export default function LoadingPackage({
  text = "Loading...",
  delay = 500,
  className = "",
}: LoadingPackageProps) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShouldShow(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 ${className}`}
      style={{
        background:
          "linear-gradient(135deg, hsl(20 10% 8%) 0%, hsl(20 8% 14%) 40%, hsl(20 6% 10%) 100%)",
      }}
    >
      <DotLottieReact
        src="/Untitled file.lottie"
        loop
        autoplay
        className="h-40 w-40 md:h-56 md:w-56"
      />

      {text ? (
        <p className="text-sm font-medium text-muted-foreground/90">{text}</p>
      ) : null}
    </div>
  );
}
