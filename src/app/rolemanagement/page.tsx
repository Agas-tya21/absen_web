"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Definisikan tipe data untuk objek Role
interface Role {
  idrole: string;
  namarole: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      try {
        // Menggunakan endpoint yang benar: /api/roleusers
        const response = await fetch(`${API_URL}/api/roleusers`);
        if (!response.ok) {
          if (response.status === 204) {
            setRoles([]);
            return;
          }
          throw new Error(`Error: ${response.statusText}`);
        }
        const data: Role[] = await response.json();
        setRoles(data);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navbar */}
      <header className="bg-[#19535F] text-white p-4 shadow-md flex justify-between items-center">
        <div className="font-bold text-lg">AbsenOfc</div>
        <nav>
          <ul className="flex space-x-6">
            <li><Link href="/" className="hover:text-blue-300 transition-colors">Home</Link></li>
            <li><Link href="/usermanagement" className="hover:text-blue-300 transition-colors">User Management</Link></li>
            <li><Link href="/logactivity" className="hover:text-blue-300 transition-colors">Log Activity</Link></li>
            <li><Link href="/kantormanagement" className="hover:text-blue-300 transition-colors">Kantor Management</Link></li>
            <li><Link href="/rolemanagement" className="hover:text-blue-300 transition-colors">Role Management</Link></li>
          </ul>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-white p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Role Management</h1>
        <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-md p-4">
          {roles.length === 0 ? (
            <p className="text-center text-gray-500">No roles found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Role</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role, index) => (
                  <tr key={role.idrole}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{role.idrole}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{role.namarole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}