import type { ReactNode } from "react";

/** The illustrated left-hand panel shared by the login and signup screens. */
export function AuthBrandPanel({ heading, lede }: { heading: ReactNode; lede: string }) {
  return (
    <section className="auth-brand">
      <div className="brand-mark">
        <span className="logo-dot">TF</span>
        <span className="brand-word">TaskForge</span>
      </div>

      <div>
        <h1>{heading}</h1>
        <p className="lede">{lede}</p>

        <div className="brand-hero">
          <svg viewBox="0 0 420 260" role="img" aria-label="Illustration of a task board">
            <defs>
              <linearGradient id="cardFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity=".95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity=".78" />
              </linearGradient>
              <linearGradient id="barFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#5eead4" />
              </linearGradient>
            </defs>

            <g className="hero-ring">
              <circle
                cx="210"
                cy="130"
                r="112"
                fill="none"
                stroke="#ffffff"
                strokeOpacity=".18"
                strokeWidth="1.5"
                strokeDasharray="5 11"
              />
              <circle cx="210" cy="18" r="5" fill="#5eead4" />
              <circle cx="322" cy="130" r="4" fill="#ffffff" opacity=".7" />
            </g>

            <rect x="42" y="58" width="112" height="150" rx="14" fill="#ffffff" opacity=".12" />
            <rect x="266" y="58" width="112" height="150" rx="14" fill="#ffffff" opacity=".12" />

            <g className="hero-card">
              <rect x="54" y="74" width="88" height="56" rx="10" fill="url(#cardFill)" />
              <rect x="64" y="86" width="46" height="6" rx="3" fill="#5540e6" opacity=".55" />
              <rect x="64" y="100" width="62" height="5" rx="2.5" fill="#171a29" opacity=".18" />
              <rect x="64" y="112" width="30" height="8" rx="4" fill="#f59e0b" opacity=".45" />
            </g>

            <g className="hero-card hero-card--b">
              <rect x="54" y="140" width="88" height="52" rx="10" fill="url(#cardFill)" />
              <rect x="64" y="152" width="52" height="6" rx="3" fill="#5540e6" opacity=".55" />
              <rect x="64" y="166" width="40" height="5" rx="2.5" fill="#171a29" opacity=".18" />
              <rect x="64" y="178" width="26" height="6" rx="3" fill="#ef4444" opacity=".45" />
            </g>

            <g className="hero-card hero-card--c">
              <rect x="150" y="86" width="120" height="108" rx="14" fill="url(#cardFill)" />
              <rect x="164" y="102" width="64" height="7" rx="3.5" fill="#5540e6" opacity=".6" />

              <rect x="164" y="122" width="92" height="7" rx="3.5" fill="#171a29" opacity=".10" />
              <rect className="hero-bar" x="164" y="122" width="74" height="7" rx="3.5" fill="url(#barFill)" />

              <rect x="164" y="140" width="92" height="7" rx="3.5" fill="#171a29" opacity=".10" />
              <rect
                className="hero-bar hero-bar--b"
                x="164"
                y="140"
                width="50"
                height="7"
                rx="3.5"
                fill="url(#barFill)"
              />

              <rect x="164" y="158" width="92" height="7" rx="3.5" fill="#171a29" opacity=".10" />
              <rect
                className="hero-bar hero-bar--c"
                x="164"
                y="158"
                width="86"
                height="7"
                rx="3.5"
                fill="url(#barFill)"
              />

              <g className="hero-tick">
                <circle cx="248" cy="180" r="13" fill="#22c55e" opacity=".92" />
                <path
                  d="M242 180l4.5 4.5 8-8.5"
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
            </g>

            <g className="hero-card hero-card--b">
              <rect x="278" y="74" width="88" height="60" rx="10" fill="url(#cardFill)" />
              <circle cx="294" cy="92" r="8" fill="#6d5ef8" opacity=".5" />
              <rect x="308" y="88" width="44" height="6" rx="3" fill="#171a29" opacity=".2" />
              <rect x="290" y="108" width="62" height="5" rx="2.5" fill="#171a29" opacity=".14" />
              <rect x="290" y="119" width="40" height="5" rx="2.5" fill="#171a29" opacity=".14" />
            </g>

            <g className="hero-card">
              <rect x="278" y="144" width="88" height="48" rx="10" fill="url(#cardFill)" />
              <rect x="290" y="156" width="50" height="6" rx="3" fill="#14b8a6" opacity=".6" />
              <rect x="290" y="170" width="64" height="5" rx="2.5" fill="#171a29" opacity=".16" />
            </g>
          </svg>
        </div>

        <div className="brand-stats">
          <div>
            <div className="s-value">5</div>
            <div className="s-label">Task states</div>
          </div>
          <div>
            <div className="s-value">3</div>
            <div className="s-label">Access roles</div>
          </div>
          <div>
            <div className="s-value">100%</div>
            <div className="s-label">Audit logged</div>
          </div>
        </div>
      </div>

      <div className="credit">
        Designed &amp; built by <strong>Ayush Yadav</strong>
      </div>
    </section>
  );
}

/**
 * Demo credentials, shown only when the build opts in via VITE_DEMO_MODE.
 * A production deploy mints a random admin password at bootstrap, so printing
 * fixed credentials there would be both wrong and a giveaway.
 */
export function DemoCredentials() {
  if (import.meta.env.VITE_DEMO_MODE !== "true") return null;

  return (
    <div className="demo-creds">
      <strong>Demo accounts</strong>
      Admin — <code>ayush.yadav</code> / <code>Ayush@123</code>
      <br />
      Manager — <code>priya.mehta</code> / <code>Manager@123</code>
      <br />
      Employee — <code>aarav.sharma</code> / <code>Employee@123</code>
    </div>
  );
}
