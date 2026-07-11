import { NavLink, Outlet } from "react-router-dom";
import { useConnection } from "../hooks/useConnection";

const navItems = [
  { to: "/", label: "Forms" },
  { to: "/form-slots", label: "Form Slots" },
  { to: "/api-keys", label: "API Keys" },
];

export const Layout = () => {
  const { isConnected, disconnect } = useConnection();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Dynamic Forms SDK</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {isConnected && (
          <button className="btn btn-ghost sidebar-disconnect" onClick={disconnect}>
            Disconnect
          </button>
        )}
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};
