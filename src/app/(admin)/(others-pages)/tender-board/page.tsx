'use client';

import { useEffect, useState, useRef } from 'react';

import axios from 'axios';
import { API_URL } from '../../../../../utils/path';


const initialForm = {
  title: '',
  summary: '',
  issuingAuthority: '',
  industryType: '',
  location: '',
  postCode: '',
  contractValue: '',
  procurementReference: '',
  publishedDate: '',
  contractStartDate: '',
  contractEndDate: '',
  approachToMarketDate: '',
  suitableForSMEs: false,
  suitableForVCSEs: false,
  issuerName: '',
  issuerAddress: '',
  issuerPhone: '',
  issuerEmail: '',
  issuerWebsite: '',
  howToApply: ''
};


// Interface for the "createdBy" user object
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  screenName: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  postcode: string;
  roleId: number;
  validated: boolean;
}


// Interface for metadata about pagination
export interface Tender {
  id: number;
  title: string;
  issuingAuthority: string;
  industryType: string;
  summary: string;
  location: string;
  postCode: string;
  contractValue: string;
  procurementReference: string;
  publishedDate: string;
  contractStartDate: string;
  contractEndDate: string;
  approachToMarketDate: string;
  suitableForSMEs: boolean;
  suitableForVCSEs: boolean;
  issuerName: string;
  issuerAddress: string;
  issuerPhone: string;
  issuerEmail: string;
  issuerWebsite: string;
  howToApply: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

// Interface for the entire response
export interface TenderApiResponse {
  data: Tender[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}



export default function JobsPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
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

