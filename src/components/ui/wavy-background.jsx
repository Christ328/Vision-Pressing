import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className = "",
  containerClassName = "",
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}) => {
  const noise = createNoise3D();
  let w, h, nt, i, x, ctx, canvas;
  const canvasRef = useRef(null);

  const getSpeed = () => (speed === "fast" ? 0.002 : 0.001);

  const init = () => {
    canvas = canvasRef.current;
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    const setCanvasSize = () => {
      w = ctx.canvas.width  = parent.offsetWidth  || window.innerWidth;
      h = ctx.canvas.height = parent.offsetHeight || window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };

    setCanvasSize();
    nt = 0;
    window.addEventListener("resize", setCanvasSize, { passive: true });
    render();

    return () => window.removeEventListener("resize", setCanvasSize);
  };

  const waveColors = colors ?? ["#c9a84c", "#6366f1", "#1a1535", "#10b981", "#f59e0b"];

  const drawWave = (n) => {
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.lineWidth = waveWidth || 50;
      ctx.strokeStyle = waveColors[i % waveColors.length];
      for (x = 0; x < w; x += 5) {
        const y = noise(x / 800, 0.3 * i, nt) * 100;
        ctx.lineTo(x, y + h * 0.5);
      }
      ctx.stroke();
      ctx.closePath();
    }
  };

  let animationId;
  let lastTime = 0;
  const render = (timestamp = 0) => {
    // Throttle à ~30fps pour économiser le GPU sur mobile
    if (timestamp - lastTime < 33) {
      animationId = requestAnimationFrame(render);
      return;
    }
    lastTime = timestamp;
    ctx.fillStyle   = backgroundFill || "#0a0805";
    ctx.globalAlpha = waveOpacity || 0.5;
    ctx.fillRect(0, 0, w, h);
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    const cleanupResize = init();
    return () => {
      cancelAnimationFrame(animationId);
      if (cleanupResize) cleanupResize();
    };
  }, []);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      className={`wavy-background-container ${containerClassName}`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        minHeight: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      />
      <div
        className={className}
        style={{ position: "relative", zIndex: 10, width: "100%" }}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};
