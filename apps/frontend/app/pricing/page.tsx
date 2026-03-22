'use client';

import Link from 'next/link';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🖼️ Background Remover
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Start for free, upgrade when you need more.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                3 images/day for anonymous users
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Standard resolution
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                No registration required
              </li>
            </ul>
            <Link href="/" className="btn-secondary w-full block text-center">
              Get Started
            </Link>
          </div>

          {/* Day Pass */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Day Pass</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0.99</span>
              <span className="text-gray-500">/day</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited images
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                High resolution output
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                No watermarks
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Valid for 24 hours
              </li>
            </ul>
            <button className="btn-primary w-full">
              Buy Day Pass
            </button>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">$2.99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited images/month
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                High resolution output
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                No watermarks
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                API access (coming soon)
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Cancel anytime
              </li>
            </ul>
            <button className="btn-primary">
              Subscribe Now
            </button>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Note</h4>
          <p className="text-blue-800">
            We're currently in MVP testing. Payment integration is coming soon. 
            For now, enjoy the free tier while we're testing the service!
          </p>
        </div>
      </main>

      <footer className="bg-white mt-16 py-8 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Background Remover. All rights reserved.</p>
      </footer>
    </div>
  );
}
