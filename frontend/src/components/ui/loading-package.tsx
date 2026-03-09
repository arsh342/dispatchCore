import React from "react";

const LoadingPackage: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <svg
        viewBox="0 0 200 200"
        className="package-loader w-[80px] fill-transparent stroke-current text-primary"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Box body */}
        <path d="M30 70 L100 35 L170 70 L170 150 L100 185 L30 150 Z" />
        {/* Box center line */}
        <path d="M100 35 L100 185" />
        {/* Box left crease */}
        <path d="M30 70 L100 105 L170 70" />
        {/* Box flap left */}
        <path d="M30 70 L60 45 L100 35" />
        {/* Box flap right */}
        <path d="M170 70 L140 45 L100 35" />
        {/* Tape line */}
        <path d="M100 15 L100 55" />
        {/* Small arrow on top */}
        <path d="M85 30 L100 15 L115 30" />
      </svg>

      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}

      <style>{`
        .package-loader {
          --len: 900;
          stroke-dashoffset: var(--len);
          stroke-dasharray: 0 var(--len);
          animation: draw-package 3s cubic-bezier(0.4, 0, 0.2, 1) infinite both;
        }

        @keyframes draw-package {
          0% {
            stroke-dashoffset: var(--len);
            stroke-dasharray: 0 var(--len);
          }
          50% {
            stroke-dashoffset: 0;
            stroke-dasharray: var(--len) 0;
          }
          100% {
            stroke-dashoffset: calc(var(--len) * -1);
            stroke-dasharray: 0 var(--len);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingPackage;
