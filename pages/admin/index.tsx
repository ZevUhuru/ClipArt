import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Admin Dashboard - Clip.Art</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <Link 
                href="/admin/logout"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Email Waitlist Card */}
            <Link href="/admin/waitlist">
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border-t-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Email Waitlist</h2>
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">View and manage email signups</p>
              </div>
            </Link>

            {/* Download Analytics Card */}
            <Link href="/admin/downloads">
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border-t-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Download Stats</h2>
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <p className="text-gray-600">Track image downloads and analytics</p>
              </div>
            </Link>

            {/* Upload Images Card */}
            <Link href="/admin/upload">
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border-t-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Upload Images</h2>
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">Upload and manage clip art images</p>
              </div>
            </Link>

            {/* Manage Images Card */}
            <Link href="/admin/images">
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border-t-4 border-yellow-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Manage Images</h2>
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-600">Edit and organize existing images</p>
              </div>
            </Link>

            {/* Analytics Card */}
            <Link href="/admin/analytics">
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border-t-4 border-red-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600">View site analytics and metrics</p>
              </div>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="text-gray-700 font-medium">View Live Site</span>
              </a>
              
              <Link href="/admin/waitlist">
                <div className="flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-blue-700 font-medium">Export Emails</span>
                </div>
              </Link>
              
              <Link href="/admin/upload">
                <div className="flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-purple-700 font-medium">Upload New Images</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

