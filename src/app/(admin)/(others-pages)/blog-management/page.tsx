'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';
import { Check, Edit2, Trash2, X, PlusCircle } from 'lucide-react';
import { API_URL } from '../../../../../utils/path';
import { uploadToS3 } from '../../../../../utils/uploadToS3';

interface Blog {
  id: number;
  title: string;
  image: string;
  textSummary: string;
  redirectLink: string;
  active: boolean;
}

const BlogAdminPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState<Omit<Blog, 'id'>>({
    title: '',
    image: '',
    textSummary: '',
    redirectLink: '',
    active: false,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.image) newErrors.image = 'Image URL is required';
    if (!formData.textSummary) newErrors.textSummary = 'Summary is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchBlogs = async () => {
    const response = await axios.get(`${API_URL}/admin/blogs?page=${currentPage}&limit=10&search=${search}`);
    setBlogs(response.data.data);
    setTotalPages(response.data.pagination.totalPages);
  };

  useEffect(() => {
    fetchBlogs();
  }, [search, currentPage]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please upload a valid image file.' }));
      return;
    }

    try {
      const { fileUrl } = await uploadToS3({ file });
      setFormData((prev) => ({
        ...prev,
        image: fileUrl,
      }));
      setErrors((prev) => ({ ...prev, image: '' }));
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrors((prev) => ({ ...prev, image: 'Image upload failed. Try again.' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (editingBlog) {
      await axios.patch(`${API_URL}/admin/blogs/${editingBlog.id}`, formData);
    } else {
      await axios.post(`${API_URL}/admin/blogs`, formData);
    }
    setPopupOpen(false);
    setEditingBlog(null);
    fetchBlogs();
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    const { id, ...rest } = blog;
    setFormData(rest);
    setPopupOpen(true);
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/admin/blogs/${id}`);
    fetchBlogs();
  };

  const handleCreate = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      image: '',
      textSummary: '',
      redirectLink: '',
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Blogs List</h1>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search blogs..."
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
          <PlusCircle size={18} /> Create Entry
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-700">
          <thead>
            <tr className="bg-gray-900">
              <th className="border border-gray-700 px-4 py-2">Title</th>
              <th className="border border-gray-700 px-4 py-2">Image</th>
              <th className="border border-gray-700 px-4 py-2">Summary</th>
              <th className="border border-gray-700 px-4 py-2">Active</th>
              <th className="border border-gray-700 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id} className="text-black">
                <td className="border border-gray-700 px-4 py-2">{blog.title}</td>
                <td className="border border-gray-700 px-4 py-2">
                  <img src={blog.image} alt={blog.title} className="h-12 w-auto rounded" />
                </td>
                <td className="border border-gray-700 px-4 py-2">{blog.textSummary}</td>
                <td className="border border-gray-700 px-4 py-2">
                  {blog.active ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                </td>
                <td className="border border-black px-4 py-2 space-x-2">
                  <button onClick={() => handleEdit(blog)} className="text-blue-400">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(blog.id)} className="text-red-400">
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
            <h2 className="text-lg font-semibold mb-4">{editingBlog ? 'Edit Blog' : 'Create Blog'}</h2>
            <div className="mb-3">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="mb-3">
              <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full border p-2 rounded" />
              {formData.image && <img src={formData.image} alt="preview" className="h-20 mt-2 rounded" />}
              {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
            </div>

            <div className="mb-3">
              <textarea
                name="textSummary"
                placeholder="Summary"
                value={formData.textSummary}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
              {errors.textSummary && <p className="text-red-500 text-sm mt-1">{errors.textSummary}</p>}
            </div>

            <div className="mb-3">
              <input
                type="text"
                name="redirectLink"
                placeholder="Redirect Link"
                value={formData.redirectLink}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
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

export default BlogAdminPage;
