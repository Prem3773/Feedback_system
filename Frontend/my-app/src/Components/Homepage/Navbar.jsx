import React from 'react'
import { Link } from 'react-router-dom'; // Import Link for routing



const Navbar = ({ isLoggedIn, user, role, onLogout }) => {
  // Removed isDarkMode and toggleDarkMode props
  return (
    <nav className="border-b shadow-sm flex w-full mb-2 bg-blue-950 border-gray-200">
      <div className="flex h-15  w-full">
        {/* Logo Section */}
        <div className="w-2xl flex items-center">
          <Link to="/" className="flex items-center pl-4">
            <img src="/assets/logo.svg" alt="EduFeed Logo" className="h-22 w-auto" />
          </Link>
          <Link to="/Aboutpage" className="text-white transition hover:text-gray-500/75 text-xl ml-4">
            About
          </Link>
        </div>

        {/* Buttons Section */}
        <div className="w-300 flex justify-end items-center pr-4 ">
          <div className="hidden sm:flex sm:gap-4">
            {isLoggedIn ? (
              <>
                <span className="text-white flex items-center">
                  Welcome, {user} ({role})
                </span>
                <Link
                  to={role === 'Teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                  className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={onLogout}
                  className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login Button - Redirects to login page */}
                <Link
                  to="/login"
                  className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-black shadow-sm hover:bg-gray-200 transition-colors"
                >
                  Login
                </Link>
                {/* Register Button - Can be updated to register page when available */}
                <Link
                  to="/register"
                  className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          <div className="block md:hidden">
            <button className="rounded-sm bg-gray-100 p-2 text-gray-600 transition hover:text-gray-600/75">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dashboard Links - Shown only if not logged in */}
        
        
      </div>
    </nav>
  )
}

export default Navbar
