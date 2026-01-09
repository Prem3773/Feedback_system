import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TeachingImprovementReport = ({
  teacherName,
  positive_percent,
  neutral_percent,
  negative_percent,
  fast_positive_points,
  fast_negative_points,
  slow_positive_points,
  slow_negative_points,
  aoi_points,
}) => {
  const reportRef = useRef();

  const handleDownloadPdf = async () => {
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new (jsPDF.jsPDF || jsPDF)('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeName = (teacherName || "Teacher").toString().replace(/\s+/g, '_');
      pdf.save(`EduFeed_Report_${safeName}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert(`Could not generate PDF: ${error.message}`);
    }
  };

  const parseList = (text) => {
    if (!text) return [];
    return text.split('\n').map(item => item.replace(/^- /, '').trim()).filter(item => item);
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-900 min-h-screen p-8">
      <div className="w-full max-w-5xl flex justify-end mb-4">
        <button
          onClick={handleDownloadPdf}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:scale-105 flex items-center gap-2"
        >
          <span>Download PDF Report</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
      </div>

      <div ref={reportRef} className="w-full max-w-5xl p-12 rounded-xl font-sans relative overflow-hidden" style={{ backgroundColor: '#ffffff', color: '#1f2937', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-2" style={{ background: 'linear-gradient(90deg, #3b82f6, #a855f7, #ec4899)' }}></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-50" style={{ backgroundColor: '#f3e8ff', filter: 'blur(64px)' }}></div>
        <div className="absolute top-20 -left-10 w-40 h-40 rounded-full opacity-50" style={{ backgroundColor: '#dbeafe', filter: 'blur(64px)' }}></div>

        {/* Header */}
        <div className="flex justify-between items-end pb-6 mb-8 relative z-10" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h1 className="text-5xl font-extrabold" style={{ color: '#2563eb' }}>
              EduFeed
            </h1>
            <p className="text-lg mt-1 tracking-wide" style={{ color: '#6b7280' }}>Teaching Quality Improvement Report</p>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-wider font-semibold" style={{ color: '#9ca3af' }}>Faculty Name</p>
            <h2 className="text-3xl font-bold" style={{ color: '#1f2937' }}>{teacherName}</h2>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* 1. Overall Sentiment */}
        <div className="mb-10 relative z-10">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#1f2937' }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>1</span>
            Overall Sentiment Overview
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Positive', value: positive_percent, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
              { label: 'Neutral', value: neutral_percent, color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
              { label: 'Negative', value: negative_percent, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
            ].map((item, idx) => (
              <div key={idx} className={`rounded-xl p-6 text-center`} style={{ backgroundColor: item.bg, border: `1px solid ${item.border}`, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                <div className={`text-4xl font-extrabold mb-2`} style={{ color: item.color }}>{item.value}%</div>
                <div className="font-medium uppercase tracking-wider text-sm" style={{ color: '#4b5563' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Learning Pace Analysis (Table) */}
        <div className="mb-10 relative z-10">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#1f2937' }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>2</span>
            Learning-Pace Based Feedback Analysis
          </h3>
          <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-1/5" style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Learner Group</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-2/5" style={{ color: '#16a34a', borderBottom: '1px solid #e5e7eb' }}>Positive Themes</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-2/5" style={{ color: '#dc2626', borderBottom: '1px solid #e5e7eb' }}>Negative Themes</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff' }}>
                <tr>
                  <td className="px-6 py-6 whitespace-nowrap" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                      Fast Learners
                    </span>
                  </td>
                  <td className="px-6 py-6 align-top" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <ul className="space-y-2">
                      {parseList(fast_positive_points).map((point, i) => (
                        <li key={i} className="flex items-start text-sm" style={{ color: '#374151' }}>
                          <span className="mr-2" style={{ color: '#22c55e' }}>✓</span> {point}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-6 align-top" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <ul className="space-y-2">
                      {parseList(fast_negative_points).map((point, i) => (
                        <li key={i} className="flex items-start text-sm" style={{ color: '#374151' }}>
                          <span className="mr-2" style={{ color: '#ef4444' }}>⚠</span> {point}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <td className="px-6 py-6 whitespace-nowrap" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full" style={{ backgroundColor: '#ffedd5', color: '#9a3412' }}>
                      Slow Learners
                    </span>
                  </td>
                  <td className="px-6 py-6 align-top" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <ul className="space-y-2">
                      {parseList(slow_positive_points).map((point, i) => (
                        <li key={i} className="flex items-start text-sm" style={{ color: '#374151' }}>
                          <span className="mr-2" style={{ color: '#22c55e' }}>✓</span> {point}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-6 align-top" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <ul className="space-y-2">
                      {parseList(slow_negative_points).map((point, i) => (
                        <li key={i} className="flex items-start text-sm" style={{ color: '#374151' }}>
                          <span className="mr-2" style={{ color: '#ef4444' }}>⚠</span> {point}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Areas of Improvement */}
        <div className="mb-10 relative z-10">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#1f2937' }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}>3</span>
            Areas for Improvement
          </h3>
          <div className="rounded-xl p-6" style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parseList(aoi_points).map((point, i) => (
                <div key={i} className="flex items-start p-3 rounded-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #ffedd5', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                  <span className="text-xl mr-3" style={{ color: '#f97316' }}>•</span>
                  <span className="font-medium" style={{ color: '#374151' }}>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Actionable Recommendations */}
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#1f2937' }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#ccfbf1', color: '#0d9488' }}>4</span>
            Actionable Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl transition" style={{ backgroundColor: '#ffffff', borderTop: '4px solid #14b8a6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h4 className="font-bold text-lg mb-2" style={{ color: '#1f2937' }}>Differentiated Instruction</h4>
              <p className="text-sm" style={{ color: '#4b5563' }}>Implement tiered assignments to challenge fast learners while providing scaffolding for slow learners.</p>
            </div>
            <div className="p-6 rounded-xl transition" style={{ backgroundColor: '#ffffff', borderTop: '4px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h4 className="font-bold text-lg mb-2" style={{ color: '#1f2937' }}>Interactive Pacing</h4>
              <p className="text-sm" style={{ color: '#4b5563' }}>Use real-time polls to gauge understanding before moving to the next topic.</p>
            </div>
            <div className="p-6 rounded-xl transition" style={{ backgroundColor: '#ffffff', borderTop: '4px solid #a855f7', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h4 className="font-bold text-lg mb-2" style={{ color: '#1f2937' }}>Real-world Application</h4>
              <p className="text-sm" style={{ color: '#4b5563' }}>Integrate more case studies and industry examples to increase engagement for all learner types.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 text-center" style={{ borderTop: '1px solid #e5e7eb' }}>
          <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Generated by EduFeed AI Analysis System</p>
        </div>
      </div>
    </div>
  );
};

export default TeachingImprovementReport;