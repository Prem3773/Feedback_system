import React from 'react'
import Card from './Card'

const SectionCard = () => {
  return (
    <section className="py-20 bg-gray-50 w-full">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Powerful Features, Actionable Insights</h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
            Unlock the potential of your feedback data with our suite of intelligent tools.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <Card>
            <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-bold mt-4">ML Based Sentiment Analysis</h3>
            <p className="mt-2 text-gray-600">
               categorize feedback into positive, neutral, or negative sentiments  based on student feedback to quickly gauge student opinion.
            </p>
          </Card>
          <Card>
            <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            <h3 className="text-xl font-bold mt-4">Performance Trend Graphs</h3>
            <p className="mt-2 text-gray-600">
              Visualize teacher performance over time with intuitive charts, identifying areas of strength and opportunities for growth.
            </p>
          </Card>
          <Card>
            <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
            </svg>
            <h3 className="text-xl font-bold mt-4">Smart Improvement Tips</h3>
            <p className="mt-2 text-gray-600">
              Receive concrete, AI-generated suggestions based on aggregated feedback to help educators enhance their teaching methods.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default SectionCard