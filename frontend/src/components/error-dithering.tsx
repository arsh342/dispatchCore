import { Suspense, lazy } from "react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  }))
);

/**
 * Subtle branded dithering background for error pages.
 * Uses the same muted accent color as auth pages.
 */
export function ErrorDithering() {
  return (
    <div 
      className="absolute inset-0 z-0 pointer-events-none opacity-30"
      style={{
        maskImage:
          "radial-gradient(circle at center, transparent 30%, black 100%)",
        WebkitMaskImage:
          "radial-gradient(circle at center, transparent 30%, black 100%)",
      }}
    >
      <Suspense fallback={null}>
        <Dithering
          colorBack="#00000000"
          colorFront="#5c2d0e"
          shape="warp"
          type="4x4"
          speed={0.05}
          className="size-full"
          minPixelRatio={1}
        />
      </Suspense>
    </div>
  );
}
