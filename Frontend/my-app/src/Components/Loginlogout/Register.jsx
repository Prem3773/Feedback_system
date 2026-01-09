import React, { useState } from 'react';

// Simple register component - same structure as login
const Register = ({ onRegister }) => {
  // State for form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [subject, setSubject] = useState('');

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username || !email || !password) {
      alert('Please fill in all fields');
      return;
    }

    // Additional validation for teachers
    if (role.toLowerCase() === 'teacher' && !subject) {
      alert('Please fill in the subject field for teachers');
      return;
    }

    try {
      const response = await fetch('https://feedback-system-backend-mip4.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role: role.toLowerCase(), subject }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        // Redirect to login page
        window.location.href = '/login';
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white shadow-lg rounded-lg p-8 border">
        <h2 className="text-2xl font-bold text-center mb-6 text-black">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-md transition-colors focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-md transition-colors focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              placeholder="Enter email"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-md transition-colors focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              I am a
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 border rounded-md transition-colors focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900"
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
          </div>

          {/* Subject Input - Only for Teachers */}
          {role === 'Teacher' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border rounded-md transition-colors focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                placeholder="Enter subject you teach"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-3 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Create Account
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
              Sign in here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
