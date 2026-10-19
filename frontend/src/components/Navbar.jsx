import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Check login status
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setIsOpen(false);

    navigate("/");
  };

  return (
    <nav className="relative z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600"
          >
            Grand Hotel
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">

            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600"
            >
              Home
            </Link>

            <Link
              to="/rooms"
              className="text-gray-700 hover:text-blue-600"
            >
              Rooms
            </Link>

            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  className="text-gray-700 hover:text-blue-600"
                >
                  My Bookings
                </Link>

                <div className="flex items-center gap-2 text-gray-700">
                  <User size={18} />

                  <span>
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}

          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? (
              <X size={28} />
            ) : (
              <Menu size={28} />
            )}
          </button>

        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-6 space-y-4">

            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700"
            >
              Home
            </Link>

            <Link
              to="/rooms"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700"
            >
              Rooms
            </Link>

            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700"
                >
                  My Bookings
                </Link>

                <div className="flex items-center gap-2 text-gray-700">
                  <User size={18} />

                  <span>
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block bg-blue-600 text-white text-center px-5 py-2.5 rounded-lg"
                >
                  Register
                </Link>
              </>
            )}

          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;