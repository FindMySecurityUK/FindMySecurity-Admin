'use client';

import { useEffect, useState, useRef } from 'react';
import { API_URL } from '../../../../../utils/path';

export interface ReportUserResponse {
  data: Report[];
  meta: Meta;
}

export interface Report {
  id: number;
  reporterId: number;
  reportedId: number;
  details: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  reporter: User;
  reported: User;
}

export interface User {
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
  validated: boolean;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) throw new Error("No token found in localStorage");

        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (searchTerm.trim().length > 0) {
          params.append('search', searchTerm.trim());
        }

        const res = await fetch(`${API_URL}/user-reports?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch user reports');

        const data: ReportUserResponse = await res.json();
        setReports(data.data);
        setTotalPages(data.meta.totalPages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [page, limit, searchTerm]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      setSearchTerm(val);
    }, 500);
  }

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Reports</h1>

      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search by reporter name or email..."
          onChange={handleSearchChange}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Search reports"
        />
      </div>

      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left py-2 px-3 uppercase font-semibold">Report ID</th>
              <th className="text-left py-2 px-3 uppercase font-semibold">Reporter</th>
              <th className="text-left py-2 px-3 uppercase font-semibold">Reporter Email</th>
              <th className="text-left py-2 px-3 uppercase font-semibold">Reported User</th>
              <th className="text-left py-2 px-3 uppercase font-semibold">Reported Email</th>
              <th className="text-left py-2 px-3 uppercase font-semibold">Reason</th>
              <th className="text-left py-2 px-3 uppercase font-semibold">Details</th>
              <th className="text-left py-2 px-3 uppercase font-semibold">Created At</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-red-600 font-semibold">Error: {error}</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500 font-medium">No reports found.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="border-b hover:bg-gray-100 transition-colors">
                  <td className="py-2 px-3 whitespace-nowrap">{report.id}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{report.reporter.firstName} {report.reporter.lastName}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{report.reporter.email}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{report.reported.firstName} {report.reported.lastName}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{report.reported.email}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{report.reason}</td>
                  <td className="py-2 px-3 whitespace-nowrap max-w-[250px] truncate" title={report.details}>{report.details}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{new Date(report.createdAt).toLocaleDateString()}</td>
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
          >
            First
          </button>

          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            className={`px-2 py-1 rounded border ${
              page === 1 || loading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
            }`}
          >
            Prev
          </button>

          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              disabled={page === pageNum || loading}
              className={`px-2 py-1 rounded border ${
                page === pageNum
                  ? 'bg-indigo-600 text-white border-indigo-600 cursor-default'
                  : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || loading}
            className={`px-2 py-1 rounded border ${
              page === totalPages || loading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
            }`}
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
          >
            Last
          </button>
        </nav>
      )}
    </div>
  );
}
