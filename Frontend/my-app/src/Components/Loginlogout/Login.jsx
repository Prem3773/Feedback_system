import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';


// User roles constant (not used in form, but kept for reference)
const UserRole = {
  Student: 'Student',
  Teacher: 'Teacher'
};

// Simple Card component (if not available elsewhere)
const Card = ({ children }) => (
  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
    {children}
  </div>
);

// Simple Button component (if not available elsewhere)
const Button = ({ children, type, className, variant, ...props }) => (
  <button
    type={type}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
    } ${className || ''}`}
    {...props}
  >
    {children}
  </button>
);

const Login = ({ onLogin }) => {
  const loginRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginFormSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Please enter username and password.');
      return;
    }

    try {
      const response = await fetch('https://feedback-system-backend-mip4.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');

        if (onLogin) {
          onLogin(data.user.username, data.user.role);
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
    }
  };


  return (
    <div className=' w-max mx-auto'>
        <section ref={loginRef} className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white shadow-lg rounded-lg p-6 border">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Access Your Dashboard</h2>
                  <p className="mt-2 text-lg text-gray-600">Login to continue to EduPulse.</p>
                </div>
                <form onSubmit={handleLoginFormSubmit} className="mt-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      className="mt-1 block w-full p-3 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="mt-1 block w-full p-3 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your password"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500"></p>
                  <div>
                    <Button type="submit" className="w-full py-3 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200" variant="primary">Login</Button>
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <span>Don't have an account?</span>
                    <Link
                      to="/register"
                      className="ml-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
    </div>
  )
}

export default Login
