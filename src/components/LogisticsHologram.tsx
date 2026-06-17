import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

type LogisticsHologramProps = {
  compact?: boolean;
};

export function LogisticsHologram({ compact = false }: LogisticsHologramProps) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 24, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 24, mass: 0.5 });
  const { scrollYProgress } = useScroll();

  const rotateY = useTransform(smoothX, [0, 1], [-16, 16]);
  const rotateX = useTransform(smoothY, [0, 1], [11, -11]);
  const x = useTransform(smoothX, [0, 1], [-24, 24]);
  const y = useTransform(scrollYProgress, [0, 1], [0, compact ? 60 : 140]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.94, 1.06]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], [0, compact ? -5 : -11]);

  useEffect(() => {
    let frameId = 0;
    let nextX = 0.5;
    let nextY = 0.5;

    const updatePointer = () => {
      frameId = 0;
      mouseX.set(nextX);
      mouseY.set(nextY);
    };

    const handleMove = (event: MouseEvent) => {
      nextX = event.clientX / window.innerWidth;
      nextY = event.clientY / window.innerHeight;

      if (!frameId) {
        frameId = window.requestAnimationFrame(updatePointer);
      }
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className={`fixed pointer-events-none z-[1] ${compact ? "right-[-8rem] top-[8rem] opacity-55 sm:right-[-6rem] sm:top-[9rem] sm:opacity-70 lg:right-[-5rem] lg:opacity-100" : "right-[-10rem] top-[9rem] opacity-45 sm:right-[-8rem] sm:top-[10rem] sm:opacity-65 lg:right-[-8rem] lg:opacity-100"}`}
      style={{ x, y, rotateX, rotateY, rotateZ, scale, transformPerspective: 1100 }}
      aria-hidden="true"
    >
      <div className={`hologram-responsive-shell ${compact ? "is-compact" : ""}`}>
        <div className="hologram-stage">
          <div className="hologram-orbit orbit-a" />
          <div className="hologram-orbit orbit-b" />
          <div className="hologram-grid" />
          <div className="cargo-vehicle">
            <div className="truck-shadow" />
            <div className="truck-trailer">
              <span className="trailer-line line-a" />
              <span className="trailer-line line-b" />
              <span className="trailer-panel panel-a" />
              <span className="trailer-panel panel-b" />
            </div>
            <div className="truck-cab">
              <span className="cab-window" />
              <span className="cab-light" />
            </div>
            <span className="wheel wheel-front" />
            <span className="wheel wheel-back" />
            <span className="wheel wheel-mid" />
          </div>
          <div className="hologram-scanline" />
        </div>
      </div>
    </motion.div>
  );
}
