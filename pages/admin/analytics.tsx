import { useState, useEffect } from 'react';
import AdminLayout from 'src/components/Admin/Layout';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalImages: 0,
    publishedImages: 0,
    totalDownloads: 0,
    totalViews: 0,
    averageDownloads: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/images');
      const data = await response.json();
      
      if (data.success) {
        const images = data.data;
        const totalDownloads = images.reduce((sum: number, img: any) => sum + img.download_count, 0);
        const totalViews = images.reduce((sum: number, img: any) => sum + img.view_count, 0);
        
        setStats({
          totalImages: images.length,
          publishedImages: images.filter((img: any) => img.published).length,
          totalDownloads,
          totalViews,
          averageDownloads: images.length > 0 ? Math.round(totalDownloads / images.length) : 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your clip art performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Images</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalImages}</p>
              </div>
              <div className="text-4xl">🖼️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.publishedImages}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalDownloads}</p>
              </div>
              <div className="text-4xl">📥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalViews}</p>
              </div>
              <div className="text-4xl">👁️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Downloads per Image</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.averageDownloads}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.totalViews > 0 
                    ? Math.round((stats.totalDownloads / stats.totalViews) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            📊 Analytics Coming Soon
          </h3>
          <p className="text-sm text-blue-700">
            More detailed analytics including charts, popular images, trending searches, 
            and geographic data will be available in future updates.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}


