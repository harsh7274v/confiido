import Link from 'next/link';

export default function NavTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Navigation Test</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Direct Links Test</h2>
          <div className="space-x-4">
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Go to Login
            </Link>
            <Link href="/signup" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Go to Signup
            </Link>
            <Link href="/" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Go to Home
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current URL</h2>
          <p className="text-gray-600">You are currently on: <code className="bg-gray-100 px-2 py-1 rounded">/nav-test</code></p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click "Go to Login" - should take you to the login page</li>
            <li>Click "Go to Signup" - should take you to the signup page</li>
            <li>Click "Go to Home" - should take you back to the homepage</li>
            <li>If any link doesn't work, there's a routing issue</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
