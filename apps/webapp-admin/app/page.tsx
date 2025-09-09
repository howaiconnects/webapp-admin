import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/Brand-Assets/HowAIConnects-Light-Theme-Logo.png"
            alt="How AI Connects Logo"
            className="h-16 mx-auto mb-4"
          />
        </div>

        {/* Hero Section */}
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          How AI Connects
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Discover the power of AI-driven connections. Transform your workflow with intelligent automation and seamless integration.
        </p>

        {/* Call-to-Action Button */}
        <Link
          href="/user/login"
          className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
        >
          Get Started
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Footer */}
        <div className="mt-16 text-sm text-gray-500">
          <p>AI-Powered Solutions for Modern Businesses</p>
        </div>
      </div>
    </div>
  )
}