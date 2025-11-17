import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface DownloadStats {
  totalDownloads: number;
  downloadsByCategory: Array<{
    category: string;
    download_count: string;
    unique_users: string;
  }>;
  mostDownloaded: Array<{
    image_url: string;
    image_title: string;
    category: string;
    download_count: string;
    unique_downloaders: string;
    last_downloaded: string;
  }>;
  downloadsOverTime: Array<{
    date: string;
    download_count: string;
    unique_users: string;
  }>;
  recentStats: {
    today: string;
    this_week: string;
    this_month: string;
    unique_today: string;
    unique_week: string;
    unique_month: string;
  };
  topSources: Array<{
    source: string;
    download_count: string;
  }>;
}

export default function DownloadsAdmin() {
  const router = useRouter();
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchStats = async (secretKey: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/admin/download-stats?secret=${secretKey}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch download stats');
      }

      setStats(data.data);
      setAuthenticated(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setLoading(false);
      setAuthenticated(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(secret);
  };

  const exportToCSV = () => {
    if (!stats) return;

    const csv = [
      ['Image Title', 'Category', 'Download Count', 'Unique Downloaders', 'Last Downloaded'],
      ...stats.mostDownloaded.map(img => [
        img.image_title || 'Untitled',
        img.category || 'Uncategorized',
        img.download_count,
        img.unique_downloaders,
        new Date(img.last_downloaded).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `download-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Download Analytics - Clip.Art</title>
        </Head>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Download Analytics
            </h1>
            <form onSubmit={handleLogin}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter admin secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              {error && (
                <p className="text-red-600 text-sm mb-4">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'View Analytics'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading download stats...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Download Analytics - Clip.Art Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Download Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                  Track which images are most popular
                </p>
              </div>
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Downloads</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDownloads.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Today</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.recentStats.today}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.recentStats.unique_today} unique users</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">This Week</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.recentStats.this_week}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.recentStats.unique_week} unique users</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.recentStats.this_month}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.recentStats.unique_month} unique users</p>
            </div>
          </div>

          {/* Downloads by Category */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Downloads by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.downloadsByCategory.map((cat) => (
                <div key={cat.category} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{cat.category}</h3>
                  <p className="text-2xl font-bold text-blue-600">{cat.download_count}</p>
                  <p className="text-sm text-gray-500 mt-1">{cat.unique_users} unique downloaders</p>
                </div>
              ))}
            </div>
          </div>

          {/* Most Downloaded Images */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Most Downloaded Images</h2>
              <p className="text-sm text-gray-600 mt-1">Top 50 images by download count</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Downloaded
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.mostDownloaded.map((img, index) => (
                    <tr key={img.image_url} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img.image_url}
                            alt={img.image_title || 'Image'}
                            className="w-16 h-16 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {img.image_title || 'Untitled Image'}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {img.image_url}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {img.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {img.download_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {img.unique_downloaders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(img.last_downloaded).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Downloads Over Time Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Downloads Over Time (Last 30 Days)</h2>
            <div className="space-y-2">
              {stats.downloadsOverTime.slice(0, 10).map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(parseInt(day.download_count) / Math.max(...stats.downloadsOverTime.map(d => parseInt(d.download_count)))) * 100}%`
                          }}
                        >
                          <span className="text-xs text-white font-semibold">
                            {day.download_count}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-20 text-right">
                        {day.unique_users} users
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

