import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';

const FeedbackTeacher = () => {
  const [feedback, setFeedback] = useState({
    teacherId: '',
    teachingQuality: '',
    clarity: '',
    support: '',
    engagement: '',
    additionalComments: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/teachers');
        if (response.ok) {
          const data = await response.json();
          setTeachers(data);
        } else {
          console.error('Failed to fetch teachers');
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };

    const fetchUserAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('User not authenticated');
          setAttendance(null);
          setLoading(false);
          return;
        }
        const response = await fetch('http://localhost:3001/api/auth/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          setError('Failed to fetch user info');
          setAttendance(null);
          setLoading(false);
          return;
        }
        const users = await response.json();
        const userId = JSON.parse(atob(token.split('.')[1])).userId;
        const currentUser = users.find(u => u._id === userId);
        if (currentUser) {
          setAttendance(currentUser.attendance !== undefined ? currentUser.attendance : null);
        } else {
          setAttendance(null);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setAttendance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
    fetchUserAttendance();
  }, []);

  const handleChange = (e) => {
    setFeedback({ ...feedback, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (attendance !== null && attendance < 75) {
      alert('You are not eligible to submit feedback due to insufficient attendance.');
      return;
    }

    if (!feedback.teacherId) {
      alert('Please select a teacher.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please log in to submit feedback.');
        return;
      }
      const response = await fetch('http://localhost:3001/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: 'teacher',
          teacherId: feedback.teacherId,
          responses: {
            teachingQuality: feedback.teachingQuality,
            clarity: feedback.clarity,
            support: feedback.support,
            engagement: feedback.engagement,
            additionalComments: feedback.additionalComments
          }
        })
      });

      if (response.ok) {
        alert('Feedback submitted successfully');
        setFeedback({
          teacherId: '',
          teachingQuality: '',
          clarity: '',
          support: '',
          engagement: '',
          additionalComments: ''
        });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred while submitting feedback.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (attendance !== null && attendance < 75) {
    return (
      <div className='p-6 bg-gray-100 dark:bg-gray-800 min-h-screen'>
        <div className='max-w-4xl mx-auto bg-white dark:bg-gray-700 rounded-lg shadow-md p-6'>
          <h1 className='text-3xl font-bold text-gray-800 dark:text-white mb-6'>Teacher Feedback</h1>
          <p className='text-red-600'>
            You are not eligible to submit feedback due to insufficient attendance ({attendance}%).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 bg-gray-100 dark:bg-gray-800 min-h-screen'>
      <div className='max-w-4xl mx-auto bg-white dark:bg-gray-700 rounded-lg shadow-md p-6'>
        <div className='flex items-center mb-6'>
          <FaUser className='text-3xl text-green-500 mr-3' />
          <h1 className='text-3xl font-bold text-gray-800 dark:text-white'>Teacher Feedback</h1>
        </div>
        <p className='text-gray-600 dark:text-gray-300 mb-6'>
          Provide detailed feedback on your teachers. Your input helps enhance teaching quality and will be analyzed by AI.
        </p>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Select Teacher
            </label>
            <select
              name='teacherId'
              value={feedback.teacherId}
              onChange={handleChange}
              className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white'
              required
            >
              <option value=''>Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.username} - {teacher.subject || 'No Subject'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Teaching Quality
            </label>
            <textarea
              name='teachingQuality'
              value={feedback.teachingQuality}
              onChange={handleChange}
              placeholder='Describe the overall quality of teaching methods and effectiveness.'
              className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white'
              rows='3'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Clarity
            </label>
            <textarea
              name='clarity'
              value={feedback.clarity}
              onChange={handleChange}
              placeholder='Comment on how clearly concepts are explained and understood.'
              className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white'
              rows='3'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Support
            </label>
            <textarea
              name='support'
              value={feedback.support}
              onChange={handleChange}
              placeholder='Share experiences with teacher support for questions, guidance, and help.'
              className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white'
              rows='3'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Engagement
            </label>
            <textarea
              name='engagement'
              value={feedback.engagement}
              onChange={handleChange}
              placeholder='Describe how engaging the classes are and student participation.'
              className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white'
              rows='3'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Additional Comments
            </label>
            <textarea
              name='additionalComments'
              value={feedback.additionalComments}
              onChange={handleChange}
              placeholder='Any other feedback or suggestions for teachers.'
              className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white'
              rows='3'
            />
          </div>
          <button
            type='submit'
            className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-md transition-colors'
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackTeacher;
