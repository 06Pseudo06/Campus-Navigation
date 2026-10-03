import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CampusWay</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Campus Navigation and Wayfinding System Foundation
        </p>
      </header>

      <nav className="border rounded-lg p-4">
        <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3 tracking-wider">
          Navigation Routes
        </h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/explore" className="text-blue-600 dark:text-blue-400 hover:underline">
              /explore - Interactive Campus Exploration
            </Link>
          </li>
          <li>
            <Link href="/navigate" className="text-blue-600 dark:text-blue-400 hover:underline">
              /navigate - Route Planning & Navigation
            </Link>
          </li>
          <li>
            <Link href="/locations/sample" className="text-blue-600 dark:text-blue-400 hover:underline">
              /locations/[locationId] - Location Details
            </Link>
          </li>
          <li>
            <Link href="/help" className="text-blue-600 dark:text-blue-400 hover:underline">
              /help - Visitor Assistance
            </Link>
          </li>
          <li>
            <Link href="/admin/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              /admin/login - Admin Login
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
              /admin/dashboard - Admin Dashboard
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
