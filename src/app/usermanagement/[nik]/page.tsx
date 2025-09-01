"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';

interface User {
  nik: string;
  nama: string;
  email: string;
  nohp: string;
  tanggallahir: string;
  fotoselfie: string;
  roleUser: { idrole: string; namarole: string } | null;
  kantor: { idkantor: string; namakantor: string } | null;
}

interface Transaksi {
    idtransaksi: string;
    aksi: { namaaksi: string };
    keterangan: string;
    waktutransaksi: string;
    koordinat: string;
    status: { namastatus: string };
    fotobukti: string;
    user: { nik: string };
}

interface RoleUser {
  idrole: string;
  namarole: string;
}

interface Kantor {
  idkantor: string;
  namakantor: string;
}

interface Aksi {
    idaksi: string;
    namaaksi: string;
}

interface Status {
  idstatus: string;
  namastatus: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function UserUpdatePage() {
    const params = useParams();
    const nik = params.nik as string;

    const [user, setUser] = useState<User | null>(null);
    const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
    const [roles, setRoles] = useState<RoleUser[]>([]);
    const [kantors, setKantors] = useState<Kantor[]>([]);
    const [aksis, setAksis] = useState<Aksi[]>([]);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [fotoSelfieFile, setFotoSelfieFile] = useState<File | null>(null);
    const [isLogFormVisible, setIsLogFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        nik: '',
        nama: '',
        email: '',
        nohp: '',
        tanggallahir: '',
        fotoselfie: '',
        idroleuser: '',
        idkantor: ''
    });
    const [logFormData, setLogFormData] = useState({
        keterangan: '',
        idaksi: '',
        idstatus: '',
        koordinat: '',
    });
    const [fotoBuktiFile, setFotoBuktiFile] = useState<File | null>(null);

    const fetchAllData = async () => {
        try {
            const userResponse = await fetch(`${API_URL}/api/users/${nik}`);
            if (!userResponse.ok) {
                if (userResponse.status === 204) {
                    setUser(null);
                } else {
                    throw new Error(`Error fetching user: ${userResponse.statusText}`);
                }
            } else {
                const userData: User = await userResponse.json();
                setUser(userData);
                
                const dateFromAPI = userData.tanggallahir ? new Date(userData.tanggallahir) : null;
                const formattedDate = dateFromAPI ? dateFromAPI.toISOString().split('T')[0] : '';
                
                setFormData({
                    nik: userData.nik,
                    nama: userData.nama,
                    email: userData.email,
                    nohp: userData.nohp,
                    tanggallahir: formattedDate,
                    fotoselfie: userData.fotoselfie,
                    idroleuser: userData.roleUser?.idrole || '',
                    idkantor: userData.kantor?.idkantor || ''
                });
            }

            const rolesResponse = await fetch(`${API_URL}/api/roleusers`);
            if (!rolesResponse.ok) {
                if (rolesResponse.status !== 204) { throw new Error(`Error fetching roles: ${rolesResponse.statusText}`); }
            } else { const rolesData: RoleUser[] = await rolesResponse.json(); setRoles(rolesData); }
            
            const kantorsResponse = await fetch(`${API_URL}/api/kantors`);
            if (!kantorsResponse.ok) {
                if (kantorsResponse.status !== 204) { throw new Error(`Error fetching kantors: ${kantorsResponse.statusText}`); }
            } else { const kantorsData: Kantor[] = await kantorsResponse.json(); setKantors(kantorsData); }

            const aksisResponse = await fetch(`${API_URL}/api/aksi`);
            if (!aksisResponse.ok) {
                if (aksisResponse.status !== 204) { throw new Error(`Error fetching aksis: ${aksisResponse.statusText}`); }
            } else { const aksisData: Aksi[] = await aksisResponse.json(); setAksis(aksisData); }

            const statusesResponse = await fetch(`${API_URL}/api/statuses`);
            if (!statusesResponse.ok) {
                if (statusesResponse.status !== 204) { throw new Error(`Error fetching statuses: ${statusesResponse.statusText}`); }
            } else { const statusesData: Status[] = await statusesResponse.json(); setStatuses(statusesData); }

            fetchTransaksi();

        } catch (e: unknown) {
            if (e instanceof Error) { setError(e.message); } else { setError("An unknown error occurred."); }
        } finally {
            setLoading(false);
        }
    };
    
