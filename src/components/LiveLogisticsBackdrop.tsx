import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const particles = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  top: `${(index * 23) % 100}%`,
  size: 2 + (index % 4),
  delay: (index % 9) * 0.65,
  duration: 10 + (index % 7),
}));

export function LiveLogisticsBackdrop() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { stiffness: 55, damping: 22, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 55, damping: 22, mass: 0.6 });
  const glowX = useTransform(smoothX, [0, 1], ["18%", "82%"]);
  const glowY = useTransform(smoothY, [0, 1], ["18%", "72%"]);
  const layerX = useTransform(smoothX, [0, 1], [-18, 18]);
  const layerY = useTransform(smoothY, [0, 1], [-12, 12]);

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
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#020404] pointer-events-none">
      <motion.div
        className="absolute inset-[-6%] opacity-80"
        style={{ x: layerX, y: layerY }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(35,197,255,0.16),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(204,255,0,0.13),transparent_24%),radial-gradient(circle_at_65%_80%,rgba(42,94,255,0.14),transparent_34%),linear-gradient(135deg,#020404_0%,#061113_46%,#020404_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_82%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(118deg,transparent_0%,rgba(204,255,0,0.09)_42%,transparent_62%)] animate-command-sweep" />
      </motion.div>

      <motion.div
        className="absolute h-[40rem] w-[40rem] rounded-full bg-primary/10 blur-[130px]"
        style={{ left: glowX, top: glowY, x: "-50%", y: "-50%" }}
      />
      <div className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-cyan-400/10 blur-[110px]" />
      <div className="absolute bottom-[8%] right-[10%] h-96 w-96 rounded-full bg-blue-500/10 blur-[130px]" />

      <svg className="absolute inset-0 h-full w-full opacity-[0.52]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id="routeGlow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="35%" stopColor="rgba(34,211,238,0.8)" />
            <stop offset="65%" stopColor="rgba(204,255,0,0.95)" />
            <stop offset="100%" stopColor="rgba(204,255,0,0)" />
          </linearGradient>
        </defs>

        <g className="world-map-lines">
          <path d="M112 250 C250 190 380 218 525 176 C695 126 808 180 956 145 C1122 105 1235 145 1378 92" />
          <path d="M70 536 C220 480 328 548 492 492 C658 436 782 472 914 430 C1082 378 1204 438 1398 370" />
          <path d="M118 736 C316 662 442 710 636 652 C812 600 950 682 1126 606 C1240 558 1324 562 1418 510" />
          <path d="M178 112 C230 266 214 426 318 572 C402 688 582 736 706 840" />
          <path d="M816 54 C752 214 820 354 760 486 C704 610 742 714 854 854" />
          <path d="M1182 42 C1082 182 1078 328 1156 474 C1220 594 1192 714 1094 842" />
        </g>

        <g filter="url(#routeGlow)">
          <path className="animated-route route-one" d="M126 640 C310 482 442 565 590 406 C764 220 990 282 1288 150" />
          <path className="animated-route route-two" d="M178 210 C372 318 474 300 646 410 C820 520 1010 506 1302 680" />
          <path className="animated-route route-three" d="M82 440 C254 382 386 416 522 515 C704 648 908 638 1174 438 C1260 374 1334 350 1412 334" />
        </g>

        <g className="gps-nodes" filter="url(#routeGlow)">
          {[
            [126, 640], [590, 406], [1288, 150], [178, 210], [646, 410],
            [1302, 680], [82, 440], [522, 515], [1174, 438], [1412, 334]
          ].map(([cx, cy], index) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 3 === 0 ? 5 : 3.5} style={{ animationDelay: `${index * 0.22}s` }} />
          ))}
        </g>
      </svg>

      {particles.map((particle, index) => (
        <span
          key={index}
          className="fleet-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.12),rgba(0,0,0,0.78)_78%)]" />
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />
    </div>
  );
}
