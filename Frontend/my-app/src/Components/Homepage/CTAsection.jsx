import React from 'react'
import { Link } from 'react-router-dom'; // Import Link for routing

const CTAsection = () => {
    return (
        <div className="bg-gray-50">
           <section className="text-center py-2 md:py-32 px-2 animate-fade-in mb- ">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            <span className="block">Welcome to </span>
            <span className="block text-blue-600 mt-2">EduFeed</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600">
            Real-time Insights for Educational Excellence. <br /> Empowering institutions with AI-ML driven feedback analysis.
          </p>
          <div className="mt-8">
            <Link to="/register" className="inline-flex items-center justify-center px-8 py-2 text-2xl font-large text-center text-blue-600 border border-black border-2 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100">
              Get Started
            </Link>
          </div>
        </section>
        </div>
    )
}

export default CTAsection