import React from 'react'
import Sidebar from './Sidebar'
import { Link } from 'react-router-dom';
import { FaHome, FaUser, FaBuilding, FaClipboardList } from 'react-icons/fa';

const StudentFeedbackDashboard = ({ isDarkMode, user }) => {
  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      <div className='flex-1 p-4 md:ml-0'>
        <div className={`rounded-lg p-6 mb-6 shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className={`text-4xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Welcome, {user || 'Student'}
          </h1>
          <p className={`text-lg text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Provide feedback on various aspects of your student life. Your input is analyzed by AI-ML for teachers and administrators.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* Hostel Feedback Card */}
          <div className={`rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <div className='flex items-center mb-4'>
              <FaHome className='text-3xl text-blue-500 mr-3' />
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Hostel Feedback</h2>
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Feedback on cleanliness, facilities, food quality, and overall living conditions.
            </p>
            <ul className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <li>• Cleanliness</li>
              <li>• Facilities</li>
              <li>• Food Quality</li>
              <li>• Maintenance</li>
            </ul>
            <Link to='/feedback/hostel' className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-block'>
              Give Feedback
            </Link>
          </div>

          {/* Teacher Feedback Card */}
          <div className={`rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <div className='flex items-center mb-4'>
              <FaUser className='text-3xl text-green-500 mr-3' />
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Teacher Feedback</h2>
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Provide feedback on teaching quality, support, and interaction.
            </p>
            <ul className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <li>• Teaching Quality</li>
              <li>• Clarity</li>
              <li>• Support</li>
              <li>• Engagement</li>
            </ul>
            <Link to='/feedback/teacher' className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md inline-block'>
              Give Feedback
            </Link>
          </div>

          {/* Campus Feedback Card */}
          <div className={`rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <div className='flex items-center mb-4'>
              <FaBuilding className='text-3xl text-purple-500 mr-3' />
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Campus Feedback</h2>
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Feedback on campus facilities like cleaning, water purity, infrastructure, and safety.
            </p>
            <ul className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <li>• Cleaning</li>
              <li>• Water Purity</li>
              <li>• Infrastructure</li>
              <li>• Safety</li>
            </ul>
            <Link to='/feedback/campus' className='bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md inline-block'>
              Give Feedback
            </Link>
          </div>

          {/* View Feedback History Card */}
          <div className={`rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <div className='flex items-center mb-4'>
              <FaClipboardList className='text-3xl text-orange-500 mr-3' />
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Feedback History</h2>
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Review your previous feedback submissions and track improvements.
            </p>
            <Link to='/feedback/history' className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md inline-block'>
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentFeedbackDashboard
