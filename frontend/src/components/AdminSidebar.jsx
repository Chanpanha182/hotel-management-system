import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  CreditCard,
  FileBarChart,
  Star,
  Globe,
  LogOut,
  Hotel,
  Menu,
  X,
} from "lucide-react";

function AdminSidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Rooms",
      path: "/admin/rooms",
      icon: BedDouble,
    },
    {
      name: "Bookings",
      path: "/admin/bookings",
      icon: CalendarCheck,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
  name: "Payments",
  path: "/admin/payments",
  icon: CreditCard,
},
{
  name: "Reviews",
  path: "/admin/reviews",
  icon: Star,
},
{
  name: "Reports",
  path: "/admin/reports",
  icon: FileBarChart,
},
  ];

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* ========================================
          MOBILE MENU BUTTON
      ======================================== */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-gray-900 text-white p-3 rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* ========================================
          MOBILE OVERLAY
      ======================================== */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* ========================================
          SIDEBAR
      ======================================== */}
      <aside
        className={`
          fixed lg:static
          inset-y-0 left-0
          z-50
          w-64
          min-h-screen
          bg-gray-900
          text-white
          flex flex-col
          flex-shrink-0
          transform
          transition-transform
          duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* ========================================
            LOGO
        ======================================== */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Hotel size={24} />
              </div>

              <div>
                <h1 className="font-bold text-lg">
                  Hotel Admin
                </h1>

                <p className="text-xs text-gray-400">
                  Management System
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={closeSidebar}
              className="lg:hidden text-gray-400 hover:text-white"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>

          </div>
        </div>

        {/* ========================================
            NAVIGATION
        ======================================== */}
        <nav className="flex-1 p-4 overflow-y-auto">

          <p className="text-xs uppercase text-gray-500 font-semibold px-3 mb-3">
            Management
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={20} />

                  <span className="font-medium">
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </div>

        </nav>

        {/* ========================================
            BOTTOM ACTIONS
        ======================================== */}
        <div className="p-4 border-t border-gray-700 space-y-2">

          <button
            onClick={() => {
              closeSidebar();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
          >
            <Globe size={20} />

            <span>
              Back to Website
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <LogOut size={20} />

            <span>
              Logout
            </span>
          </button>

        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;