import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const AdminDashboard = ({ isDarkMode }) => {
  const [stats, setStats] = useState({
    totalStudentsWithFeedback: 0,
    totalFeedback: 0,
    teacherFeedback: [],
    hostelFeedback: [],
    campusFeedback: []
  });
  const [error, setError] = useState(null);
  const [userError, setUserError] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [learningTypeFilter, setLearningTypeFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchStats(), fetchUsers()]);
    };
    loadData();

    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found, please login.');
        setLoadingStats(false);
        return;
      }
      const response = await fetch('http://localhost:3001/api/feedback/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Admin Stats Data:', data);
        setStats(data || {
          totalStudentsWithFeedback: 0,
          totalFeedback: 0,
          teacherFeedback: [],
          hostelFeedback: [],
          campusFeedback: []
        });
        setError(null);
      } else {
        setError('Failed to fetch stats');
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      setError('Error fetching stats');
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserError('No token found, please login.');
        setLoadingUsers(false);
        return;
      }
      const response = await fetch('http://localhost:3001/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
        setUserError(null);
      } else {
        setUserError('Failed to fetch users');
        console.error('Failed to fetch users');
      }
    } catch (error) {
      setUserError('Error fetching users');
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('User deleted successfully');
        fetchUsers();
        fetchStats(); 
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const updateUser = async (userId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        alert('User updated successfully');
        fetchUsers();
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loadingStats || loadingUsers) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || userError) {
    const displayError = error || userError;
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-xl text-red-600">Error: {displayError}</div>
      </div>
    );
  }

  const filterFeedback = (feedback) => {
    if (learningTypeFilter === 'All') return feedback;
    return feedback.filter(fb => fb.learningType === learningTypeFilter);
  };

  const filteredTeacherFeedback = filterFeedback(stats.teacherFeedback);
  const filteredHostelFeedback = filterFeedback(stats.hostelFeedback);
  const filteredCampusFeedback = filterFeedback(stats.campusFeedback);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setLoadingStats(true);
                  setLoadingUsers(true);
                  const loadData = async () => {
                    await Promise.all([fetchStats(), fetchUsers()]);
                  };
                  loadData();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : (isDarkMode ? 'border-transparent text-gray-300 hover:text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-700')
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : (isDarkMode ? 'border-transparent text-gray-300 hover:text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-700')
              }`}
            >
              User Management
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && (
            <>
              {/* LEARNER TYPE FILTER */}
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  onClick={() => setLearningTypeFilter("All")}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    learningTypeFilter === "All"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  All Students
                </button>
                <button
                  onClick={() => setLearningTypeFilter("Fast Learner")}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    learningTypeFilter === "Fast Learner"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Fast Learners
                </button>
                <button
                  onClick={() => setLearningTypeFilter("Slow Learner")}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    learningTypeFilter === "Slow Learner"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Slow Learners
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className="text-lg font-semibold mb-2">Students with Feedback</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalStudentsWithFeedback}</p>
                </div>
                <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className="text-lg font-semibold mb-2">Total Feedback Submissions</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.totalFeedback}</p>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow-md mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-xl font-semibold mb-4">Feedback Analytics</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4">Feedback Distribution by Category</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Teacher Feedback', value: stats.teacherFeedback?.length || 0, fill: '#3B82F6' },
                            { name: 'Hostel Feedback', value: stats.hostelFeedback?.length || 0, fill: '#10B981' },
                            { name: 'Campus Feedback', value: stats.campusFeedback?.length || 0, fill: '#F59E0B' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#10B981" />
                          <Cell fill="#F59E0B" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-4">Feedback Trends</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Students', value: stats.totalStudentsWithFeedback },
                        { name: 'Feedback', value: stats.totalFeedback }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className="text-xl font-semibold mb-4">Teacher Feedback</h3>
                    {(filteredTeacherFeedback.length === 0) ? (
                      <p className="text-gray-500">No teacher feedback available</p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {filteredTeacherFeedback.map((feedback, index) => (
                          <div key={index} className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{feedback?.userId?.username || 'Unknown User'}</span>
                              <span className="text-sm text-gray-500">
                                {feedback?.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Unknown Date'}
                              </span>
                            </div>
                            <div className="text-sm">
                              {feedback?.responses && typeof feedback.responses === 'object' && Object.entries(feedback.responses).map(([key, value], idx) => (
                                <div key={idx} className="mb-1">
                                  <strong>{key}:</strong> {value || 'N/A'}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className="text-xl font-semibold mb-4">Hostel Feedback</h3>
                    {(filteredHostelFeedback.length === 0) ? (
                      <p className="text-gray-500">No hostel feedback available</p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {filteredHostelFeedback.map((feedback, index) => (
                          <div key={index} className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{feedback?.userId?.username || 'Unknown User'}</span>
                              <span className="text-sm text-gray-500">
                                {feedback?.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Unknown Date'}
                              </span>
                            </div>
                            <div className="text-sm">
                              {feedback?.responses && typeof feedback.responses === 'object' && Object.entries(feedback.responses).map(([key, value], idx) => (
                                <div key={idx} className="mb-1">
                                  <strong>{key}:</strong> {value || 'N/A'}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className="text-xl font-semibold mb-4">Campus Feedback</h3>
                    {(filteredCampusFeedback.length === 0) ? (
                      <p className="text-gray-500">No campus feedback available</p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {filteredCampusFeedback.map((feedback, index) => (
                          <div key={index} className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{feedback?.userId?.username || 'Unknown User'}</span>
                              <span className="text-sm text-gray-500">
                                {feedback?.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Unknown Date'}
                              </span>
                            </div>
                            <div className="text-sm">
                              {feedback?.responses && typeof feedback.responses === 'object' && Object.entries(feedback.responses).map(([key, value], idx) => (
                                <div key={idx} className="mb-1">
                                  <strong>{key}:</strong> {value || 'N/A'}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-xl font-semibold mb-4">User Management</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {(users && users.length > 0) ? users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.subject || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.attendance !== undefined ? user.attendance + '%' : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="text-red-600 hover:text-red-900 mr-4"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              const newRole = user.role === 'student' ? 'teacher' : 'student';
                              updateUser(user._id, { role: newRole });
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => {
                              const newSubject = prompt('Enter new subject for this user:', user.subject || '');
                              if (newSubject !== null) {
                                updateUser(user._id, { subject: newSubject });
                              }
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Edit Subject
                          </button>
                          <button
                            onClick={() => {
                              if (user.role === 'student') {
                                const newAttendance = prompt('Enter attendance percentage for this student (0-100):', user.attendance !== undefined ? user.attendance : '');
                                if (newAttendance !== null) {
                                  const attendanceVal = Number(newAttendance);
                                  if (isNaN(attendanceVal) || attendanceVal < 0 || attendanceVal > 100) {
                                    alert('Please enter a valid number between 0 and 100 for attendance.');
                                    return;
                                  }
                                  updateUser(user._id, { attendance: attendanceVal });
                                }
                              } else {
                                alert('Attendance can only be set for students.');
                              }
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Edit Attendance
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                            No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
