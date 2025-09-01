"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

// Define data types based on your backend models
interface Kantor {
  idkantor: string;
  namakantor: string;
}

interface User {
  nik: string;
  kantor: Kantor;
}

interface Transaksi {
  idtransaksi: string;
  waktutransaksi: string;
  aksi: {
    namaaksi: string;
  };
  user: User;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Home() {
  const [kantors, setKantors] = useState<Kantor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transaksis, setTransaksis] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kantorsResponse, usersResponse, transaksisResponse] = await Promise.all([
          fetch(`${API_URL}/api/kantors`),
          fetch(`${API_URL}/api/users`),
          fetch(`${API_URL}/api/transaksis`),
        ]);

        if (!kantorsResponse.ok && kantorsResponse.status !== 204) throw new Error("Failed to fetch offices.");
        if (!usersResponse.ok && usersResponse.status !== 204) throw new Error("Failed to fetch users.");
        if (!transaksisResponse.ok && transaksisResponse.status !== 204) throw new Error("Failed to fetch transactions.");

        const kantorsData: Kantor[] = kantorsResponse.status === 204 ? [] : await kantorsResponse.json();
        const usersData: User[] = usersResponse.status === 204 ? [] : await usersResponse.json();
        const transaksisData: Transaksi[] = transaksisResponse.status === 204 ? [] : await transaksisResponse.json();

        setKantors(kantorsData);
        setUsers(usersData);
        setTransaksis(transaksisData);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred while fetching data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const todayActivityCounts = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const counts = new Map<string, Set<string>>();

    transaksis.forEach((transaksi) => {
      const transactionDate = new Date(transaksi.waktutransaksi).toLocaleDateString();
      const namaAksi = transaksi.aksi?.namaaksi.toLowerCase();
      const userNik = transaksi.user?.nik;
      const kantorId = transaksi.user?.kantor?.idkantor;

      if (kantorId && userNik && transactionDate === today && (namaAksi === "masuk" || namaAksi === "izin")) {
        if (!counts.has(kantorId)) {
          counts.set(kantorId, new Set<string>());
        }
        counts.get(kantorId)?.add(userNik);
      }
    });

    const finalCounts = new Map<string, number>();
    counts.forEach((set, key) => {
      finalCounts.set(key, set.size);
    });

    return finalCounts;
  }, [transaksis]);

  const userCounts = useMemo(() => {
    const counts = new Map<string, number>();
    users.forEach((user) => {
      const kantorId = user.kantor?.idkantor;
      if (kantorId) {
        counts.set(kantorId, (counts.get(kantorId) || 0) + 1);
      }
    });
    return counts;
  }, [users]);

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
          </ul>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-white p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kantors.map((kantor) => (
            <>
              {/* Card for total employees per office */}
              <div key={`${kantor.idkantor}-user`} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">{kantor.namakantor} User</h2>
                <p className="text-4xl font-bold text-gray-800">
                  {userCounts.get(kantor.idkantor) || 0}
                </p>
              </div>
              {/* Card for today's activity per office */}
              <div key={`${kantor.idkantor}-activity`} className="bg-[#19535F] text-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">{kantor.namakantor} Activity</h2>
                <p className="text-4xl font-bold">
                  {todayActivityCounts.get(kantor.idkantor) || 0}
                </p>
              </div>
            </>
          ))}
        </div>
      </main>
    </div>
  );
}