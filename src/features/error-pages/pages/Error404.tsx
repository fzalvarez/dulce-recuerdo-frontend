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
        className="text-brand-500 hover:text-brand-600 text-sm font-medium"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
