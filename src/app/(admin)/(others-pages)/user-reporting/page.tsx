"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  AlertTriangle,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { API_URL } from "../../../../../utils/path";
import toast, { Toaster } from "react-hot-toast";

// Interfaces for report data
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  screenName: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  address: string | null;
  postcode: string | null;
  roleId: number;
  validated: boolean;
}

interface Report {
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

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse {
  data: Report[];
  meta: Meta;
}

const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Meta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportIdToDelete, setReportIdToDelete] = useState<number | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) throw new Error("No token found in localStorage");

        const queryParams = new URLSearchParams();
        queryParams.append("page", currentPage.toString());
        queryParams.append("limit", "10");
        if (search) queryParams.append("search", search);

        const url = `${API_URL}/user-reports?${queryParams.toString()}`;
        console.log("Fetching reports from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data: ApiResponse = await response.json();
        console.log("API Response:", data);
        setReports(Array.isArray(data.data) ? data.data : []);
        setPagination(data.meta || null);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching reports:", error);
        setError(
          error instanceof Error ? error.message : "An unexpected error occurred"
        );
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    return () => abortController.abort();
  }, [currentPage, search]);

  const handleViewReport = async (reportId: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) throw new Error("No token found in localStorage");

      const response = await fetch(`${API_URL}/user-reports/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data: Report = await response.json();
      setSelectedReport(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching report:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch report"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch report",
        {
          duration: 3000,
          position: "top-right",
          className: "bg-red-500 text-white text-sm rounded-lg shadow-md",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleDeleteReport = (reportId: number) => {
    setReportIdToDelete(reportId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reportIdToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) throw new Error("No token found in localStorage");

      const response = await fetch(
        `${API_URL}/user-reports/${reportIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      setReports(reports.filter((report) => report.id !== reportIdToDelete));
      toast.success("Report deleted successfully", {
        duration: 3000,
        position: "top-right",
        className: "bg-green-500 text-white text-sm rounded-lg shadow-md",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete report";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 3000,
        position: "top-right",
        className: "bg-red-500 text-white text-sm rounded-lg shadow-md",
      });
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setReportIdToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setReportIdToDelete(null);
  };

  const getFullName = (user: User) => `${user.firstName} ${user.lastName}`;

  return (
    <div className="min-h-screen p-2 md:p-4 lg:p-6 xl:p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6 max-w-xs xs:max-w-sm sm:max-w-md mx-auto relative">
          <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by Reporter, Reported User, or Reason..."
            className="w-full py-2 sm:py-3 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Header */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 sm:gap-3">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-600 dark:text-red-300" />
          Report Management
        </h1>

        {/* Error Message */}
        {error && (
          <p className="text-center text-red-500 dark:text-red-400 mb-3 sm:mb-4 text-xs sm:text-sm">
            {error}
          </p>
        )}

        {/* Report Table or Card Layout */}
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
            Loading...
          </p>
        ) : !reports || reports.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12 text-sm sm:text-base">
            No reports found.
          </p>
        ) : (
          <>
            {/* Table for medium screens and up */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reported User
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {report.id}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {getFullName(report.reporter)}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {getFullName(report.reported)}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {report.reason}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {new Date(report.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                        <button
                          onClick={() => handleViewReport(report.id)}
                          className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            View Report
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Delete Report
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simplified table for small screens (sm to md) */}
            <div className="hidden sm:block md:hidden overflow-x-auto">
              <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {report.id}
                      </td>
                      <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
                        {getFullName(report.reporter)}
                      </td>
                      <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
                        {report.reason}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 flex gap-2">
                        <button
                          onClick={() => handleViewReport(report.id)}
                          className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            View Report
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Delete Report
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card layout for extra small screens (below sm) */}
            <div className="block sm:hidden space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-3"
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2 font-semibold text-sm">
                      Report ID: {report.id}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        Reporter:{" "}
                      </span>
                      {getFullName(report.reporter)}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        Reported User:{" "}
                      </span>
                      {getFullName(report.reported)}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        Reason:{" "}
                      </span>
                      {report.reason}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        Created:{" "}
                      </span>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={() => handleViewReport(report.id)}
                        className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">View</span>
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          View Report
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs">Delete</span>
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          Delete Report
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 md:mt-8 flex-wrap">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="First page"
            >
              <ChevronsLeft size={16} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let page;
              if (pagination.totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                page = pagination.totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-blue-500 dark:bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                  }`}
                  aria-label={`Page ${page}`}
                  disabled={loading}
                >
                  {page}
                </button>
              );
            })}
            {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
              <span className="px-1 text-gray-500">...</span>
            )}
            {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700`}
                aria-label={`Page ${pagination.totalPages}`}
                disabled={loading}
              >
                {pagination.totalPages}
              </button>
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, pagination.totalPages)
                )
              }
              disabled={currentPage === pagination.totalPages || loading}
              className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={currentPage === pagination.totalPages || loading}
              className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Last page"
            >
              <ChevronsRight size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && reportIdToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Confirm Deletion
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete report ID {reportIdToDelete}?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Viewing Report Details */}
        {isModalOpen && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[70vh] overflow-y-auto p-6 relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                title="Close"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Report Details: ID {selectedReport.id}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Report ID
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.id}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reporter ID
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.reporterId}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reporter Name
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {getFullName(selectedReport.reporter)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reporter Email
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.reporter.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reported User ID
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.reportedId}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reported User Name
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {getFullName(selectedReport.reported)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reported User Email
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.reported.email || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reason
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.reason}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Details
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.details || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created At
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Updated At
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedReport.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagement;