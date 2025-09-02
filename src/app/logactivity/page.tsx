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
  user: { nik: string; nama: string; nohp: string; kantor: { namakantor: string; }; };
}

interface Status {
  idstatus: string;
  namastatus: string;
}

interface Kantor {
  idkantor: string;
  namakantor: string;
}

interface User {
  nik: string;
  nama: string;
  kantor: { namakantor: string; };
}

interface PivotedTransaksi {
  nik: string;
  nama: string;
  kantor: string;
  tanggal: string;
  jam_masuk: string;
  jam_pulang: string;
  jam_izin: string;
  waktuKerja: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LogActivity() {
  const [transaksis, setTransaksis] = useState<Transaksi[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [kantors, setKantors] = useState<Kantor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedKantor, setSelectedKantor] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchAllData() {
      try {
        const [transaksisResponse, statusesResponse, kantorsResponse, usersResponse] = await Promise.all([
          fetch(`${API_URL}/api/transaksis`),
          fetch(`${API_URL}/api/statuses`),
          fetch(`${API_URL}/api/kantors`),
          fetch(`${API_URL}/api/users`),
        ]);

        if (!transaksisResponse.ok && transaksisResponse.status !== 204) throw new Error("Failed to fetch transactions.");
        if (!statusesResponse.ok && statusesResponse.status !== 204) throw new Error("Failed to fetch statuses.");
        if (!kantorsResponse.ok && kantorsResponse.status !== 204) throw new Error("Failed to fetch offices.");
        if (!usersResponse.ok && usersResponse.status !== 204) throw new Error("Failed to fetch users.");

        const transaksisData: Transaksi[] = transaksisResponse.status === 204 ? [] : await transaksisResponse.json();
        const statusesData: Status[] = statusesResponse.status === 204 ? [] : await statusesResponse.json();
        const kantorsData: Kantor[] = kantorsResponse.status === 204 ? [] : await kantorsResponse.json();
        const usersData: User[] = usersResponse.status === 204 ? [] : await usersResponse.json();

        setTransaksis(transaksisData);
        setStatuses(statusesData);
        setKantors(kantorsData);
        setUsers(usersData);
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

    fetchAllData();
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

  const processDataForExport = (data: Transaksi[]) => {
    const uniqueTransaksis = data.reduce((acc, current) => {
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
                waktuKerja: ''
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

    const exportData = Object.values(pivotedData).map(item => {
        if (item.jam_masuk && item.jam_pulang) {
            const [jamMasuk, menitMasuk, detikMasuk] = item.jam_masuk.split(':').map(Number);
            const [jamPulang, menitPulang, detikPulang] = item.jam_pulang.split(':').map(Number);
            
            const start = new Date(item.tanggal);
            start.setHours(jamMasuk, menitMasuk, detikPulang);
            
            const end = new Date(item.tanggal);
            end.setHours(jamPulang, menitPulang, detikPulang);
            
            const diffInMs = end.getTime() - start.getTime();
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            
            const hours = Math.floor(diffInMinutes / 60);
            const minutes = diffInMinutes % 60;

            item.waktuKerja = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        return item;
    });
    
    return exportData;
  };
  
  const createCsvContent = (data: PivotedTransaksi[]) => {
      const header = [
        "nik", "nama", "kantor", "tanggal", 
        "Jam Masuk", "Jam Pulang", "Jam Izin", "Waktu Kerja"
      ];
      const csvHeader = header.map(e => `"${e}"`).join(';');
      const csvBody = data.map(item => 
          [
              item.nik,
              item.nama,
              item.kantor,
              item.tanggal,
              item.jam_masuk,
              item.jam_pulang,
              item.jam_izin,
              item.waktuKerja
          ].map(e => `"${e}"`).join(';')
      ).join('\n');
      return "\uFEFF" + csvHeader + "\n" + csvBody;
  };

  const downloadFile = (filename: string, content: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
  };

  const handleExportToExcel = () => {
    const exportData = processDataForExport(finalFilteredTransaksis);
    const csvContent = createCsvContent(exportData);
    downloadFile("log_activity.csv", csvContent);
  };
  
  const handleExportAllToExcel = async () => {
    const fileName = prompt("Masukkan nama file utama untuk ekspor:");

    if (!fileName) {
      return;
    }
    
    const usersMap = new Map(users.map(u => [u.nik, u]));
    const transactionsByUser = new Map<string, Transaksi[]>();
    
    transaksis.forEach(t => {
      if (!transactionsByUser.has(t.user.nik)) {
        transactionsByUser.set(t.user.nik, []);
      }
      transactionsByUser.get(t.user.nik)?.push(t);
    });

    const allUserNiks = new Set([...usersMap.keys(), ...transactionsByUser.keys()]);
    
    for (const nik of allUserNiks) {
      const userTransactions = transactionsByUser.get(nik) || [];
      
      const user = usersMap.get(nik) || (userTransactions.length > 0 ? userTransactions[0].user : undefined);
      
      if (user) {
        const exportData = processDataForExport(userTransactions);
        
        // Ensure there is at least one row for users with no transactions
        if (exportData.length === 0) {
          const emptyPivotedData: PivotedTransaksi = {
              nik: user.nik,
              nama: user.nama,
              kantor: user.kantor.namakantor,
              tanggal: '',
              jam_masuk: '',
              jam_pulang: '',
              jam_izin: '',
              waktuKerja: ''
          };
          exportData.push(emptyPivotedData);
        }

        const username = user.nama.replace(/[^a-zA-Z0-9]/g, '_');
        const finalFilename = `${fileName}_${nik}_${username}.csv`;
        const csvContent = createCsvContent(exportData);
        downloadFile(finalFilename, csvContent);

        // Wait for a short period before the next download
        await new Promise(resolve => setTimeout(resolve, 500));
      }
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
        
        <div className="mb-4 flex justify-between items-center space-x-4">
            <input
                type="text"
                placeholder="Search by Nama or NIK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
            <div className="flex space-x-2">
                <button 
                  onClick={handleExportToExcel}
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                    Export Filtered to Excel
                </button>
                <button
                  onClick={handleExportAllToExcel}
                  className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700"
                >
                    Export All to Excel
                </button>
            </div>
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
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No HP</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Keterangan</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Waktu Transaksi</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Koordinat</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Foto Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedTransaksi[date].map((transaksi, index) => (
                      <tr key={transaksi.idtransaksi}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.user.nik}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.user.nama}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaksi.user.nohp && (
                            <a 
                              href={`https://wa.me/${transaksi.user.nohp.startsWith('0') ? '62' + transaksi.user.nohp.substring(1) : transaksi.user.nohp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {transaksi.user.nohp}
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.aksi.namaaksi}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaksi.keterangan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(transaksi.waktutransaksi).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaksi.koordinat && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(transaksi.koordinat)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {transaksi.koordinat}
                            </a>
                          )}
                        </td>
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