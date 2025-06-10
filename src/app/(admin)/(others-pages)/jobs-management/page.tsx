'use client';

import { useEffect, useState, useRef } from 'react';

import axios from 'axios';
import JobApplicantAdsPage from './createJobPopup';
import { API_URL } from '../../../../../utils/path';
const initialForm = {
  jobTitle: '',
  jobType: '',
  industryCategory: '',
  region: '',
  postcode: '',
  salaryRate: '',
  salaryType: '',
  jobDescription: '',
  requiredExperience: '',
  requiredLicences: '',
  shiftAndHours: '',
  startDate: '',
  deadline: '',
  link:'',
};
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  screenName: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  postcode: string | null;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  validated: boolean;
}

interface Job {
  id: number;
  userId: number;
  jobTitle: string;
  jobType: string;
  link:string;
  industryCategory: string;
  region: string;
  postcode: string;
  salaryRate: string;
  salaryType: string;
  jobDescription: string;
  requiredExperience: string;
  requiredLicences: string;
  shiftAndHours: string;
  startDate: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  securityCompanyId: number | null;
  user: User;
}

interface meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface JobsApiResponse {
  data: Job[];
  meta: meta;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<NodeJS.Timeout | null>(null);
    const [form, setForm] = useState(initialForm);

  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    setLoading(true);
    setError(null);
    setSuccess(null);
  
    try {
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) throw new Error("No token found in localStorage");
  
      const payload = {
        userId: 1,
        ...form,
        salaryRate: parseFloat(form.salaryRate),
      };
  
