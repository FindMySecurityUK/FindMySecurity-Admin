'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';
import { Check, Edit2, Trash2, X, PlusCircle } from 'lucide-react';
import { uploadToS3 } from '../../../../../utils/uploadToS3';
import { API_URL } from '../../../../../utils/path';

interface Ad {
  id: number;
  adTitle: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  redirectUrl: string;
  startDate: string;
  endDate: string;
  active: boolean;
}


const AdsAdminPage: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [search, setSearch] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<Omit<Ad, 'id'>>({
    adTitle: '',
    mediaType: 'IMAGE',
    mediaUrl: '',
    redirectUrl: '',
    startDate: '',
    endDate: '',
    active: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.adTitle) newErrors.adTitle = 'Title is required';
    if (!formData.mediaUrl) newErrors.mediaUrl = 'Media URL is required';
    if (!formData.redirectUrl) newErrors.redirectUrl = 'Redirect URL is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    if (!formData.endDate) newErrors.endDate = 'End Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchAds = async () => {
    const response = await axios.get(`${API_URL}/admin/advertisements?page=${currentPage}&limit=10&search=${search}`);
    setAds(response.data.data);
    setTotalPages(response.data.pagination.totalPages);
  };

  useEffect(() => {
    fetchAds();
  }, [search, currentPage]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { fileUrl } = await uploadToS3({ file });
      setFormData({ ...formData, mediaUrl: fileUrl });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const toISOString = (datetime: string) => {
    return new Date(datetime).toISOString();
  };

const [errorMessage, setErrorMessage] = useState('');
const [successMessage, setSuccessMessage] = useState('');

const handleSave = async () => {
  setErrorMessage('');
  setSuccessMessage('');
  if (!validateForm()) return;

  const payload = {
    ...formData,
    startDate: toISOString(formData.startDate),
    endDate: toISOString(formData.endDate),
  };

  try {
    if (editingAd) {
      await axios.patch(`${API_URL}/admin/advertisements/${editingAd.id}`, payload);
      setSuccessMessage('Advertisement updated successfully.');
    } else {
      await axios.post(`${API_URL}/admin/advertisements`, payload);
      setSuccessMessage('Advertisement created successfully.');
    }
    setPopupOpen(false);
    setEditingAd(null);
    fetchAds();
  } catch (error: any) {
    setErrorMessage(error.response?.data?.message || 'Something went wrong.');
  }
};


  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    const { id, ...rest } = ad;
    setFormData({
      ...rest,
      startDate: new Date(rest.startDate).toISOString().slice(0, 16),
      endDate: new Date(rest.endDate).toISOString().slice(0, 16),
    });
    setPopupOpen(true);
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/admin/advertisements/${id}`);
    fetchAds();
  };

  const handleCreate = () => {
    setEditingAd(null);
    setFormData({
      adTitle: '',
      mediaType: 'IMAGE',
      mediaUrl: '',
      redirectUrl: '',
      startDate: '',
      endDate: '',
      active: false,
    });
    setErrors({});
    setPopupOpen(true);
  };

  return (
    <div className="p-4 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Advertisements</h1>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search ads..."
          value={search}
          onChange={(e) => {
            setCurrentPage(1);
            setSearch(e.target.value);
          }}
          className="border border-gray-600 bg-black text-white p-2 rounded w-full sm:w-1/2"
        />
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded shadow"
        >
          <PlusCircle size={18} /> Create Ad
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-700">
          <thead>
            <tr className="bg-gray-900">
              <th className="border px-4 py-2">Title</th>
              <th className="border px-4 py-2">Media</th>
              <th className="border px-4 py-2">Redirect</th>
              <th className="border px-4 py-2">Active</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="text-black">
                <td className="border px-4 py-2">{ad.adTitle}</td>
    <td className="border px-4 py-2">
                  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                    {ad.mediaType === 'IMAGE' ? (
                      <img src={ad.mediaUrl} alt="ad" className="w-full h-auto rounded" />
                    ) : (
                      <video src={ad.mediaUrl} controls className="w-full h-auto rounded" />
                    )}
                  </div>
                </td>
                <td className="border px-4 py-2">{ad.redirectUrl}</td>
                <td className="border px-4 py-2">
                  {ad.active ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <button onClick={() => handleEdit(ad)} className="text-blue-400">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="text-red-400">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {popupOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex items-center justify-center z-50">

          <div className="bg-white text-black mt-20 p-6 rounded shadow-lg w-full h-auto scroll-auto max-w-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
            </h2>
                {errorMessage && (
                  <div className="text-red-600 text-sm mt-2">{errorMessage}</div>
                )}
                {successMessage && (
                  <div className="text-green-600 text-sm mt-2">{successMessage}</div>
                )}

            <label className="block mb-1 font-semibold">Ad Title</label>
            <input
              type="text"
              name="adTitle"
              value={formData.adTitle}
              onChange={handleInputChange}
              className="w-full border p-2 rounded mb-3"
            />

            <label className="block mb-1 font-semibold">Media Type</label>
            <select
              name="mediaType"
              value={formData.mediaType}
              onChange={handleInputChange}
              className="w-full border p-2 rounded mb-3"
            >
              <option value="IMAGE">IMAGE</option>
              <option value="VIDEO">VIDEO</option>
            </select>

            <label className="block mb-1 font-semibold">Upload Media</label>
            <input
              type="file"
              accept={formData.mediaType === 'IMAGE' ? 'image/*' : 'video/*'}
              onChange={handleFileUpload}
              className="w-full border p-2 rounded mb-3"
            />

            <label className="block mb-1 font-semibold">Redirect URL</label>
            <input
              type="text"
              name="redirectUrl"
              value={formData.redirectUrl}
              onChange={handleInputChange}
              className="w-full border p-2 rounded mb-3"
            />

            <label className="block mb-1 font-semibold">Start Date</label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full border p-2 rounded mb-3"
            />

            <label className="block mb-1 font-semibold">End Date</label>
            <input
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full border p-2 rounded mb-3"
            />

            <label className="inline-flex items-center mb-4">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
              />
              <span className="ml-2">Active</span>
            </label>

            <div className="flex justify-end gap-4">
              <button onClick={() => setPopupOpen(false)} className="px-4 py-2 bg-gray-300 rounded">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsAdminPage;