import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface WaitlistEmail {
  id: number;
  email: string;
  source: string;
  subscribed_at: string;
  unsubscribed: boolean;
}

export default function WaitlistAdmin() {
  const router = useRouter();
  const [emails, setEmails] = useState<WaitlistEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchEmails = async (secretKey: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/admin/waitlist-emails?secret=${secretKey}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      setEmails(data.emails);
      setAuthenticated(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
      setLoading(false);
      setAuthenticated(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails(secret);
  };

  const exportToCSV = () => {
    const csv = [
      ['Email', 'Source', 'Subscribed At'],
      ...emails.map(e => [e.email, e.source, new Date(e.subscribed_at).toLocaleString()])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Waitlist Admin - Clip.Art</title>
        </Head>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Waitlist Admin
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
                {loading ? 'Loading...' : 'Access Waitlist'}
              </button>
            </form>
            <p className="mt-4 text-sm text-gray-600">
              Set ADMIN_SECRET in your .env.local file
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Waitlist Emails ({emails.length}) - Clip.Art Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Email Waitlist
                </h1>
                <p className="text-gray-600 mt-1">
                  {emails.length} subscribers
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Signups</h3>
              <p className="text-3xl font-bold text-gray-900">{emails.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">This Week</h3>
              <p className="text-3xl font-bold text-gray-900">
                {emails.filter(e => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(e.subscribed_at) > weekAgo;
                }).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Today</h3>
              <p className="text-3xl font-bold text-gray-900">
                {emails.filter(e => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return new Date(e.subscribed_at) >= today;
                }).length}
              </p>
            </div>
          </div>

          {/* Email List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {email.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {email.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(email.subscribed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

