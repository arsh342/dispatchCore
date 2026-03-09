import { useEffect } from "react";

/**
 * Animated favicon – three small boxes bounce up and down
 * in sequence on a dark circular background.
 * Runs at ~20 fps to keep CPU usage low.
 */
export function useAnimatedFavicon() {
  useEffect(() => {
    const SIZE = 64;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Grab or create the favicon link element
    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"]'
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    const PRIMARY = "#ea580c"; // theme orange
    const BG = "#1c1917"; // stone-900

    // Three boxes with staggered phase
    const boxes = [
      { x: 12, phase: 0 },
      { x: 26, phase: 0.33 },
      { x: 40, phase: 0.66 },
    ];

    const BOX_W = 12;
    const BOX_H = 10;
    const BASE_Y = 40; // resting Y position
    const BOUNCE = 10; // bounce height
    const SPEED = 3; // animation speed

    let frame = 0;
    let rafId: number;

    function draw() {
      if (!ctx) return;
      const t = frame * 0.05 * SPEED;

      // Clear & draw circular dark background
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = BG;
      ctx.fill();

      // Draw each box
      boxes.forEach((box) => {
        const bounce = Math.abs(Math.sin((t + box.phase * Math.PI * 2)));
        const y = BASE_Y - bounce * BOUNCE;

        // Box shadow
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(box.x - 1, BASE_Y + BOX_H + 1, BOX_W + 2, 2);

        // Box body
        ctx.fillStyle = PRIMARY;
        ctx.fillRect(box.x, y, BOX_W, BOX_H);

        // Box top flap (darker shade)
        ctx.fillStyle = "#c2410c";
        ctx.beginPath();
        ctx.moveTo(box.x, y);
        ctx.lineTo(box.x + BOX_W / 2, y - 4);
        ctx.lineTo(box.x + BOX_W, y);
        ctx.closePath();
        ctx.fill();

        // Box "tape" line
        ctx.strokeStyle = BG;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(box.x + BOX_W / 2, y - 3);
        ctx.lineTo(box.x + BOX_W / 2, y + BOX_H);
        ctx.stroke();
      });

      // Update favicon
      link!.type = "image/png";
      link!.href = canvas.toDataURL("image/png");

      frame++;
      rafId = window.setTimeout(() => requestAnimationFrame(draw), 50); // ~20fps
    }

    draw();

    return () => {
      clearTimeout(rafId);
    };
  }, []);
}
