import { ShieldCheck, Split, Workflow } from "lucide-react";
import type { ReactNode } from "react";

const POINTS = [
  { icon: Workflow, text: "Assign work and watch it move across the board" },
  { icon: Split, text: "Separate views for admins, managers and employees" },
  { icon: ShieldCheck, text: "Every change captured in an audit log" },
];

/**
 * Split auth layout. The left panel is a flat dark surface with a masked grid
 * rather than a gradient illustration — it frames the form instead of
 * competing with it.
 */
export function AuthLayout({
  headline,
  lede,
  children,
}: {
  headline: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="auth-brand">
          <span className="brand-mark">TF</span>
          TaskForge
        </div>

        <div>
          <h1 className="auth-headline">{headline}</h1>
          <p className="auth-lede">{lede}</p>

          <div className="auth-points">
            {POINTS.map(({ icon: Icon, text }) => (
              <div className="auth-point" key={text}>
                <Icon />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-foot">Built by Ayush Yadav</div>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}

const DEMO_ACCOUNTS = [
  { role: "Admin", username: "ayush.yadav", password: "Ayush@123" },
  { role: "Manager", username: "priya.mehta", password: "Manager@123" },
  { role: "Employee", username: "aarav.sharma", password: "Employee@123" },
];

/**
 * Demo logins, shown only when the build opts in via VITE_DEMO_MODE. A real
 * deploy mints a random admin password at bootstrap, so printing fixed
 * credentials there would be both wrong and a giveaway.
 */
export function DemoAccounts({
  onPick,
}: {
  onPick: (username: string, password: string) => void;
}) {
  if (import.meta.env.VITE_DEMO_MODE !== "true") return null;

  return (
    <div className="demo-box">
      <div className="demo-box-title">Demo accounts</div>
      {DEMO_ACCOUNTS.map((account) => (
        <div className="demo-row" key={account.username}>
          <span>{account.role}</span>
          <code>{account.username}</code>
          <button
            type="button"
            className="demo-fill"
            onClick={() => onPick(account.username, account.password)}
          >
            Use
          </button>
        </div>
      ))}
    </div>
  );
}
