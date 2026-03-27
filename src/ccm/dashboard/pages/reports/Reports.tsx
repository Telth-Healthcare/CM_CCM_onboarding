
function Reports() {
  return (
   <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Text */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
        Coming Soon
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        This page is under construction. We're working hard to bring it to you soon.
      </p>
    </div>
  )
}

export default Reports