  // Separate handler for checkbox fields
  const handleCheckboxChange = (e: { target: { name: string; value: boolean } }) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };


const formatToMidnightISO = (date: string | Date) => {
  if (!date) return "";
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

// Before sending form data

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();



  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
  const payload = {
  userId: 1,
  ...form,
  publishedDate: formatToMidnightISO(form.publishedDate),
  contractStartDate: formatToMidnightISO(form.contractStartDate),
  contractEndDate: formatToMidnightISO(form.contractEndDate),
  approachToMarketDate: formatToMidnightISO(form.approachToMarketDate),
};
const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    if (editingJobId) {
      // Update existing job
      await axios.patch(
        `${API_URL}/tender/${editingJobId}`,
        payload,
          {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
      );
      setSuccess('Course updated successfully!');
      setEditingJobId(null); // reset editing state after update
    } else {
      // Create new job
      await axios.post(
  `${API_URL}/tender`,
  payload,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setSuccess('Course created successfully!');
    }

    setForm(initialForm);
    setShowForm(false);
  }
  catch (error: unknown)  {
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
      params.append("pageSize", limit.toString());
      if (searchTerm.trim()) {
        params.append("industryType", searchTerm.trim());
      }
const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      const url = `${API_URL}/tender?${params.toString()}`;
      const res = await fetch(url, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
   
  },
 // Optional: only if cookies or CORS credentials are needed
});

      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data: TenderApiResponse= await res.json();

      setTenders(data?.data);
      setTotalPages(data?.totalPages||1);
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

  const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
  try {
    setLoading(true);
    const res = await fetch(`${API_URL}/tender/${jobId}`, {
      method: 'DELETE',
     
          headers: { Authorization: `Bearer ${token}` },
        
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Tenders List</h1>

      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search by Tender title, user name or email..."
          onChange={handleSearchChange}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Search Courses"
        />
      </div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Tenders</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2  bg-gray-800 text-white rounded hover:bg-blue-900"
        >
          Create Tender
        </button>
      </div>
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-[1000px] bg-white text-sm">
<thead className="bg-gray-800 text-white">
  <tr>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Title</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Industry</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Location</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Post Code</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Contract Value</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Start Date</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">End Date</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Issuer</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Email</th>
    <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Tools</th>
  </tr>
</thead>

        <tbody className="text-gray-700">
  {loading ? (
    <tr>
      <td colSpan={10} className="text-center py-6">Loading...</td>
    </tr>
  ) : error ? (
    <tr>
      <td colSpan={10} className="text-center py-6 text-red-600 font-semibold">
        Error: {error}
      </td>
    </tr>
  ) : tenders.length === 0 ? (
    <tr>
      <td colSpan={10} className="text-center py-6 text-gray-500 font-medium">
        No tenders found.
      </td>
    </tr>
  ) : (
    tenders.map(tender => (
      <tr key={tender.id} className="border-b hover:bg-gray-100 transition-colors">
        <td className="py-2 px-3 whitespace-nowrap">{tender.title}</td>
        <td className="py-2 px-3 whitespace-nowrap">{tender.industryType}</td>
        <td className="py-2 px-3 whitespace-nowrap">{tender.location}</td>
        <td className="py-2 px-3 whitespace-nowrap">{tender.postCode}</td>
        <td className="py-2 px-3 whitespace-nowrap">{tender.contractValue}</td>
        <td className="py-2 px-3 whitespace-nowrap">
          {new Date(tender.contractStartDate).toLocaleDateString()}
        </td>
        <td className="py-2 px-3 whitespace-nowrap">
          {new Date(tender.contractEndDate).toLocaleDateString()}
        </td>
        <td className="py-2 px-3 whitespace-nowrap">
          {tender.user.firstName} {tender.user.lastName}
        </td>
        <td className="py-2 px-3 whitespace-nowrap">{tender.user.email}</td>
        <td className="py-2 px-3 whitespace-nowrap space-x-2">
          <button
            onClick={() => {
              setEditingJobId(tender.id);
              setForm({
                title: tender.title,
                industryType: tender.industryType,
                issuingAuthority: tender.issuingAuthority,
                summary: tender.summary,
                location: tender.location,
                postCode: tender.postCode,
                contractValue: tender.contractValue,
                procurementReference: tender.procurementReference,
                publishedDate: tender.publishedDate.split('T')[0],
                contractStartDate: tender.contractStartDate.split('T')[0],
                contractEndDate: tender.contractEndDate.split('T')[0],
                approachToMarketDate: tender.approachToMarketDate.split('T')[0],
                suitableForSMEs: tender.suitableForSMEs,
                suitableForVCSEs: tender.suitableForVCSEs,
                issuerName: tender.issuerName,
                issuerAddress: tender.issuerAddress,
                issuerPhone: tender.issuerPhone,
                issuerEmail: tender.issuerEmail,
                issuerWebsite: tender.issuerWebsite,
                howToApply: tender.howToApply,
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
            onClick={() => handleDelete(tender.id)}
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

    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
      {editingJobId ? 'Edit Tender' : 'Create New Tender'}
    </h2>

    {error && <div className="text-red-700 bg-red-100 p-3 rounded mb-3">{error}</div>}
    {success && <div className="text-green-700 bg-green-100 p-3 rounded mb-3">{success}</div>}

    <form onSubmit={handleSubmit} className="space-y-4">

      <Input label="Tender Title" name="title" value={form.title} onChange={handleChange} placeholder="Enter tender title" />
       <Input label="Issuing Authority" name="issuingAuthority" value={form.issuingAuthority} onChange={handleChange} placeholder="Enter tender issueing authority" />
      <TextArea label="Summary" name="summary" value={form.summary} onChange={handleChange} placeholder="Brief summary of tender..." />
      <Input label="Industry Type" name="industryType" value={form.industryType} onChange={handleChange} placeholder="e.g., Security, IT" />
      <Input label="Location" name="location" value={form.location} onChange={handleChange} placeholder="e.g., London" />
      <Input label="Post Code" name="postCode" value={form.postCode} onChange={handleChange} placeholder="SW1A 1AA" />
      <Input label="Contract Value" name="contractValue" value={form.contractValue} onChange={handleChange} placeholder="£75,000" />
      <Input label="Procurement Reference" name="procurementReference" value={form.procurementReference} onChange={handleChange} placeholder="e.g., SEC-2025-045" />
      <Checkbox label="Suitable for SMEs" name="suitableForSMEs" checked={form.suitableForSMEs} onChange={handleCheckboxChange} />
      <Checkbox label="Suitable for VCSEs" name="suitableForVCSEs" checked={form.suitableForVCSEs} onChange={handleCheckboxChange} />
      <Input type="datetime-local" label="Contract Start Date" name="contractStartDate" value={form.contractStartDate} onChange={handleChange} />
      <Input type="datetime-local" label="Contract End Date" name="contractEndDate" value={form.contractEndDate} onChange={handleChange} />
      <Input type="datetime-local" label="Approach to Market Date" name="approachToMarketDate" value={form.approachToMarketDate} onChange={handleChange} />
      <Input type="datetime-local" label="Publish Date" name="publishedDate" value={form.publishedDate} onChange={handleChange} />
      <Input label="Issuer Name" name="issuerName" value={form.issuerName} onChange={handleChange} />
      <Input label="Issuer Address" name="issuerAddress" value={form.issuerAddress} onChange={handleChange} />
      <Input label="Issuer Phone" name="issuerPhone" value={form.issuerPhone} onChange={handleChange} />
      <Input label="Issuer Email" name="issuerEmail" value={form.issuerEmail} onChange={handleChange} />
      <Input label="Issuer Website" name="issuerWebsite" value={form.issuerWebsite} onChange={handleChange} />
      <TextArea label="How to Apply" name="howToApply" value={form.howToApply} onChange={handleChange} placeholder="Instructions to apply..." />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
      >
        {editingJobId ? 'Update Tender' : 'Create Tender'}
      </button>
    </form>
  </div>
</div>


)}


    </div>
  );
}
type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
};

const Input = ({ label, name, value, onChange, type = "text", placeholder = "" }: InputProps) => (
  <div>
    <label className="block font-medium mb-1 text-sm text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

type TextAreaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
};

const TextArea = ({ label, name, value, onChange, placeholder }: TextAreaProps) => (
  <div>
    <label className="block font-medium mb-1 text-sm text-gray-700">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

type CheckboxProps = {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: { target: { name: string; value: boolean } }) => void;
};

const Checkbox = ({ label, name, checked, onChange }: CheckboxProps) => (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={e => onChange({ target: { name, value: e.target.checked } })}
      className="form-checkbox"
    />
    <label className="text-sm text-gray-700">{label}</label>
  </div>
);
