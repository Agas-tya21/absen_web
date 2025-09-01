"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

// Definisikan tipe data untuk objek User
interface User {
  nik: string;
  email: string;
  password?: string;
  nama: string;
  tanggallahir: string;
  nohp: string;
  fotoselfie: string;
  roleUser: { namarole: string };
  kantor: { namakantor: string };
}

interface RoleUser {
  idrole: string;
  namarole: string;
}

interface Kantor {
  idkantor: string;
  namakantor: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleUser[]>([]);
  const [kantors, setKantors] = useState<Kantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKantor, setSelectedKantor] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
      nik: '',
      nama: '',
      email: '',
      password: '',
      tanggallahir: '',
      nohp: '',
      idroleuser: '',
      idkantor: ''
  });
  const [fotoselfieFile, setFotoselfieFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const usersResponse = await fetch(`${API_URL}/api/users`);
        if (!usersResponse.ok) {
          if (usersResponse.status !== 204) {
            throw new Error(`Error fetching users: ${usersResponse.statusText}`);
          }
          setUsers([]);
        } else {
            const usersData: User[] = await usersResponse.json();
            setUsers(usersData);
        }

        const rolesResponse = await fetch(`${API_URL}/api/roleusers`);
        if (!rolesResponse.ok) {
            if (rolesResponse.status !== 204) {
                throw new Error(`Error fetching roles: ${rolesResponse.statusText}`);
            }
        } else {
            const rolesData: RoleUser[] = await rolesResponse.json();
            setRoles(rolesData);
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
  };
  
  const kantorCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    users.forEach(user => {
        const namakantor = user.kantor?.namakantor;
        if (namakantor) {
            counts[namakantor] = (counts[namakantor] || 0) + 1;
        }
    });
    return counts;
  }, [users]);
  
  const filteredUsers = useMemo(() => {
    let filteredByKantor = users;
    if (selectedKantor !== "All") {
        filteredByKantor = users.filter(user =>
            user.kantor?.namakantor.toLowerCase() === selectedKantor.toLowerCase()
        );
    }

    if (!searchTerm) {
        return filteredByKantor;
    }
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return filteredByKantor.filter(user =>
        user.nama.toLowerCase().includes(lowercasedSearchTerm) ||
        user.nik.toLowerCase().includes(lowercasedSearchTerm) ||
        user.email.toLowerCase().includes(lowercasedSearchTerm) ||
        user.nohp.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [users, selectedKantor, searchTerm]);
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: value
      }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setFotoselfieFile(e.target.files[0]);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setNotification(null);

      const data = new FormData();
      data.append('user', new Blob([JSON.stringify({
          ...formData,
          roleUser: { idrole: formData.idroleuser },
          kantor: { idkantor: formData.idkantor }
      })], { type: 'application/json' }));
      if (fotoselfieFile) {
          data.append('fotoselfie', fotoselfieFile);
      }

      try {
          const response = await fetch(`${API_URL}/api/users`, {
              method: 'POST',
              body: data,
          });

          if (response.ok) {
              setNotification({ message: 'User berhasil ditambahkan!', type: 'success' });
              setFormData({ nik: '', nama: '', email: '', password: '', tanggallahir: '', nohp: '', idroleuser: '', idkantor: '' });
              setFotoselfieFile(null);
              setIsFormVisible(false);
              fetchData();
          } else {
              setNotification({ message: 'Gagal menambahkan user.', type: 'error' });
          }
      } catch (e: unknown) {
          if (e instanceof Error) {
                  setNotification({ message: e.message, type: 'error' });
              } else {
                  setNotification({ message: 'Terjadi kesalahan tidak terduga.', type: 'error' });
              }
      }
      setTimeout(() => setNotification(null), 3000);
  };
  
  const handleDelete = async (nik: string) => {
    if (window.confirm(`Are you sure you want to delete user with NIK: ${nik}?`)) {
      try {
        const response = await fetch(`${API_URL}/api/users/${nik}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        setUsers(users.filter((user) => user.nik !== nik));
        alert("User deleted successfully!");
      } catch (e: unknown) {
        if (e instanceof Error) {
          alert(`Failed to delete user: ${e.message}`);
        } else {
          alert("Failed to delete user due to an unknown error.");
        }
      }
    }
  };

  const handleUpdate = (nik: string) => {
    router.push(`/usermanagement/${nik}`);
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management</h1>
        
        {notification && (
            <div className={`p-4 mb-4 rounded-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {notification.message}
            </div>
        )}

        <div className="mb-4">
          <div className="flex items-center space-x-2 p-1 bg-gray-200 rounded-full">
            <button
            className={`py-2 px-6 rounded-full text-sm font-semibold transition-colors
                ${selectedKantor === "All" ? "bg-[#19535F] text-white" : "text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setSelectedKantor("All")}
            >
            All ({users.length})
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
            <button 
                onClick={() => setIsFormVisible(!isFormVisible)}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center"
            >
                <FaPlus className="mr-2"/> Tambah Data
            </button>
        </div>
        
        {isFormVisible && (
            <div className="mb-6 bg-gray-100 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Tambah User Baru</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="nik"
                            value={formData.nik}
                            onChange={handleFormChange}
                            placeholder="NIK"
                            className="p-2 border rounded-lg"
                            required
                        />
                        <input
                            type="text"
                            name="nama"
                            value={formData.nama}
                            onChange={handleFormChange}
                            placeholder="Nama"
                            className="p-2 border rounded-lg"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleFormChange}
                            placeholder="Email"
                            className="p-2 border rounded-lg"
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleFormChange}
                            placeholder="Password"
                            className="p-2 border rounded-lg"
                            required
                        />
                        <input
                            type="date"
                            name="tanggallahir"
                            value={formData.tanggallahir}
                            onChange={handleFormChange}
                            placeholder="Tanggal Lahir"
                            className="p-2 border rounded-lg"
                            required
                        />
                        <input
                            type="text"
                            name="nohp"
                            value={formData.nohp}
                            onChange={handleFormChange}
                            placeholder="Nomor HP"
                            className="p-2 border rounded-lg"
                            required
                        />
                        <select 
                          name="idroleuser" 
                          value={formData.idroleuser} 
                          onChange={handleFormChange} 
                          className="p-2 border rounded-lg"
                          required
                        >
                            <option value="">Pilih Role</option>
                            {roles.map((role) => (
                                <option key={role.idrole} value={role.idrole}>
                                    {role.namarole}
                                </option>
                            ))}
                        </select>
                        <select 
                          name="idkantor" 
                          value={formData.idkantor} 
                          onChange={handleFormChange} 
                          className="p-2 border rounded-lg"
                          required
                        >
                            <option value="">Pilih Kantor</option>
                            {kantors.map((kantor) => (
                                <option key={kantor.idkantor} value={kantor.idkantor}>
                                    {kantor.namakantor}
                                </option>
                            ))}
                        </select>
                        <input
                            type="file"
                            name="fotoselfie"
                            onChange={handleFileChange}
                            className="p-2"
                        />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-md p-4">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500">No users found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Foto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">NIK</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No HP</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal Lahir</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Kantor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user.nik}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.fotoselfie && (
                        <img
                          src={user.fotoselfie}
                          alt="Foto Selfie"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nik}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nama}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nohp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(user.tanggallahir).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.roleUser?.namarole}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.kantor?.namakantor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleUpdate(user.nik)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Update"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(user.nik)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                    </td>
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