import { Link } from 'react-router-dom';
import { Home, Search, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">404</h1>
          <p className="text-xl text-secondary-600">Page Not Found</p>
        </div>
        <p className="text-secondary-500 mb-8 max-w-sm mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link to="/projects" className="btn-secondary flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Browse Projects
          </Link>
        </div>
        <div className="mt-12 text-center">
          <p className="text-secondary-500 text-sm">
            If you think this is a mistake, please{' '}
            <a href="mailto:support@fs04.pm" className="text-primary-600 hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}