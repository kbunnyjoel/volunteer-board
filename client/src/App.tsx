import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { VolunteerPage } from "./pages/VolunteerPage";
import { AdminPage } from "./pages/AdminPage";

function ErrorButton() {
  return (
    <button
      className="secondary-btn"
      type="button"
      onClick={() => {
        Sentry.captureMessage("Triggering test error button click", "info");
        throw new Error("This is your first error!");
      }}
    >
      Break the world
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="top-nav">
          <Link to="/" className="brand-link">
            Volunteer Board
          </Link>
          <div className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
            >
              Opportunities
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
            >
              Admin
            </NavLink>
          </div>
        </nav>

        <main>
          {(import.meta.env.DEV ||
            (import.meta.env.VITE_SENTRY_TEST_BUTTON as string | undefined) === "true") && (
            <div className="app-test-banner">
              <span>Observability test</span>
              <ErrorButton />
            </div>
          )}
          <Routes>
            <Route path="/" element={<VolunteerPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
