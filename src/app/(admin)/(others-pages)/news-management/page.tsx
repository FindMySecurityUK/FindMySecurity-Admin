'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';
import { Check, Edit2, Trash2, X, PlusCircle } from 'lucide-react';
import { API_URL } from '../../../../../utils/path';

interface NewsVideo {
  id: number;
  videoTitle: string;
  youtubeUrl: string;
  active: boolean;
}

type FormDataType = {
  videoTitle: string;
  youtubeUrl: string;
  active: boolean;
};

const NewsAdminPage: React.FC = () => {
  const [videos, setVideos] = useState<NewsVideo[]>([]);
  const [search, setSearch] = useState<string>('');
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [editingVideo, setEditingVideo] = useState<NewsVideo | null>(null);
  const [formData, setFormData] = useState<FormDataType>({
    videoTitle: '',
    youtubeUrl: '',
    active: false,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.videoTitle) newErrors.videoTitle = 'Title is required';
    if (!formData.youtubeUrl) newErrors.youtubeUrl = 'YouTube URL is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/admin/news-videos?page=${currentPage}&limit=10&search=${search}`
      );
      setVideos(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching videos', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [search, currentPage]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!validateForm()) return;

    try {
      if (editingVideo) {
        await axios.patch(`${API_URL}/admin/news-videos/${editingVideo.id}`, formData);
        setSuccessMessage('News video updated successfully.');
      } else {
        await axios.post(`${API_URL}/admin/news-videos`, formData);
        setSuccessMessage('News video created successfully.');
      }
      setPopupOpen(false);
      setEditingVideo(null);
      fetchVideos();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleEdit = (video: NewsVideo) => {
    setEditingVideo(video);
    const { id, ...rest } = video;
    setFormData(rest);
    setPopupOpen(true);
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/admin/news-videos/${id}`);
    fetchVideos();
  };

  const handleCreate = () => {
    setEditingVideo(null);
    setFormData({
      videoTitle: '',
      youtubeUrl: '',
      active: false,
    });
    setErrors({});
    setPopupOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-4 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">News and Insights List</h1>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search videos..."
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
          <PlusCircle size={18} /> Create News
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-700">
          <thead>
            <tr className="bg-gray-900">
              <th className="border px-4 py-2">Title</th>
              <th className="border px-4 py-2">YouTube Preview</th>
              <th className="border px-4 py-2">Active</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="text-black">
                <td className="border px-4 py-2">{video.videoTitle}</td>
                <td className="border px-4 py-2">
                  <iframe
                    src={video.youtubeUrl}
                    title={video.videoTitle}
                    className="w-full max-w-xs h-48 rounded"
                    allowFullScreen
                  ></iframe>
                </td>
                <td className="border px-4 py-2">
                  {video.active ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <button onClick={() => handleEdit(video)} className="text-blue-400">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(video.id)} className="text-red-400">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {popupOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow-lg w-full max-w-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingVideo ? 'Edit News Video' : 'Create News Video'}
            </h2>

            {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
            {successMessage && <p className="text-green-600 text-sm mb-2">{successMessage}</p>}

            <div className="mb-3">
              <input
                type="text"
                name="videoTitle"
                placeholder="Video Title"
                value={formData.videoTitle}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
              {errors.videoTitle && <p className="text-red-500 text-sm mt-1">{errors.videoTitle}</p>}
            </div>

            <div className="mb-3">
              <input
                type="text"
                name="youtubeUrl"
                placeholder="YouTube Embed URL (https://www.youtube.com/embed/xyz123)"
                value={formData.youtubeUrl}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
              {errors.youtubeUrl && <p className="text-red-500 text-sm mt-1">{errors.youtubeUrl}</p>}
            </div>

            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                />
                <span className="ml-2">Active</span>
              </label>
            </div>

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

export default NewsAdminPage;
