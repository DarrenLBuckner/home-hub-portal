export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">404 - Page Not Found</h1>
        <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">Return to Home</a>
        
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600 mb-4">Need help? Contact our support team:</p>
          <a 
            href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%20got%20a%20404%20error%20and%20need%20help%20finding%20what%20I'm%20looking%20for." 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mb-2"
          >
            <span className="mr-2">�</span>
            WhatsApp Support
          </a>
          <p className="text-xs text-gray-500">Quick response via chat • +592 762-9797</p>
        </div>
      </div>
    </div>
  );
}