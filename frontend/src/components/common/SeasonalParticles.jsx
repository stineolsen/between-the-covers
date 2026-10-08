import { useMemo } from "react";
import { useSeasonalTheme } from "../../contexts/SeasonalThemeContext";

const FIREWORK_COLORS = ["#b5182f", "#1f5d3e", "#e8c468", "#2a3a6a", "#ffffff"];
const SPARKS_PER_BURST = 14;

const randomBetween = (min, max) => min + Math.random() * (max - min);
const randomSign = () => (Math.random() < 0.5 ? -1 : 1);
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Falling snow (jul) - drift + rotate + fall, see .seasonal-fall in index.css.
const SnowLayer = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, () => ({
        left: randomBetween(0, 100),
        duration: randomBetween(9, 17),
        delay: randomBetween(-17, 0),
        drift: randomBetween(-60, 60),
        rotateEnd: randomBetween(180, 540) * randomSign(),
        size: randomBetween(5, 10),
      })),
    [],
  );

  return (
    <div className="seasonal-particles" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="seasonal-particle seasonal-particle--snow"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--drift": p.drift,
            "--rotate-end": `${p.rotateEnd}deg`,
          }}
        />
      ))}
    </div>
  );
};

// Fireworks (nyttaar) - a handful of burst origins, each exploding into a
// ring of sparks whose radial end-offset is computed here (angle+distance)
// and passed to CSS as plain px custom properties.
const FireworksLayer = () => {
  const bursts = useMemo(
    () =>
      Array.from({ length: 6 }, () => ({
        left: randomBetween(8, 92),
        top: randomBetween(10, 55),
        duration: randomBetween(3.5, 6.5),
        delay: randomBetween(-6.5, 0),
        sparks: Array.from({ length: SPARKS_PER_BURST }, (_, i) => {
          const angle = (360 / SPARKS_PER_BURST) * i + randomBetween(-8, 8);
          const distance = randomBetween(55, 95);
          const radians = (angle * Math.PI) / 180;
          return {
            dx: Math.cos(radians) * distance,
            dy: Math.sin(radians) * distance + 12, // slight downward bias (gravity)
            color: randomItem(FIREWORK_COLORS),
          };
        }),
      })),
    [],
  );

  return (
    <div className="seasonal-particles" aria-hidden="true">
      {bursts.map((burst, bi) => (
        <div
          key={bi}
          className="seasonal-firework"
          style={{ left: `${burst.left}%`, top: `${burst.top}%` }}
        >
          {burst.sparks.map((s, si) => (
            <span
              key={si}
              className="seasonal-spark"
              style={{
                animationDuration: `${burst.duration}s`,
                animationDelay: `${burst.delay}s`,
                "--dx": `${s.dx}px`,
                "--dy": `${s.dy}px`,
                background: s.color,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const SeasonalParticles = () => {
  const { season } = useSeasonalTheme();

  if (season === "jul") return <SnowLayer />;
  if (season === "nyttaar") return <FireworksLayer />;
  return null;
};

export default SeasonalParticles;
