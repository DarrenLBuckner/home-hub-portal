export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">404 - Page Not Found</h1>
        <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">Return to Home</a>
      </div>
    </div>
  );
}