"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Transaksi {
  idtransaksi: string;
  keterangan: string;
  waktutransaksi: string;
  koordinat: string;
  fotobukti: string;
  aksi: { namaaksi: string };
  status: { namastatus: string };
  user: { nik: string; nama: string; kantor: { namakantor: string; }; };
}

interface Status {
  idstatus: string;
  namastatus: string;
}

interface Kantor {
  idkantor: string;
  namakantor: string;
}

interface PivotedTransaksi {
  nik: string;
  nama: string;
  kantor: string;
  tanggal: string;
  jam_masuk: string;
  jam_pulang: string;
  jam_izin: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LogActivity() {
  const [transaksis, setTransaksis] = useState<Transaksi[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [kantors, setKantors] = useState<Kantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedKantor, setSelectedKantor] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchTransaksisAndStatusesAndKantors() {
      try {
        const transaksisResponse = await fetch(`${API_URL}/api/transaksis`);
        if (!transaksisResponse.ok) {
          if (transaksisResponse.status !== 204) {
            throw new Error(`Error fetching transactions: ${transaksisResponse.statusText}`);
          }
        } else {
          const data: Transaksi[] = await transaksisResponse.json();
          setTransaksis(data);
        }

        const statusesResponse = await fetch(`${API_URL}/api/statuses`);
        if (!statusesResponse.ok) {
          if (statusesResponse.status !== 204) {
            throw new Error(`Error fetching statuses: ${statusesResponse.statusText}`);
          }
        } else {
          const statusesData: Status[] = await statusesResponse.json();
          setStatuses(statusesData);
        }

        const kantorsResponse = await fetch(`${API_URL}/api/kantors`);
        if (!kantorsResponse.ok) {
          if (kantorsResponse.status !== 204) {
            throw new Error(`Error fetching kantors: ${kantorsResponse.statusText}`);
          }
        } else {
          const kantorsData: Kantor[] = await kantorsResponse.json();
          setKantors(kantorsData);
        }

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

    fetchTransaksisAndStatusesAndKantors();
  }, []);
  
  const statusCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    transaksis.forEach(transaksi => {
        const namastatus = transaksi.status?.namastatus;
        if (namastatus) {
            counts[namastatus] = (counts[namastatus] || 0) + 1;
        }
    });
    return counts;
  }, [transaksis]);

  const filteredByStatus = useMemo(() => {
    if (selectedStatus === "All") {
      return transaksis;
    }
    return transaksis.filter(transaksi => 
      transaksi.status.namastatus.toLowerCase() === selectedStatus.toLowerCase()
    );
  }, [transaksis, selectedStatus]);

  const kantorCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredByStatus.forEach(transaksi => {
        const namakantor = transaksi.user?.kantor?.namakantor;
        if (namakantor) {
            counts[namakantor] = (counts[namakantor] || 0) + 1;
        }
    });
    return counts;
  }, [filteredByStatus]);
  
  const finalFilteredTransaksis = useMemo(() => {
    let filteredByKantor = filteredByStatus;
    if (selectedKantor === "All") {
      filteredByKantor = filteredByStatus;
    } else {
      filteredByKantor = filteredByStatus.filter(transaksi => 
        transaksi.user?.kantor?.namakantor.toLowerCase() === selectedKantor.toLowerCase()
      );
    }

    if (!searchTerm) {
      return filteredByKantor;
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return filteredByKantor.filter(transaksi =>
      transaksi.user?.nama.toLowerCase().includes(lowercasedSearchTerm) ||
      transaksi.user?.nik.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [filteredByStatus, selectedKantor, searchTerm]);
  
  const groupTransaksiByDate = (transaksis: Transaksi[]) => {
    return transaksis.reduce((acc, currentTransaksi) => {
      const date = new Date(currentTransaksi.waktutransaksi).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(currentTransaksi);
      return acc;
    }, {} as Record<string, Transaksi[]>);
  };
  
  const groupedTransaksi = groupTransaksiByDate(finalFilteredTransaksis);

  const handleExportToExcel = () => {
    const uniqueTransaksis = finalFilteredTransaksis.reduce((acc, current) => {
        const date = new Date(current.waktutransaksi).toLocaleDateString();
        const key = `${current.user.nik}-${date}-${current.aksi.namaaksi}`;

        if (!acc[key] || new Date(current.waktutransaksi) < new Date(acc[key].waktutransaksi)) {
            acc[key] = current;
        }
        return acc;
    }, {} as Record<string, Transaksi>);

    const pivotedData = Object.values(uniqueTransaksis).reduce((acc: Record<string, PivotedTransaksi>, current: Transaksi) => {
        const date = new Date(current.waktutransaksi).toLocaleDateString();
        const key = `${current.user.nik}-${date}`;
        
        if (!acc[key]) {
            acc[key] = {
                nik: current.user.nik,
                nama: current.user.nama,
                kantor: current.user.kantor.namakantor,
                tanggal: date,
                jam_masuk: '',
                jam_pulang: '',
                jam_izin: '',
            };
        }

        const jam = new Date(current.waktutransaksi).toLocaleTimeString();
        if (current.aksi.namaaksi.toLowerCase() === 'masuk') {
            acc[key].jam_masuk = jam;
        } else if (current.aksi.namaaksi.toLowerCase() === 'pulang') {
            acc[key].jam_pulang = jam;
        } else if (current.aksi.namaaksi.toLowerCase() === 'izin') {
            acc[key].jam_izin = jam;
        }

        return acc;
    }, {} as Record<string, PivotedTransaksi>);

    const exportData = Object.values(pivotedData);

    const header = [
        "nik", "nama", "kantor", "tanggal", 
        "Jam Masuk", "Jam Pulang", "Jam Izin"
    ];
    
    const csvHeader = header.map(e => `"${e}"`).join(';');
    const csvBody = exportData.map(item => 
        [
            item.nik,
            item.nama,
            item.kantor,
            item.tanggal,
            item.jam_masuk,
            item.jam_pulang,
            item.jam_izin,
        ].map(e => `"${e}"`).join(';')
    ).join('\n');

    const csvContent = "\uFEFF" + csvHeader + "\n" + csvBody;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "log_activity.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Log Activity</h1>
        
        {/* Tab Filter by Status */}
        <div className="mb-4">
          <div className="inline-flex items-center space-x-2 p-1 bg-gray-200 rounded-full">
            <button
              className={`py-2 px-6 rounded-full text-sm font-semibold transition-colors
                ${selectedStatus === "All" ? "bg-[#19535F] text-white" : "text-gray-700 hover:bg-gray-300"}`}
              onClick={() => {
                  setSelectedStatus("All");
                  setSelectedKantor("All");
              }}
            >
              All ({transaksis.length})
            </button>
            {statuses.map(status => (
              <button
                key={status.idstatus}
                className={`py-2 px-6 rounded-full text-sm font-semibold transition-colors
                  ${selectedStatus.toLowerCase() === status.namastatus.toLowerCase() ? "bg-[#19535F] text-white" : "text-gray-700 hover:bg-gray-300"}`}
                onClick={() => {
                    setSelectedStatus(status.namastatus);
                    setSelectedKantor("All");
                }}
              >
                {status.namastatus} ({statusCounts[status.namastatus] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Tab Filter by Kantor */}
        <div className="mb-4">
          <div className="inline-flex items-center space-x-2 p-1 bg-gray-200 rounded-full">
            <button
              className={`py-2 px-6 rounded-full text-sm font-semibold transition-colors
                ${selectedKantor === "All" ? "bg-[#19535F] text-white" : "text-gray-700 hover:bg-gray-300"}`}
              onClick={() => setSelectedKantor("All")}
            >
              All ({filteredByStatus.length})
            </button>
            {kantors.map(kantor => (
              <button
                key={kantor.idkantor}
                className={`py-2 px-6 rounded-full text-sm font-semibold transition-colors
                  ${selectedKantor.toLowerCase() === kantor.namakantor.toLowerCase() ? "bg-[#19535F] text-white" : "text-gray-700 hover:bg-gray-300"}`}
                onClick={() => setSelectedKantor(kantor.namakantor)}
              >
                {kantor.namakantor} ({kantorCounts[kantor.namakantor] || 0})
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
            <input
                type="text"
                placeholder="Search by Nama or NIK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
            <button 
              onClick={handleExportToExcel}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
            >
                Export to Excel
            </button>
        </div>

        <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-md p-4">
          {finalFilteredTransaksis.length === 0 ? (
            <p className="text-center text-gray-500">No transactions found.</p>
          ) : (
            Object.keys(groupedTransaksi).map(date => (
              <div key={date} className="mb-8">
                <h3 className="text-sm font-bold mb-2">{date}</h3>
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">NIK</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Keterangan</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Waktu Transaksi</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Foto Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedTransaksi[date].map((transaksi, index) => (
                      <tr key={transaksi.idtransaksi}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.user.nik}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.user.nama}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.aksi.namaaksi}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.keterangan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(transaksi.waktutransaksi).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.status.namastatus}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaksi.fotobukti && (
                            <img
                              src={transaksi.fotobukti}
                              alt="Foto Bukti"
                              className="h-10 w-10 object-cover"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}