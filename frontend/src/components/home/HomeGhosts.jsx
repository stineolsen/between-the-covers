import { useMemo } from "react";
import { useSeasonalTheme } from "../../contexts/SeasonalThemeContext";

const randomBetween = (min, max) => min + Math.random() * (max - min);

// Rounded dome + a scalloped bottom edge, the classic ghost silhouette -
// drawn as a real path instead of relying on a CSS clip-path (which read
// as a sharp, blocky zigzag rather than a smooth "ghost" outline).
const GhostShape = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full">
    <path
      d="M 10 60 C 10 25 28 5 50 5 C 72 5 90 25 90 60 L 90 100 Q 84 112 78 100 Q 72 112 66 100 Q 60 112 54 100 Q 48 112 42 100 Q 36 112 30 100 Q 24 112 18 100 Q 12 112 10 100 Z"
      fill="rgba(255, 255, 255, 0.3)"
    />
    <circle cx="35" cy="50" r="6" fill="rgba(55, 45, 65, 0.4)" />
    <circle cx="65" cy="50" r="6" fill="rgba(55, 45, 65, 0.4)" />
    <ellipse cx="50" cy="68" rx="5" ry="7" fill="rgba(55, 45, 65, 0.4)" />
  </svg>
);

// Halloween only, and only here on the front page - unlike
// SeasonalParticles (snow/fireworks), which runs site-wide. A few
// semi-transparent ghosts drifting along a slow, looping wander path,
// absolutely positioned against Home's own (relative) root so they scroll
// with the page rather than staying pinned to one screen's worth of it.
//
// Each ghost is two nested elements: the outer .home-ghost runs the big
// wander (ghost-float), the inner .home-ghost-inner runs a faster bob+tilt
// (ghost-bob) and carries the glow - nesting lets both transforms compose
// instead of one animation overwriting the other on the same element.
const HomeGhosts = () => {
  const { season } = useSeasonalTheme();

  const ghosts = useMemo(() => {
    if (season !== "halloween") return [];
    return Array.from({ length: 5 }, () => {
      const width = randomBetween(42, 78);
      return {
        left: randomBetween(5, 90),
        top: randomBetween(5, 95),
        width,
        height: width * 1.14,
        opacity: randomBetween(0.55, 1),
        duration: randomBetween(16, 26),
        delay: randomBetween(-26, 0),
        bobDuration: randomBetween(3, 5.5),
        bobDelay: randomBetween(-5.5, 0),
        dx1: randomBetween(-70, 70),
        dy1: randomBetween(-40, 40),
        dx2: randomBetween(-70, 70),
        dy2: randomBetween(-40, 40),
        dx3: randomBetween(-70, 70),
        dy3: randomBetween(-40, 40),
      };
    });
  }, [season]);

  if (season !== "halloween") return null;

  return (
    <div className="home-ghosts" aria-hidden="true">
      {ghosts.map((g, i) => (
        <span
          key={i}
          className="home-ghost"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            width: `${g.width}px`,
            height: `${g.height}px`,
            opacity: g.opacity,
            animationDuration: `${g.duration}s`,
            animationDelay: `${g.delay}s`,
            "--dx1": `${g.dx1}px`,
            "--dy1": `${g.dy1}px`,
            "--dx2": `${g.dx2}px`,
            "--dy2": `${g.dy2}px`,
            "--dx3": `${g.dx3}px`,
            "--dy3": `${g.dy3}px`,
          }}
        >
          <span
            className="home-ghost-inner"
            style={{ animationDuration: `${g.bobDuration}s`, animationDelay: `${g.bobDelay}s` }}
          >
            <GhostShape />
          </span>
        </span>
      ))}
    </div>
  );
};

export default HomeGhosts;
