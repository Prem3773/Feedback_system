import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Components/Homepage/Navbar'
import Footer from './Components/Homepage/Footer'
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Aboutpage from './pages/Aboutpage';
import StudentFeedbackDashboard from './Components/Dashboards/Studendashboard/StudentFeedbackDashboard';
import Home from './Components/Dashboards/Studendashboard/Home';
import Sidebar from './Components/Dashboards/Studendashboard/Sidebar';
import FeedbackHostel from './Components/Dashboards/Studendashboard/Feedback/FeedbackHostel';
import FeedbackTeacher from './Components/Dashboards/Studendashboard/Feedback/FeedbackTeacher';
import FeedbackCampus from './Components/Dashboards/Studendashboard/Feedback/FeedbackCampus';
import FeedbackHistory from './Components/Dashboards/Studendashboard/Feedback/FeedbackHistory';
import Teacherdashboard from './Components/Dashboards/Teacherdashboard/Teacherdashboard';
import AdminDashboard from './Components/Dashboards/Admindashboard/AdminDashboard';

const ProtectedRoute = ({ isLoggedIn, role, requiredRole, children }) => {
  if (!isLoggedIn || role !== requiredRole) {
    return <Navigate to="/login" />;
  }
  return children;
};



const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (loggedIn && storedUser && storedRole) {
      setIsLoggedIn(true);
      setUser(storedUser);
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const handleLogin = (username, userRole) => {
    const capitalizedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
    setIsLoggedIn(true);
    setUser(username);
    setRole(capitalizedRole);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', username);
    localStorage.setItem('role', capitalizedRole);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setRole(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    // The main container that handles page layout
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* BrowserRouter is used to handle routing across the application */}
      <BrowserRouter>
        {/* Navbar is outside the Routes, so it appears on every page */}
        <Navbar isLoggedIn={isLoggedIn} user={user} role={role} onLogout={handleLogout} />

        {/* The main content area will grow to fill available space, pushing the footer down */}
        <main className="flex-grow">
          {/* Routes component defines the different pages (routes) of the application */}
          <Routes>
            {/* Route for the homepage, located at the root path "/" */}
            <Route path="/" element={<HomePage />} />

            {/* Route for the login page, located at the "/login" path */}
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

            {/* Route for the register page */}
            <Route path="/register" element={<RegisterPage />} />

            {/* Route for the about page */}
            <Route path="/Aboutpage" element={<Aboutpage />} />

            <Route path="/home" element={<Home />} />
            <Route path="/student/dashboard" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Student"><StudentFeedbackDashboard user={user} /></ProtectedRoute>} />
            <Route path="/teacher/dashboard" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Teacher"><Teacherdashboard user={user} /></ProtectedRoute>} />
            <Route path="/teacher/analytics" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Teacher"><Teacherdashboard user={user} /></ProtectedRoute>} />
            <Route path="/teacher/ai-insights" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Teacher"><Teacherdashboard user={user} /></ProtectedRoute>} />
            <Route path="/teacher/student-evaluation" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Teacher"><Teacherdashboard user={user} /></ProtectedRoute>} />
            <Route path="/feedback/hostel" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Student"><FeedbackHostel /></ProtectedRoute>} />
            <Route path="/feedback/teacher" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Student"><FeedbackTeacher /></ProtectedRoute>} />
            <Route path="/feedback/campus" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Student"><FeedbackCampus /></ProtectedRoute>} />
            <Route path="/feedback/history" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Student"><FeedbackHistory /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute isLoggedIn={isLoggedIn} role={role} requiredRole="Admin"><AdminDashboard /></ProtectedRoute>} />

          </Routes>
        </main>

        {/* Footer is also outside the Routes, so it appears on every page */}
        <Footer />
      </BrowserRouter>
    </div>
  )
}

export default App
