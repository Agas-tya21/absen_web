import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navbar */}
      <header className="bg-[#19535F] text-white p-4 shadow-md flex justify-between items-center">
        {/* Logo */}
        <div className="font-bold text-lg">AbsenOfc</div>

        {/* Navigation Links */}
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:text-blue-300 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/usermanagement" className="hover:text-blue-300 transition-colors">
                User Management
              </Link>
            </li>
            <li>
              <Link href="/logactivity" className="hover:text-blue-300 transition-colors">
                Log Activity
              </Link>
            </li>
            <li>
              <Link href="/kantormanagement" className="hover:text-blue-300 transition-colors">
                Kantor Management
              </Link>
            </li>
            
          </ul>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-white"></main>
    </div>
  );
}