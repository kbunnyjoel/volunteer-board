import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { VolunteerPage } from "./pages/VolunteerPage";
import { AdminPage } from "./pages/AdminPage";

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
