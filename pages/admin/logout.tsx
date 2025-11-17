import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminLogout() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Always redirect to login, even if logout fails
        router.push('/admin/login');
      }
    };

    logout();
  }, [router]);

  return (
    <>
      <Head>
        <title>Logging out... - Clip.Art</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Logging out...</p>
        </div>
      </div>
    </>
  );
}