      if (editingJobId) {
        // Update existing job
        await axios.patch(
          `${API_URL}/admin/jobs/${editingJobId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add token to Authorization header
            },
          }
        );
        setSuccess('Job updated successfully!');
        setEditingJobId(null); // reset editing state after update
      } else {
        // Create new job
        await axios.post(
          `${API_URL}/admin/jobs`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add token to Authorization header
            },
          }
        );
        setSuccess('Job created successfully!');
      }
  
      setForm(initialForm);
      setShowForm(false);
    } catch (error: unknown) {
      setError(editingJobId ? 'Failed to update job. Please try again.' : 'Failed to create job. Please try again.');
      console.log(error);
    } finally {
      fetchJobs(page, limit, searchTerm); // Refresh job list after create/update
      setLoading(false);
    }
  };

   async function fetchJobs(page: number, limit: number, searchTerm: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) throw new Error("No token found in localStorage");
      const url = `${API_URL}/admin/jobs?${params.toString()}`;
      const res = await fetch(url,
       { headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      }
      );

      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data: JobsApiResponse = await res.json();

      setJobs(data?.data);
      setTotalPages(data?.meta?.totalPages||1);
    } catch (err: unknown) {
      setError( "Unknown error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // useEffect calls the above function
  useEffect(() => {
    fetchJobs(page, limit, searchTerm);
  }, [page, limit, searchTerm]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      setSearchTerm(val);
    }, 500);
  }
const handleDelete = async (jobId: number) => {
  if (!window.confirm('Are you sure you want to delete this job?')) return;
  try {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) throw new Error("No token found in localStorage");
    setLoading(true);
    const res = await fetch(`${API_URL}/admin/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
       
      },
    });
    if (!res.ok) throw new Error('Failed to delete job');
    // Refresh jobs list after delete
    fetchJobs(page, limit, searchTerm);  // assuming you have a function to reload job list
  } catch (err: unknown) {
    setError( 'Failed to delete job');
    console.error(err); 
  } finally {
    setLoading(false);
  }
};

  function getPageNumbers() {
    const pages = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    if (page <= 3) {
      endPage = Math.min(5, totalPages);
    } else if (page > totalPages - 3) {
      startPage = Math.max(1, totalPages - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  return (
    <div className="container overflow-hidden px-4 py-8 max-w-full md:max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Jobs List</h1>

      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search by job title, user name or email..."
          onChange={handleSearchChange}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Search jobs"
        />
      </div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Jobs</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2  bg-gray-800 text-white rounded hover:bg-blue-900"
        >
          Create Job
        </button>
      </div>
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-[1000px] bg-white text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Job Title</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Job Type</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Industry</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Region</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Salary Rate</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Start Date</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Deadline</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">User Name</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Email</th>
                  <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Tools</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-6">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-red-600 font-semibold">
                  Error: {error}
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-500 font-medium">
                  No jobs found.
                </td>
              </tr>
            ) : (
           jobs.map(job => (
  <tr key={job.id} className="border-b hover:bg-gray-100 transition-colors">
    <td className="py-2 px-3 whitespace-nowrap">{job.jobTitle}</td>
    <td className="py-2 px-3 whitespace-nowrap">{job.jobType}</td>
    <td className="py-2 px-3 whitespace-nowrap">{job.industryCategory}</td>
    <td className="py-2 px-3 whitespace-nowrap">{job.region}</td>
    <td className="py-2 px-3 whitespace-nowrap">{job.salaryRate} / {job.salaryType}</td>
    <td className="py-2 px-3 whitespace-nowrap">{new Date(job.startDate).toLocaleDateString()}</td>
    <td className="py-2 px-3 whitespace-nowrap">{new Date(job.deadline).toLocaleDateString()}</td>
    <td className="py-2 px-3 whitespace-nowrap">{job.user.firstName} {job.user.lastName}</td>
    <td className="py-2 px-3 whitespace-nowrap">{job.user.email}</td>
    <td className="py-2 px-3 whitespace-nowrap space-x-2">
      <button
        onClick={() => {
          setEditingJobId(job.id);
          setForm({
            jobTitle: job.jobTitle,
            jobType: job.jobType,
            industryCategory: job.industryCategory,
            region: job.region,
            postcode: job.postcode || '',
            salaryRate: job.salaryRate,
            salaryType: job.salaryType,
            startDate: job.startDate.split('T')[0], // format date for input[type=date]
            deadline: job.deadline.split('T')[0],
            jobDescription: job.jobDescription || '',
            requiredExperience: job.requiredExperience || '',
            requiredLicences: job.requiredLicences || '',
            shiftAndHours: job.shiftAndHours || '',
            link: job.link || '', // Assuming you have a link field
            // Add any other fields you have in form
          });
          setShowForm(true);
          setError(null);
          setSuccess(null);
        }}
        className="px-2 py-1 text-sm bg-yellow-400 text-white rounded hover:bg-yellow-500"
      >
        Edit
      </button>
      <button
        onClick={() => handleDelete(job.id)}
        className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
      >
        Delete
      </button>
    </td>
  </tr>
))

            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center space-x-2 mt-6" aria-label="Pagination">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            className={`px-2 py-1 rounded border ${
              page === 1 || loading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
            }`}
            aria-label="First page"
          >
            First
          </button>

          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            className={`px-2 py-1 rounded border ${
              page === 1 || loading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
            }`}
            aria-label="Previous page"
          >
            Prev
          </button>

          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              disabled={page === pageNum || loading}
              className={`px-2 py-1 rounded border ${
                page === pageNum
                  ? 'bg-indigo-600 text-white border-indigo-600 cursor-default'
                  : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
              }`}
              aria-current={page === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || loading}
            className={`px-2 py-1 rounded border ${
              page === totalPages || loading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
            }`}
            aria-label="Next page"
          >
            Next
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || loading}
            className={`px-2 py-1 rounded border ${
              page === totalPages || loading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
            }`}
            aria-label="Last page"
          >
            Last
          </button>
        </nav>
      )}
    {showForm && (
  <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm">
      <div className="animate-fade-in-up bg-white p-6 rounded-lg w-full max-w-lg shadow-xl relative overflow-y-auto max-h-[80vh]">
      <button
        onClick={() => {
          setShowForm(false);
          setError(null);
          setSuccess(null);
        }}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        aria-label="Close form"
      >
        ✕
      </button>

      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create New Job</h2>

      {error && <div className="text-red-700 bg-red-100 p-3 rounded mb-3">{error}</div>}
      {success && <div className="text-green-700 bg-green-100 p-3 rounded mb-3">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(form).map(([key, value]) => (
          <div key={key}>
            <label className="block font-medium mb-1 capitalize text-sm text-gray-700">{key}</label>
            {['jobDescription', 'requiredExperience', 'requiredLicences', 'shiftAndHours'].includes(key) ? (
              <textarea
                name={key}
                value={value}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            ) : key === 'startDate' || key === 'deadline' ? (
              <input
                type="date"
                name={key}
                value={value}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : key === 'salaryRate' ? (
              <input
                type="number"
                name={key}
                value={value}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="text"
                name={key}
                value={value}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
       <button
  type="submit"
  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
  disabled={loading}
>
  {loading ? (editingJobId ? 'Updating...' : 'Creating...') : (editingJobId ? 'Update Job' : 'Create Job')}
</button>
        </div>
      </form>
    </div>
  </div>
)}

 {/* <JobApplicantAdsPage/>*/}
    </div>
  );
}
