import { mailto } from "./config";
import { Reveal } from "./Reveal";
import banner from "@/assets/voltrium-portable-banner.webp";

function CorridorGraphic() {
  return (
    <svg
      viewBox="0 0 1200 420"
      className="h-full w-full"
      role="img"
      aria-label="Abstract map of a charging corridor: Nairobi connected through charging hubs to Mombasa"
    >
      <defs>
        <linearGradient id="hero-route" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
          <stop offset="35%" stopColor="var(--color-primary)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.55" />
        </linearGradient>
        <filter id="hero-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* topographic lines */}
      <g stroke="currentColor" className="text-border" fill="none" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M-20 ${110 + i * 48} C 220 ${70 + i * 46} 430 ${190 + i * 44} 690 ${140 + i * 47} S 1060 ${70 + i * 45} 1220 ${120 + i * 46}`}
            opacity={0.55 - i * 0.05}
          />
        ))}
      </g>

      {/* corridor */}
      <path
        d="M90 300 C 250 250 330 330 470 274 S 720 180 860 214 S 1050 150 1130 118"
        fill="none"
        stroke="url(#hero-route)"
        strokeWidth="2.5"
      />
      <path
        d="M90 300 C 250 250 330 330 470 274 S 720 180 860 214 S 1050 150 1130 118"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        className="flow-line"
        filter="url(#hero-glow)"
      />

      {[
        { x: 90, y: 300, label: "NAIROBI", primary: true },
        { x: 470, y: 274, label: "HUB 01", primary: false },
        { x: 860, y: 214, label: "HUB 02", primary: false },
        { x: 1130, y: 118, label: "MOMBASA", primary: true },
      ].map((n) => (
        <g key={n.label}>
          <circle
            cx={n.x}
            cy={n.y}
            r={n.primary ? 16 : 12}
            fill="var(--color-primary)"
            opacity="0.2"
            className="node-pulse"
          />
          <circle cx={n.x} cy={n.y} r={n.primary ? 6 : 4} fill="var(--color-primary)" />
          <line
            x1={n.x}
            y1={n.y}
            x2={n.x}
            y2={n.y - 46}
            stroke="var(--color-primary)"
            strokeWidth="1"
            opacity="0.4"
          />
          <text
            x={n.x}
            y={n.y - 56}
            textAnchor="middle"
            className="fill-muted-foreground font-mono"
            fontSize="12"
            letterSpacing="3"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border pt-16 md:pt-20">
      <img
        src={banner}
        alt="Voltrium — Powering the electric road. Illustrated electric coaches, charging hubs and connected energy infrastructure."
        width={1920}
        height={640}
        fetchPriority="high"
        className="block h-auto w-full"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 pt-12 md:px-10 md:pt-16">
        <Reveal className="label-tech-primary flex items-center gap-3">
          <span className="inline-block h-px w-10 bg-primary" />
          Charging network operator · Kenya · East Africa
        </Reveal>

        <Reveal delay={80} as="h1" className="display-xl mt-8 max-w-5xl">
          Building
          <br />
          the <span className="text-primary text-glow">electric</span>
          <br />
          highway.
        </Reveal>

        <div className="mt-10 grid gap-10 border-t border-border pt-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <Reveal delay={120}>
            <p className="max-w-xl text-lg leading-relaxed text-foreground md:text-xl">
              Charging infrastructure for the transition to electric long-distance transport.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Electric buses can travel long distances. They need an infrastructure network that can
              travel with them. Voltrium develops and operates high-power charging infrastructure
              built around commercial routes.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={mailto("Build with Voltrium")}
                className="label-tech bg-primary px-8 py-4 text-center text-primary-foreground transition-opacity hover:opacity-85"
              >
                Build with Voltrium
              </a>
              <a
                href="#network"
                className="label-tech border border-border-strong px-8 py-4 text-center transition-colors hover:border-primary hover:text-primary"
              >
                Explore the network
              </a>
            </div>
          </Reveal>

          <Reveal delay={200} className="min-w-0">
            <div className="text-primary">
              <div className="h-[240px] w-full md:h-[320px]">
                <CorridorGraphic />
              </div>
            </div>
            <div className="label-tech mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4">
              <span>Origin</span>
              <span className="text-primary">→ Charging hub</span>
              <span>→ Corridor</span>
              <span className="text-primary">→ Charging hub</span>
              <span>→ Destination</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
