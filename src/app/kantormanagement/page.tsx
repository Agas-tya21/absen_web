"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Kantor {
  idkantor: string;
  namakantor: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function KantorManagement() {
  const [kantors, setKantors] = useState<Kantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ idkantor: '', namakantor: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchKantors();
  }, []);
  
  const fetchKantors = async () => {
    try {
        const response = await fetch(`${API_URL}/api/kantors`);
        if (!response.ok) {
          if (response.status === 204) {
            setKantors([]);
            return;
          }
          throw new Error(`Error: ${response.statusText}`);
        }
        const data: Kantor[] = await response.json();
        setKantors(data);
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: value
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setNotification(null);

      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `${API_URL}/api/kantors/${formData.idkantor}` : `${API_URL}/api/kantors`;
      
      const body = isEditMode ? formData : { namakantor: formData.namakantor };

      try {
          const response = await fetch(url, {
              method: method,
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
          });

          if (response.ok) {
              setNotification({ message: `Kantor berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`, type: 'success' });
              setFormData({ idkantor: '', namakantor: '' });
              setIsEditMode(false);
              fetchKantors();
          } else {
              setNotification({ message: `Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kantor.`, type: 'error' });
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
  
  const handleEdit = (kantor: Kantor) => {
      setFormData({ idkantor: kantor.idkantor, namakantor: kantor.namakantor });
      setIsEditMode(true);
  };

  const handleDelete = async (idkantor: string) => {
      if (window.confirm(`Are you sure you want to delete kantor with ID: ${idkantor}?`)) {
          setNotification(null);
          try {
              const response = await fetch(`${API_URL}/api/kantors/${idkantor}`, {
                  method: 'DELETE',
              });
              if (response.ok) {
                  setNotification({ message: 'Kantor berhasil dihapus!', type: 'success' });
                  fetchKantors();
              } else {
                  setNotification({ message: 'Gagal menghapus kantor.', type: 'error' });
              }
          } catch (e: unknown) {
              if (e instanceof Error) {
                  setNotification({ message: e.message, type: 'error' });
              } else {
                  setNotification({ message: 'Terjadi kesalahan tidak terduga.', type: 'error' });
              }
          }
          setTimeout(() => setNotification(null), 3000);
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Kantor Management</h1>
        
        {notification && (
            <div className={`p-4 mb-4 rounded-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {notification.message}
            </div>
        )}

        {/* Form Tambah/Update Data */}
        <div className="mb-6 bg-gray-100 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Update Kantor' : 'Tambah Kantor Baru'}</h2>
            <form onSubmit={handleSubmit} className="flex space-x-4">
                {isEditMode && (
                    <input
                        type="text"
                        name="idkantor"
                        value={formData.idkantor}
                        onChange={handleFormChange}
                        placeholder="ID Kantor"
                        className="p-2 border rounded-lg"
                        required
                        readOnly={isEditMode}
                        disabled={isEditMode}
                    />
                )}
                <input
                    type="text"
                    name="namakantor"
                    value={formData.namakantor}
                    onChange={handleFormChange}
                    placeholder="Nama Kantor"
                    className="p-2 border rounded-lg flex-1"
                    required
                />
                <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                    {isEditMode ? 'Update' : 'Tambah'}
                </button>
                {isEditMode && (
                    <button type="button" onClick={() => { setIsEditMode(false); setFormData({ idkantor: '', namakantor: '' }); }} className="bg-gray-400 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500">
                        Batal
                    </button>
                )}
            </form>
        </div>

        <div className="overflow-x-auto bg-gray-100 rounded-lg shadow-md p-4">
          {kantors.length === 0 ? (
            <p className="text-center text-gray-500">No offices found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID Kantor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Kantor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kantors.map((kantor, index) => (
                  <tr key={kantor.idkantor}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kantor.idkantor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kantor.namakantor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(kantor)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Update"
                        >
                            <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(kantor.idkantor)}
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