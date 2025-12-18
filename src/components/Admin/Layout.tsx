import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navigation = [
    { name: 'Upload', href: '/admin/upload', icon: '📤' },
    { name: 'Images', href: '/admin/images', icon: '🖼️' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/admin/upload" className="text-xl font-bold text-indigo-600">
                Clip.Art Admin
              </Link>
              <nav className="flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      router.pathname === item.href
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                target="_blank"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Site →
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}



