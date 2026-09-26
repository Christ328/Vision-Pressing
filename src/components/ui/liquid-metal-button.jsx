import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * LiquidMetalButton — adapté pour React/Vite sans Tailwind ni TypeScript.
 * Props:
 *   label     — texte du bouton (défaut: "Obtenir un devis")
 *   onClick   — callback on click
 *   viewMode  — "text" | "icon"
 *   width     — largeur du bouton en px (défaut: auto selon viewMode)
 */
export function LiquidMetalButton({
  label = "Obtenir un devis",
  onClick,
  viewMode = "text",
  width,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const shaderRef = useRef(null);
  const shaderMount = useRef(null);
  const buttonRef = useRef(null);
  const rippleId = useRef(0);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return { width: 46, height: 46, innerWidth: 42, innerHeight: 42, shaderWidth: 46, shaderHeight: 46 };
    }
    const w = width || 200;
    return { width: w, height: 46, innerWidth: w - 4, innerHeight: 42, shaderWidth: w, shaderHeight: 46 };
  }, [viewMode, width]);

  useEffect(() => {
    const styleId = "shader-canvas-style-vp";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-vp canvas {
          width: 100% !important; height: 100% !important;
          display: block !important; position: absolute !important;
          top: 0 !important; left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-vp {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
        @keyframes rainbowBorder {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = () => {
      try {
        if (shaderRef.current) {
          if (shaderMount.current?.destroy) shaderMount.current.destroy();
          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: 4, u_softness: 0.5,
              u_shiftRed: 0.3, u_shiftBlue: 0.3,
              u_distortion: 0, u_contour: 0,
              u_angle: 45, u_scale: 8,
              u_shape: 1, u_offsetX: 0.1, u_offsetY: -0.1,
            },
            undefined,
            0.6,
          );
        }
      } catch (error) {
        console.error("[VP] Shader failed:", error);
      }
    };

    loadShader();
    return () => { if (shaderMount.current?.destroy) { shaderMount.current.destroy(); shaderMount.current = null; } };
  }, []);

  const handleMouseEnter = () => { setIsHovered(true); shaderMount.current?.setSpeed?.(1); };
  const handleMouseLeave = () => { setIsHovered(false); setIsPressed(false); shaderMount.current?.setSpeed?.(0.6); };
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);

  const handleClick = (e) => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => {
        shaderMount.current?.setSpeed?.(isHovered ? 1 : 0.6);
      }, 300);
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ };
      setRipples(prev => [...prev, ripple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== ripple.id)), 600);
    }
    onClick?.();
  };

  const shadowDefault = "0px 0px 0px 1px rgba(0,0,0,0.3), 0px 9px 9px 0px rgba(0,0,0,0.12), 0px 2px 5px 0px rgba(0,0,0,0.15)";
  const shadowHovered = "0px 0px 0px 1px rgba(0,0,0,0.4), 0px 12px 6px 0px rgba(0,0,0,0.05), 0px 8px 5px 0px rgba(0,0,0,0.1), 0px 4px 4px 0px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.2)";
  const shadowPressed = "0px 0px 0px 1px rgba(0,0,0,0.5), 0px 1px 2px 0px rgba(0,0,0,0.3)";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}>
        <div 
          style={{ 
            position: "relative", 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`, 
            transformStyle: "preserve-3d",
            borderRadius: "100px",
            padding: "2px",
            background: "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)",
            animation: "rainbowBorder 3s linear infinite",
            transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1)"
          }}
        >
          
          {/* Label layer */}
          <div style={{ position: "absolute", top: 0, left: 0, width: `${dimensions.width}px`, height: `${dimensions.height}px`, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transformStyle: "preserve-3d", transform: "translateZ(20px)", zIndex: 30, pointerEvents: "none" }}>
            {viewMode === "icon" ? (
              <Sparkles size={16} style={{ color: "#888", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
            ) : (
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#ddd", textShadow: "0px 1px 2px rgba(0,0,0,0.6)", fontFamily: "'Open Sans', sans-serif", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                {label}
              </span>
            )}
          </div>

          {/* Inner dark background */}
          <div style={{ position: "absolute", top: 0, left: 0, width: `${dimensions.width}px`, height: `${dimensions.height}px`, transformStyle: "preserve-3d", transform: `translateZ(10px) ${isPressed ? "translateY(1px) scale(0.98)" : ""}`, zIndex: 20 }}>
            <div style={{ width: `${dimensions.innerWidth}px`, height: `${dimensions.innerHeight}px`, margin: "2px", borderRadius: "100px", background: "linear-gradient(180deg, #202020 0%, #000 100%)", boxShadow: isPressed ? "inset 0 2px 4px rgba(0,0,0,0.4)" : "none", transition: "box-shadow 0.15s ease" }} />
          </div>

          {/* Shader outer ring */}
          <div style={{ position: "absolute", top: 0, left: 0, width: `${dimensions.width}px`, height: `${dimensions.height}px`, transformStyle: "preserve-3d", transform: `translateZ(0px) ${isPressed ? "translateY(1px) scale(0.98)" : ""}`, zIndex: 10 }}>
            <div style={{ height: `${dimensions.height}px`, width: `${dimensions.width}px`, borderRadius: "100px", boxShadow: isPressed ? shadowPressed : isHovered ? shadowHovered : shadowDefault, transition: "box-shadow 0.15s ease" }}>
              <div ref={shaderRef} className="shader-container-vp" style={{ borderRadius: "100px", overflow: "hidden", position: "relative", width: `${dimensions.shaderWidth}px`, height: `${dimensions.shaderHeight}px` }} />
            </div>
          </div>

          {/* Clickable button */}
          <button
            ref={buttonRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            aria-label={label}
            style={{ position: "absolute", top: 0, left: 0, width: `${dimensions.width}px`, height: `${dimensions.height}px`, background: "transparent", border: "none", cursor: "pointer", outline: "none", zIndex: 40, transformStyle: "preserve-3d", transform: "translateZ(25px)", overflow: "hidden", borderRadius: "100px" }}
          >
            {ripples.map(ripple => (
              <span key={ripple.id} style={{ position: "absolute", left: `${ripple.x}px`, top: `${ripple.y}px`, width: "20px", height: "20px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)", pointerEvents: "none", animation: "ripple-vp 0.6s ease-out" }} />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
