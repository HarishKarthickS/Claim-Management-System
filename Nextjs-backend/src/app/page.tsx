import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-white">
          Claim Management System API
        </h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          This is the backend API service for the Claim Management System.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-700">
            <p className="font-mono text-sm text-gray-800 dark:text-gray-200">
              Health check: <a href="/api/health" className="text-blue-600 hover:underline dark:text-blue-400">/api/health</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
