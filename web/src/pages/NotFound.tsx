import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { landingFor } from "../auth/AuthContext";

export function NotFound() {
  const { user } = useAuth();
  const home = user ? landingFor(user) : "/login";

  return (
    <div className="centered-page">
      <div className="not-found">
        <div className="not-found-code">404</div>
        <h1>That page does not exist</h1>
        <p>The link may be out of date, or the page may have moved.</p>
        <Link className="btn btn-primary" to={home}>
          Back to TaskForge
        </Link>
      </div>
    </div>
  );
}
