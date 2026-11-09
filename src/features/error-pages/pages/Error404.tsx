import { Link } from "react-router-dom";

export default function Error404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
      <h1 className="text-6xl font-bold text-brand-500">404</h1>
      <p className="text-gray-600 dark:text-gray-400 text-lg">
        Página no encontrada
      </p>
      <Link
        to="/"
        className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
      >
        Ir al dashboard
      </Link>
    </div>
  );
}