    const fetchTransaksi = async () => {
        try {
            const transaksiResponse = await fetch(`${API_URL}/api/transaksis`);
            if (!transaksiResponse.ok) {
                if (transaksiResponse.status === 204) { setTransaksi([]); }
                else { throw new Error(`Error fetching transactions: ${transaksiResponse.statusText}`); }
            } else {
                const transaksiData: Transaksi[] = await transaksiResponse.json();
                const userTransaksi = transaksiData.filter((t: Transaksi) => t.user?.nik === nik);
                setTransaksi(userTransaksi);
            }
        } catch (e: unknown) {
            if (e instanceof Error) { setNotification({ message: e.message, type: 'error' }); }
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [nik]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLogFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) { setFotoSelfieFile(e.target.files[0]); }
    };

    const handleLogFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) { setFotoBuktiFile(e.target.files[0]); }
    };
    
    const groupTransaksiByDate = (transaksis: Transaksi[]) => {
      return transaksis.reduce((acc, currentTransaksi) => {
        const date = new Date(currentTransaksi.waktutransaksi).toLocaleDateString();
        if (!acc[date]) { acc[date] = []; }
        acc[date].push(currentTransaksi);
        return acc;
      }, {} as Record<string, Transaksi[]>);
    };

    const groupedTransaksi = useMemo(() => groupTransaksiByDate(transaksi), [transaksi]);
    
    const handleUpdate = async () => {
        setNotification(null);
        try {
            const jsonResponse = await fetch(`${API_URL}/api/users/${nik}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({
                    ...formData,
                    roleUser: { idrole: formData.idroleuser },
                    kantor: { idkantor: formData.idkantor }
                }),
            });
            if (!jsonResponse.ok) { throw new Error('Gagal memperbarui data pengguna.'); }

            if (fotoSelfieFile) {
                const fotoFormData = new FormData();
                fotoFormData.append('fotoselfie', fotoSelfieFile);

                const fileResponse = await fetch(`${API_URL}/api/users/${nik}/upload-foto`, { method: 'PUT', body: fotoFormData, });
                if (!fileResponse.ok) { throw new Error('Gagal mengunggah foto selfie.'); }
                
                const updatedUserData: User = await fileResponse.json();
                setUser(updatedUserData);
                setFormData(prev => ({ ...prev, fotoselfie: updatedUserData.fotoselfie }));
            }
            
            setNotification({ message: 'Berhasil diperbarui!', type: 'success' });
            setFotoSelfieFile(null);
        } catch (e: unknown) {
            if (e instanceof Error) { setNotification({ message: e.message, type: 'error' }); }
            else { setNotification({ message: 'Terjadi kesalahan tidak terduga.', type: 'error' }); }
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotification(null);

        const data = new FormData();
        data.append('transaksi', new Blob([JSON.stringify({
            keterangan: logFormData.keterangan,
            waktutransaksi: new Date().toISOString(),
            koordinat: logFormData.koordinat,
            idaksi: logFormData.idaksi,
            idstatus: logFormData.idstatus,
            user: { nik: nik }
        })], { type: 'application/json' }));
        if (fotoBuktiFile) {
            data.append('fotobukti', fotoBuktiFile);
        }

        try {
            const response = await fetch(`${API_URL}/api/transaksis`, { method: 'POST', body: data, });
            if (response.ok) {
                setNotification({ message: 'Transaksi berhasil ditambahkan!', type: 'success' });
                setLogFormData({ keterangan: '', idaksi: '', idstatus: '', koordinat: '' });
                setFotoBuktiFile(null);
                setIsLogFormVisible(false);
                fetchTransaksi();
            } else {
                setNotification({ message: 'Gagal menambahkan transaksi.', type: 'error' });
            }
        } catch (e: unknown) {
            if (e instanceof Error) { setNotification({ message: e.message, type: 'error' }); }
            else { setNotification({ message: 'Terjadi kesalahan tidak terduga.', type: 'error' }); }
        }
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!user) return <div className="p-8 text-center">User not found.</div>;

    return (
        <div className="flex flex-col min-h-screen">
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
            <main className="flex-1 bg-white p-8">
                <div className="relative p-6 bg-gray-100 rounded-lg shadow-xl max-w-7xl mx-auto">
                    <Link href="/usermanagement" className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</Link>
                    {notification && (<div className={`p-4 mb-4 rounded-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification.message}</div>)}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-200 rounded-lg h-64">
                             {fotoSelfieFile ? (
                                <img src={URL.createObjectURL(fotoSelfieFile)} alt="Preview Foto Selfie" className="w-full h-full object-cover rounded-lg" />
                            ) : user?.fotoselfie ? (
                                <img src={user.fotoselfie} alt="Foto Selfie" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <span className="text-gray-500">Foto Selfie</span>
                            )}
                            <input type="file" name="fotoselfie" onChange={handleFileChange} className="mt-2 text-sm text-gray-500" />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">NIK</label>
                                <input type="text" name="nik" value={formData.nik} readOnly placeholder="NIK" className="p-2 border rounded" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">Nama</label>
                                <input type="text" name="nama" value={formData.nama} onChange={handleFormChange} placeholder="Nama" className="p-2 border rounded" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">Email</label>
                                <input type="text" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email" className="p-2 border rounded" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">Nomor HP</label>
                                <input type="text" name="nohp" value={formData.nohp} onChange={handleFormChange} placeholder="Nomor HP" className="p-2 border rounded" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">Tanggal Lahir</label>
                                <input type="date" name="tanggallahir" value={formData.tanggallahir} onChange={handleFormChange} placeholder="Tanggal Lahir" className="p-2 border rounded" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">Kantor</label>
                                <select name="idkantor" value={formData.idkantor} onChange={handleFormChange} className="p-2 border rounded">
                                    {kantors.map((kantor) => (<option key={kantor.idkantor} value={kantor.idkantor}>{kantor.namakantor}</option>))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">Role</label>
                                <select name="idroleuser" value={formData.idroleuser} onChange={handleFormChange} className="p-2 border rounded">
                                    {roles.map((role) => (<option key={role.idrole} value={role.idrole}>{role.namarole}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleUpdate} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg float-right">Simpan</button>
                    <div className="clearfix"></div>
                    <div className="flex justify-between items-center mt-12 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Log Aktivitas</h2>
                        <button onClick={() => setIsLogFormVisible(!isLogFormVisible)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center">
                            <FaPlus className="mr-2"/> Tambah Data
                        </button>
                    </div>
                    {isLogFormVisible && (
                        <div className="mb-6 bg-gray-200 p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-bold mb-4">Tambah Transaksi Baru</h3>
                            <form onSubmit={handleLogSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex flex-col">
                                        <label className="text-sm text-gray-600 mb-1">Aksi</label>
                                        <select name="idaksi" value={logFormData.idaksi} onChange={handleLogFormChange} className="p-2 border rounded" required>
                                            <option value="">Pilih Aksi</option>
                                            {aksis.map(aksi => (<option key={aksi.idaksi} value={aksi.idaksi}>{aksi.namaaksi}</option>))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-gray-600 mb-1">Status</label>
                                        <select name="idstatus" value={logFormData.idstatus} onChange={handleLogFormChange} className="p-2 border rounded" required>
                                            <option value="">Pilih Status</option>
                                            {statuses.map(status => (<option key={status.idstatus} value={status.idstatus}>{status.namastatus}</option>))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-gray-600 mb-1">Keterangan</label>
                                        <input type="text" name="keterangan" value={logFormData.keterangan} onChange={handleLogFormChange} placeholder="Keterangan" className="p-2 border rounded" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-gray-600 mb-1">Koordinat</label>
                                        <input type="text" name="koordinat" value={logFormData.koordinat} onChange={handleLogFormChange} placeholder="koordinat" className="p-2 border rounded" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-gray-600 mb-1">Foto Bukti</label>
                                        <input type="file" name="fotobukti" onChange={handleLogFileChange} className="p-2" />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">Simpan Log</button>
                                </div>
                            </form>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                      {transaksi.length === 0 ? (
                        <p className="text-center text-gray-500">No log activity found.</p>
                      ) : (
                        Object.keys(groupedTransaksi).map(date => (
                            <div key={date} className="mb-8">
                                <h3 className="text-sm font-bold mb-2">{date}</h3>
                                <table className="min-w-full divide-y divide-gray-300">
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {groupedTransaksi[date].map((log, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.aksi.namaaksi}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.keterangan}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.koordinat}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(log.waktutransaksi).toLocaleTimeString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.status.namastatus}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.fotobukti && (
                                                        <img src={log.fotobukti} alt="Foto Bukti" className="h-10 w-10 object-cover" />
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
                </div>
            </main>
        </div>
    );
}