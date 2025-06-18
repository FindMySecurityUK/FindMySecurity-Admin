"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Trash2,
  X,
} from "lucide-react";
import { API_URL } from "../../../../../utils/path";
import toast, { Toaster } from "react-hot-toast";

// Define nested interfaces for role-specific data
interface Role {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Permissions {
  acceptTerms: boolean;
  acceptEmails: boolean;
  premiumServiceNeed?: boolean;
}

interface Client {
  id: number;
  userId: number;
  permissions: Permissions;
  createdAt: string;
  updatedAt: string;
}

interface IndividualProfessional {
  id: number;
  userId: number;
  permissions: Permissions;
  createdAt: string;
  updatedAt: string;
  profile: string | null;
  documents: string[];
}

interface SecurityCompany {
  id: number;
  userId: number;
  companyName: string;
  registrationNumber: string;
  address: string;
  postCode: string;
  contactPerson: string;
  jobTitle: string;
  phoneNumber: string;
  website: string;
  servicesRequirements: string[];
  securityServicesOfferings: string[];
  permissions: Permissions;
  createdAt: string;
  updatedAt: string;
}

interface CourseProvider {
  id: number;
  userId: number;
  companyName: string;
  registrationNumber: string;
  address: string;
  postCode: string;
  contactPerson: string;
  jobTitle: string;
  phoneNumber: string;
  website: string;
  servicesRequirements: string[];
  securityServicesOfferings: string[];
  permissions: Permissions;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  email?: string;
  firstName: string;
  lastName: string;
  profile?: string | null;
  screenName?: string | null;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  address?: string;
  postcode?: string | null;
  roleId: number;
  isSubscriber?: boolean;
  subscriptionTier?: string | null;
  createdAt: string;
  updatedAt: string;
  validated?: boolean;
  role: Role;
  client?: Client;
  individualProfessional?: IndividualProfessional;
  securityCompany?: SecurityCompany;
  courseProvider?: CourseProvider;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse {
  users: User[];
  pagination: Pagination;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Clients");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);

  const tabs = useMemo(
    () => [
      { name: "Clients", roleId: 4 },
      { name: "Professionals", roleId: 3 },
      { name: "Companies", roleId: 5 },
      { name: "Trainers", roleId: 6 },
      { name: "Businesses", roleId: 7 },
    ],
    []
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const tab = tabs.find((t) => t.name === activeTab);
        const roleId = tab?.roleId;

        if (!roleId) return;

        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) throw new Error("No token found in localStorage");
        const queryParams = new URLSearchParams();
        queryParams.append("roleId", roleId.toString());
        queryParams.append("page", currentPage.toString());
        queryParams.append("search", search.toString());
        queryParams.append("limit", "10");

        const url = `${API_URL}/admin/users?${queryParams.toString()}`;
        console.log("Fetching users from:", url);

        const response = await fetch(url, {
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

        const data: ApiResponse = await response.json();
        console.log("API Response:", data);
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(
          error instanceof Error ? error.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, activeTab, tabs, search]);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    setCurrentPage(1);
    setSearch("");
  };

  const handleViewProfile = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId: number) => {
    setUserIdToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userIdToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) throw new Error("No token found in localStorage");

      const response = await fetch(`${API_URL}/admin/users/${userIdToDelete}`, {
        method: "DELETE",
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

      setUsers(users.filter((user) => user.id !== userIdToDelete));
      toast.success("User deleted successfully", {
        duration: 3000,
        position: "top-right",
        className: "bg-green-500 text-white text-sm rounded-lg shadow-md",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 3000,
        position: "top-right",
        className: "bg-red-500 text-white text-sm rounded-lg shadow-md",
      });
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setUserIdToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserIdToDelete(null);
  };

  const getAdditionalColumnHeader = () => {
    switch (activeTab) {
      case "Clients":
        return "Subscription Tier";
      case "Companies":
      case "Trainers":
        return "Company Name";
      case "Professionals":
        return "Documents";
      default:
        return "Details";
    }
  };

  const getAdditionalColumnValue = (user: User) => {
    switch (activeTab) {
      case "Clients":
        return user.subscriptionTier || "N/A";
      case "Companies":
        return user.securityCompany?.companyName || "N/A";
      case "Trainers":
        return user.courseProvider?.companyName || "N/A";
      case "Professionals":
        return user.individualProfessional?.documents?.length || 0;
      default:
        return "N/A";
    }
  };

  return (
    <div className="min-h-screen p-2 md:p-4 lg:p-6 xl:p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6 max-w-xs xs:max-w-sm sm:max-w-md mx-auto relative">
          <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by User ID, Name, or Email..."
            className="w-full py-2 sm:py-3 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Header */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 sm:gap-3">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-300" />
          User Management
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabChange(tab.name)}
              className={`px-2 py-1 sm:px-3 sm:py-2 md:px-4 rounded-lg text-xs xs:text-sm sm:text-base font-medium transition ${
                activeTab === tab.name
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-center text-red-500 dark:text-red-400 mb-3 sm:mb-4 text-xs sm:text-sm">
            {error}
          </p>
        )}

        {/* User Table or Card Layout */}
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
            Loading...
          </p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12 text-sm sm:text-base">
            No users found.
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
                      Name
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {getAdditionalColumnHeader()}
                    </th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {user.id}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {user.email || "N/A"}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {user.role.name}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {getAdditionalColumnValue(user)}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                        <button
                          onClick={() => handleViewProfile(user.id)}
                          className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            View Profile
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Delete User
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
                      Name
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {getAdditionalColumnHeader()}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {user.id}
                      </td>
                      <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
                        {user.role.name}
                      </td>
                      <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
                        {getAdditionalColumnValue(user)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 flex gap-2">
                        <button
                          onClick={() => handleViewProfile(user.id)}
                          className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            View Profile
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Delete User
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
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-3"
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2 font-semibold text-sm">
                      {user.firstName} {user.lastName}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">ID: </span>
                      {user.id}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Role: </span>
                      {user.role.name}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Email: </span>
                      {user.email || "N/A"}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created: </span>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {getAdditionalColumnHeader()}:{" "}
                      </span>
                      {getAdditionalColumnValue(user)}
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={() => handleViewProfile(user.id)}
                        className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">View</span>
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          View Profile
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs">Delete</span>
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          Delete User
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
        {isDeleteModalOpen && userIdToDelete && (
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
                Are you sure you want to delete user ID {userIdToDelete}?
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

        {/* Modal for Viewing User Profile */}
        {isModalOpen && selectedUser && (
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
                User Details: {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <div className="space-y-4">
                {/* Basic User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ID
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.id}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.role.name}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.firstName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.lastName || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.phoneNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.dateOfBirth
                        ? new Date(selectedUser.dateOfBirth).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Postcode
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.postcode || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Subscriber
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.isSubscriber ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Subscription Tier
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.subscriptionTier || "None"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created At
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Updated At
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedUser.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Role-Specific Fields */}
                {selectedUser.roleId === 5 && selectedUser.securityCompany && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                      Security Company Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Company Name
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.companyName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Registration Number
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.registrationNumber || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Address
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.address || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block Another AI took my job! text-sm font-medium text-gray-700 dark:text-gray-300">
                          Postcode
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.postCode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Contact Person
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.contactPerson || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Job Title
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.jobTitle || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone Number
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.phoneNumber || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Website
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-blue-400">
                          {selectedUser.securityCompany.website ? (
                            <a
                              href={selectedUser.securityCompany.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {selectedUser.securityCompany.website}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Services Requirements
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.servicesRequirements?.join(", ") || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Security Services Offerings
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.securityCompany.securityServicesOfferings?.join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.roleId === 6 && selectedUser.courseProvider && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                      Course Provider Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Company Name
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.companyName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Registration Number
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.registrationNumber || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Address
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.address || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Postcode
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.postCode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Contact Person
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.contactPerson || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Job Title
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.jobTitle || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone Number
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.phoneNumber || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Website
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-blue-400">
                          {selectedUser.courseProvider.website ? (
                            <a
                              href={selectedUser.courseProvider.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {selectedUser.courseProvider.website}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Services Requirements
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.servicesRequirements?.join(", ") || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Security Services Offerings
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.courseProvider.securityServicesOfferings?.join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.roleId === 3 && selectedUser.individualProfessional && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                      Professional Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Profile
                        </span>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.individualProfessional.profile || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Documents
                        </span>
                        <ul className="mt-1 text-sm text-gray-900 dark:text-gray-100 list-disc pl-5">
                          {selectedUser.individualProfessional.documents?.length ? (
                            selectedUser.individualProfessional.documents.map(
                              (doc, index) => (
                                <li key={index}>
                                  <a
                                    href={doc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    Document {index + 1}
                                  </a>
                                </li>
                              )
                            )
                          ) : (
                            <p>N/A</p>
                          )}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Actions */}
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

export default UserManagement;













// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import {
//   Search,
//   Users,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   Eye,
//   Trash2,
//   X,
// } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import { API_URL } from "../../../../../utils/path";

// // Define nested interfaces for role-specific data
// interface Role {
//   id: number;
//   name: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface Permissions {
//   acceptTerms: boolean;
//   acceptEmails: boolean;
//   premiumServiceNeed?: boolean;
// }

// interface Client {
//   id: number;
//   userId: number;
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface IndividualProfessional {
//   id: number;
//   userId: number;
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
//   profile: string | null;
//   documents: string[];
// }

// interface SecurityCompany {
//   id: number;
//   userId: number;
//   companyName: string;
//   registrationNumber: string;
//   address: string;
//   postCode: string;
//   contactPerson: string;
//   jobTitle: string;
//   phoneNumber: string;
//   website: string;
//   servicesRequirements: string[];
//   securityServicesOfferings: string[];
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface CourseProvider {
//   id: number;
//   userId: number;
//   companyName: string;
//   registrationNumber: string;
//   address: string;
//   postCode: string;
//   contactPerson: string;
//   jobTitle: string;
//   phoneNumber: string;
//   website: string;
//   servicesRequirements: string[];
//   securityServicesOfferings: string[];
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface User {
//   id: number;
//   email?: string;
//   firstName: string;
//   lastName: string;
//   profile?: string | null;
//   screenName?: string | null;
//   phoneNumber?: string;
//   dateOfBirth?: string | null;
//   address?: string;
//   postcode?: string | null;
//   roleId: number;
//   isSubscriber?: boolean;
//   subscriptionTier?: string | null;
//   createdAt: string;
//   updatedAt: string;
//   validated?: boolean;
//   role: Role;
//   client?: Client;
//   individualProfessional?: IndividualProfessional;
//   securityCompany?: SecurityCompany;
//   courseProvider?: CourseProvider;
// }

// interface Pagination {
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// interface ApiResponse {
//   users: User[];
//   pagination: Pagination;
// }

// const UserManagement: React.FC = () => {
//   const [users, setUsers] = useState<User[]>([]);
//   const [search, setSearch] = useState("");
//   const [pagination, setPagination] = useState<Pagination | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [activeTab, setActiveTab] = useState("Clients");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const tabs = useMemo(
//     () => [
//       { name: "Clients", roleId: 4 },
//       { name: "Professionals", roleId: 3 },
//       { name: "Companies", roleId: 5 },
//       { name: "Trainers", roleId: 6 },
//       { name: "Businesses", roleId: 7 },
//     ],
//     []
//   );

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const tab = tabs.find((t) => t.name === activeTab);
//         const roleId = tab?.roleId;

//         if (!roleId) return;

//         const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//         if (!token) throw new Error("No token found in localStorage");
//         const queryParams = new URLSearchParams();
//         queryParams.append("roleId", roleId.toString());
//         queryParams.append("page", currentPage.toString());
//         queryParams.append('search',search.toString());
//         queryParams.append("limit", "10");

//         const url = `${API_URL}/admin/users?${queryParams.toString()}`;
//         console.log("Fetching users from:", url);

//         const response = await fetch(url, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(
//             errorData.message || `HTTP error! status: ${response.status}`
//           );
//         }

//         const data: ApiResponse = await response.json();
//         console.log("API Response:", data);
//         setUsers(data.users);
//         setPagination(data.pagination);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         setError(
//           error instanceof Error ? error.message : "An unexpected error occurred"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [currentPage, activeTab, tabs]);

//   const handleTabChange = (tabName: string) => {
//     setActiveTab(tabName);
//     setCurrentPage(1);
//   };

//   const handleViewProfile = (userId: number) => {
//     const user = users.find((u) => u.id === userId);
//     if (user) {
//       setSelectedUser(user);
//       setIsModalOpen(true);
//     }
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedUser(null);
//   };
//   const handleDeleteUser = async (userId: number) => {
//     if (!confirm(`Are you sure you want to delete user ID ${userId}?`)) return;

//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//       if (!token) throw new Error("No token found in localStorage");

//       const response = await fetch(`${API_URL}/admin/users/${userId}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.message || `HTTP error! status: ${response.status}`
//         );
//       }

//       setUsers(users.filter((user) => user.id !== userId));
//       toast.success("User deleted successfully", {
//         duration: 3000,
//         position: "top-right",
//         className: "bg-green-500 text-white text-sm rounded-lg shadow-md",
//       });
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       const errorMessage =
//         error instanceof Error ? error.message : "Failed to delete user";
//       setError(errorMessage);
//       toast.error(errorMessage, {
//         duration: 3000,
//         position: "top-right",
//         className: "bg-red-500 text-white text-sm rounded-lg shadow-md",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
//   // const handleDeleteUser = async (userId: number) => {
//   //   if (!confirm(`Are you sure you want to delete user ID ${userId}?`)) return;

//   //   try {
//   //     setLoading(true);
//   //     const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//   //     if (!token) throw new Error("No token found in localStorage");

//   //     const response = await fetch(`${API_URL}/admin/users/${userId}`, {
//   //       method: "DELETE",
//   //       headers: {
//   //         Authorization: `Bearer ${token}`,
//   //       },
//   //     });

//   //     if (!response.ok) {
//   //       const errorData = await response.json();
//   //       throw new Error(
//   //         errorData.message || `HTTP error! status: ${response.status}`
//   //       );
//   //     }

//   //     setUsers(users.filter((user) => user.id !== userId));
//   //     alert("User deleted successfully");
//   //   } catch (error) {
//   //     console.error("Error deleting user:", error);
//   //     setError(
//   //       error instanceof Error ? error.message : "Failed to delete user"
//   //     );
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // const filteredUsers = users.filter((user) => {
//   //   const q = search.toLowerCase();
//   //   return (
//   //     user.id.toString().includes(q) ||
//   //     user.firstName.toLowerCase().includes(q) ||
//   //     user.lastName.toLowerCase().includes(q) ||
//   //     (user.email?.toLowerCase() || "").includes(q)
//   //   );
//   // });

//   const getAdditionalColumnHeader = () => {
//     switch (activeTab) {
//       case "Clients":
//         return "Subscription Tier";
//       case "Companies":
//       case "Trainers":
//         return "Company Name";
//       case "Professionals":
//         return "Documents";
//       default:
//         return "Details";
//     }
//   };

//   const getAdditionalColumnValue = (user: User) => {
//     switch (activeTab) {
//       case "Clients":
//         return user.subscriptionTier || "N/A";
//       case "Companies":
//         return user.securityCompany?.companyName || "N/A";
//       case "Trainers":
//         return user.courseProvider?.companyName || "N/A";
//       case "Professionals":
//         return user.individualProfessional?.documents?.length || 0;
//       default:
//         return "N/A";
//     }
//   };

//   return (
//     <div className="min-h-screen p-2 md:p-4 lg:p-6 xl:p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">
//       <div className="max-w-7xl mx-auto">
//         {/* Search Bar */}
//         <div className="mb-4 sm:mb-6 max-w-xs xs:max-w-sm sm:max-w-md mx-auto relative">
//           <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
//           <input
//             type="text"
//             placeholder="Search by User ID, Name, or Email..."
//             className="w-full py-2 sm:py-3 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {/* Header */}
//         <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 sm:gap-3">
//           <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-300" />
//           User Management
//         </h1>

//         {/* Tabs */}
//         <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 justify-center">
//           {tabs.map((tab) => (
//             <button
//               key={tab.name}
//               onClick={() => handleTabChange(tab.name)}
//               className={`px-2 py-1 sm:px-3 sm:py-2 md:px-4 rounded-lg text-xs xs:text-sm sm:text-base font-medium transition ${
//                 activeTab === tab.name
//                   ? "bg-blue-500 text-white dark:bg-blue-600"
//                   : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//               }`}
//             >
//               {tab.name}
//             </button>
//           ))}
//         </div>

//         {/* Error Message */}
//         {error && (
//           <p className="text-center text-red-500 dark:text-red-400 mb-3 sm:mb-4 text-xs sm:text-sm">
//             {error}
//           </p>
//         )}

//         {/* User Table or Card Layout */}
//         {loading ? (
//           <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
//             Loading...
//           </p>
//         ) : users.length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
//             No users found.
//           </p>
//         ) : (
//           <>
//             {/* Table for medium screens and up */}
//             <div className="hidden md:block overflow-x-auto">
//               <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
//                 <thead>
//                   <tr className="bg-gray-50 dark:bg-gray-800">
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Name
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Email
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Created
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       {getAdditionalColumnHeader()}
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
//                   {users.map((user) => (
//                     <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.id}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.firstName} {user.lastName}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.email || "N/A"}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.role.name}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {new Date(user.createdAt).toLocaleDateString(undefined, {
//                           year: "numeric",
//                           month: "short",
//                           day: "numeric",
//                         })}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {getAdditionalColumnValue(user)}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex gap-2">
//                         <button
//                           onClick={() => handleViewProfile(user.id)}
//                           className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
//                           title="View Profile"
//                         >
//                           <Eye className="w-4 h-4" />
//                           <span className="hidden sm:inline">View</span>
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             View Profile
//                           </span>
//                         </button>
//                         <button
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
//                           title="Delete User"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           <span className="hidden sm:inline">Delete</span>
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             Delete User
//                           </span>
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Simplified table for small screens (sm to md) */}
//             <div className="hidden sm:block md:hidden overflow-x-auto">
//               <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
//                 <thead>
//                   <tr className="bg-gray-50 dark:bg-gray-800">
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Name
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       {getAdditionalColumnHeader()}
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
//                   {users.map((user) => (
//                     <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//                       <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
//                         {user.id}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {user.firstName} {user.lastName}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {user.role.name}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {getAdditionalColumnValue(user)}
//                       </td>
//                       <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 flex gap-2">
//                         <button
//                           onClick={() => handleViewProfile(user.id)}
//                           className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
//                           title="View Profile"
//                         >
//                           <Eye className="w-4 h-4" />
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             View Profile
//                           </span>
//                         </button>
//                         <button
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
//                           title="Delete User"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             Delete User
//                           </span>
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Card layout for extra small screens (below sm) */}
//             <div className="block sm:hidden space-y-3">
//               {users.map((user) => (
//                 <div
//                   key={user.id}
//                   className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-3"
//                 >
//                   <div className="grid grid-cols-2 gap-2 text-xs">
//                     <div className="col-span-2 font-semibold text-sm">
//                       {user.firstName} {user.lastName}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">ID: </span>
//                       {user.id}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">Role: </span>
//                       {user.role.name}
//                     </div>
//                     <div className="col-span-2">
//                       <span className="text-gray-500 dark:text-gray-400">Email: </span>
//                       {user.email || "N/A"}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">Created: </span>
//                       {new Date(user.createdAt).toLocaleDateString()}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">
//                         {getAdditionalColumnHeader()}:{" "}
//                       </span>
//                       {getAdditionalColumnValue(user)}
//                     </div>
//                     <div className="col-span-2 flex gap-2">
//                       <button
//                         onClick={() => handleViewProfile(user.id)}
//                         className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
//                         title="View Profile"
//                       >
//                         <Eye className="w-4 h-4" />
//                         <span className="text-xs">View</span>
//                         <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                           View Profile
//                         </span>
//                       </button>
//                       <button
//                         onClick={() => handleDeleteUser(user.id)}
//                         className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
//                         title="Delete User"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         <span className="text-xs">Delete</span>
//                         <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                           Delete User
//                         </span>
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}

//         {/* Pagination */}
//         {pagination && (
//           <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 md:mt-8 flex-wrap">
//             <button
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1 || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="First page"
//             >
//               <ChevronsLeft size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1 || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
//               let page;
//               if (pagination.totalPages <= 5) {
//                 page = i + 1;
//               } else if (currentPage <= 3) {
//                 page = i + 1;
//               } else if (currentPage >= pagination.totalPages - 2) {
//                 page = pagination.totalPages - 4 + i;
//               } else {
//                 page = currentPage - 2 + i;
//               }

//               return (
//                 <button
//                   key={page}
//                   onClick={() => setCurrentPage(page)}
//                   className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition ${
//                     currentPage === page
//                       ? "bg-blue-500 dark:bg-blue-600 text-white"
//                       : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//                   }`}
//                   aria-label={`Page ${page}`}
//                   disabled={loading}
//                 >
//                   {page}
//                 </button>
//               );
//             })}
//             {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
//               <span className="px-1 text-gray-500">...</span>
//             )}
//             {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
//               <button
//                 onClick={() => setCurrentPage(pagination.totalPages)}
//                 className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700`}
//                 aria-label="Page ${pagination.totalPages}"
//                 disabled={loading}
//               >
//                 {pagination.totalPages}
//               </button>
//             )}
//             <button
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Next page"
//             >
//               <ChevronRight size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             <button
//               onClick={() => setCurrentPage(pagination.totalPages)}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Last page"
//             >
//               <ChevronsRight size={16} className="sm:w-5 sm:h-5" />
//             </button>
//           </div>
//         )}

//         {/* Modal for Viewing User Profile */}
//         {isModalOpen && selectedUser && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[70vh] overflow-y-auto p-6 relative">
//               <button
//                 onClick={handleCloseModal}
//                 className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
//                 title="Close"
//               >
//                 <X size={24} />
//               </button>
//               <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
//                 User Details: {selectedUser.firstName} {selectedUser.lastName}
//               </h2>
//               <div className="space-y-4">
//                 {/* Basic User Info */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.id}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.role.name}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.firstName || "N/A"}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.lastName || "N/A"}</p>
//                   </div>
//                   <div className="col-span-2">
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.email || "N/A"}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.phoneNumber || "N/A"}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                       {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : "N/A"}
//                     </p>
//                   </div>
//                   <div className="col-span-2">
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.address || "N/A"}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Postcode</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.postcode || "N/A"}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscriber</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.isSubscriber ? "Yes" : "No"}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Tier</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.subscriptionTier || "None"}</p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created At</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                       {new Date(selectedUser.createdAt).toLocaleString()}
//                     </p>
//                   </div>
//                   <div>
//                     <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Updated At</span>
//                     <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                       {new Date(selectedUser.updatedAt).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Role-Specific Fields */}
//                 {selectedUser.roleId === 5 && selectedUser.securityCompany && (
//                   <>
//                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
//                       Security Company Details
//                     </h3>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.companyName || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Number</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.registrationNumber || "N/A"}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.address || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Postcode</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.postCode || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.contactPerson || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.jobTitle || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.phoneNumber || "N/A"}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-blue-400">
//                           {selectedUser.securityCompany.website ? (
//                             <a href={selectedUser.securityCompany.website} target="_blank" rel="noopener noreferrer">
//                               {selectedUser.securityCompany.website}
//                             </a>
//                           ) : (
//                             "N/A"
//                           )}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Services Requirements</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.servicesRequirements?.join(", ") || "N/A"}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Security Services Offerings</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.securityCompany.securityServicesOfferings?.join(", ") || "N/A"}
//                         </p>
//                       </div>
//                     </div>
//                   </>
//                 )}

//                 {selectedUser.roleId === 6 && selectedUser.courseProvider && (
//                   <>
//                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
//                       Course Provider Details
//                     </h3>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.companyName || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Number</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.registrationNumber || "N/A"}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.address || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Postcode</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.postCode || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.contactPerson || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.jobTitle || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.phoneNumber || "N/A"}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-blue-400">
//                           {selectedUser.courseProvider.website ? (
//                             <a href={selectedUser.courseProvider.website} target="_blank" rel="noopener noreferrer">
//                               {selectedUser.courseProvider.website}
//                             </a>
//                           ) : (
//                             "N/A"
//                           )}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Services Requirements</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.servicesRequirements?.join(", ") || "N/A"}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Security Services Offerings</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.courseProvider.securityServicesOfferings?.join(", ") || "N/A"}
//                         </p>
//                       </div>
//                     </div>
//                   </>
//                 )}

//                 {selectedUser.roleId === 3 && selectedUser.individualProfessional && (
//                   <>
//                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
//                       Professional Details
//                     </h3>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile</span>
//                         <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
//                           {selectedUser.individualProfessional.profile || "N/A"}
//                         </p>
//                       </div>
//                       <div className="col-span-2">
//                         <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Documents</span>
//                         <ul className="mt-1 text-sm text-gray-900 dark:text-gray-100 list-disc pl-5">
//                           {selectedUser.individualProfessional.documents?.length ? (
//                             selectedUser.individualProfessional.documents.map((doc, index) => (
//                               <li key={index}>
//                                 <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
//                                   Document {index + 1}
//                                 </a>
//                               </li>
//                             ))
//                           ) : (
//                             <p>N/A</p>
//                           )}
//                         </ul>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>

//               {/* Modal Actions */}
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={handleCloseModal}
//                   className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserManagement;

















// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import {
//   Search,
//   Users,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   Eye,
//   Trash2,
// } from "lucide-react";
// import { API_URL } from "../../../../../utils/path";

// // Define nested interfaces for role-specific data
// interface Role {
//   id: number;
//   name: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface Permissions {
//   acceptTerms: boolean;
//   acceptEmails: boolean;
//   premiumServiceNeed?: boolean;
// }

// interface Client {
//   id: number;
//   userId: number;
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface IndividualProfessional {
//   id: number;
//   userId: number;
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
//   profile: string | null;
//   documents: string[];
// }

// interface SecurityCompany {
//   id: number;
//   userId: number;
//   companyName: string;
//   registrationNumber: string;
//   address: string;
//   postCode: string;
//   contactPerson: string;
//   jobTitle: string;
//   phoneNumber: string;
//   website: string;
//   servicesRequirements: string[];
//   securityServicesOfferings: string[];
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface CourseProvider {
//   id: number;
//   userId: number;
//   companyName: string;
//   registrationNumber: string;
//   address: string;
//   postCode: string;
//   contactPerson: string;
//   jobTitle: string;
//   phoneNumber: string;
//   website: string;
//   servicesRequirements: string[];
//   securityServicesOfferings: string[];
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface User {
//   id: number;
//   email?: string;
//   firstName: string;
//   lastName: string;
//   profile?: string | null;
//   screenName?: string | null;
//   phoneNumber?: string;
//   dateOfBirth?: string | null;
//   address?: string;
//   postcode?: string | null;
//   roleId: number;
//   isSubscriber?: boolean;
//   subscriptionTier?: string | null;
//   createdAt: string;
//   updatedAt: string;
//   validated?: boolean;
//   role: Role;
//   client?: Client;
//   individualProfessional?: IndividualProfessional;
//   securityCompany?: SecurityCompany;
//   courseProvider?: CourseProvider;
// }

// interface Pagination {
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// interface ApiResponse {
//   users: User[];
//   pagination: Pagination;
// }

// const UserManagement: React.FC = () => {
//   const [users, setUsers] = useState<User[]>([]);
//   const [search, setSearch] = useState("");
//   const [pagination, setPagination] = useState<Pagination | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [activeTab, setActiveTab] = useState("Clients");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const tabs = useMemo(
//     () => [
//       { name: "Clients", roleId: 4 },
//       { name: "Professionals", roleId: 3 },
//       { name: "Companies", roleId: 5 },
//       { name: "Trainers", roleId: 6 },
//       { name: "Businesses", roleId: 7 },
//     ],
//     []
//   );

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const tab = tabs.find((t) => t.name === activeTab);
//         const roleId = tab?.roleId;

//         if (!roleId) return;

//         const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//         if (!token) throw new Error("No token found in localStorage");
//         const queryParams = new URLSearchParams();
//         queryParams.append("roleId", roleId.toString());
//         queryParams.append("page", currentPage.toString());
//         queryParams.append("limit", "10");

//         const url = `${API_URL}/admin/users?${queryParams.toString()}`;
//         console.log("Fetching users from:", url);

//         const response = await fetch(url, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(
//             errorData.message || `HTTP error! status: ${response.status}`
//           );
//         }

//         const data: ApiResponse = await response.json();
//         console.log("API Response:", data);
//         setUsers(data.users);
//         setPagination(data.pagination);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         setError(
//           error instanceof Error ? error.message : "An unexpected error occurred"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [currentPage, activeTab, tabs]);

//   const handleTabChange = (tabName: string) => {
//     setActiveTab(tabName);
//     setCurrentPage(1);
//   };

//   const handleViewProfile = (userId: number) => {
//     // Placeholder for viewing profile (e.g., navigate to profile page)
//     console.log(`Viewing profile for user ID: ${userId}`);
//     // Example: You could use a router like `next/router` for navigation
//     // router.push(`/admin/users/${userId}`);
//   };

//   const handleDeleteUser = async (userId: number) => {
//     if (!confirm(`Are you sure you want to delete user ID ${userId}?`)) return;

//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//       if (!token) throw new Error("No token found in localStorage");

//       const response = await fetch(`${API_URL}/admin/users/${userId}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.message || `HTTP error! status: ${response.status}`
//         );
//       }

//       // Update the user list after deletion
//       setUsers(users.filter((user) => user.id !== userId));
//       alert("User deleted successfully");
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       setError(
//         error instanceof Error ? error.message : "Failed to delete user"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredUsers = users.filter((user) => {
//     const q = search.toLowerCase();
//     return (
//       user.id.toString().includes(q) ||
//       user.firstName.toLowerCase().includes(q) ||
//       user.lastName.toLowerCase().includes(q) ||
//       (user.email?.toLowerCase() || "").includes(q)
//     );
//   });

//   const getAdditionalColumnHeader = () => {
//     switch (activeTab) {
//       case "Clients":
//         return "Subscription Tier";
//       case "Companies":
//       case "Trainers":
//         return "Company Name";
//       case "Professionals":
//         return "Documents";
//       default:
//         return "Details";
//     }
//   };

//   const getAdditionalColumnValue = (user: User) => {
//     switch (activeTab) {
//       case "Clients":
//         return user.subscriptionTier || "N/A";
//       case "Companies":
//         return user.securityCompany?.companyName || "N/A";
//       case "Trainers":
//         return user.courseProvider?.companyName || "N/A";
//       case "Professionals":
//         return user.individualProfessional?.documents?.length || 0;
//       default:
//         return "N/A";
//     }
//   };

//   return (
//     <div className="min-h-screen p-2 md:p-4 lg:p-6 xl:p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">
//       <div className="max-w-7xl mx-auto">
//         {/* Search Bar */}
//         <div className="mb-4 sm:mb-6 max-w-xs xs:max-w-sm sm:max-w-md mx-auto relative">
//           <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
//           <input
//             type="text"
//             placeholder="Search by User ID, Name, or Email..."
//             className="w-full py-2 sm:py-3 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {/* Header */}
//         <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 sm:gap-3">
//           <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-300" />
//           User Management
//         </h1>

//         {/* Tabs */}
//         <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 justify-center">
//           {tabs.map((tab) => (
//             <button
//               key={tab.name}
//               onClick={() => handleTabChange(tab.name)}
//               className={`px-2 py-1 sm:px-3 sm:py-2 md:px-4 rounded-lg text-xs xs:text-sm sm:text-base font-medium transition ${
//                 activeTab === tab.name
//                   ? "bg-blue-500 text-white dark:bg-blue-600"
//                   : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//               }`}
//             >
//               {tab.name}
//             </button>
//           ))}
//         </div>

//         {/* Error Message */}
//         {error && (
//           <p className="text-center text-red-500 dark:text-red-400 mb-3 sm:mb-4 text-xs sm:text-sm">
//             {error}
//           </p>
//         )}

//         {/* User Table or Card Layout */}
//         {loading ? (
//           <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
//             Loading...
//           </p>
//         ) : filteredUsers.length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
//             No users found.
//           </p>
//         ) : (
//           <>
//             {/* Table for medium screens and up */}
//             <div className="hidden md:block overflow-x-auto">
//               <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
//                 <thead>
//                   <tr className="bg-gray-50 dark:bg-gray-800">
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Name
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Email
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Created
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       {getAdditionalColumnHeader()}
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
//                   {filteredUsers.map((user) => (
//                     <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.id}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.firstName} {user.lastName}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.email || "N/A"}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.role.name}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {new Date(user.createdAt).toLocaleDateString(undefined, {
//                           year: "numeric",
//                           month: "short",
//                           day: "numeric",
//                         })}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {getAdditionalColumnValue(user)}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex gap-2">
//                         <button
//                           onClick={() => handleViewProfile(user.id)}
//                           className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
//                           title="View Profile"
//                         >
//                           <Eye className="w-4 h-4" />
//                           <span className="hidden sm:inline">View</span>
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             View Profile
//                           </span>
//                         </button>
//                         <button
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="relative group flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
//                           title="Delete User"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           <span className="hidden sm:inline">Delete</span>
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             Delete User
//                           </span>
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Simplified table for small screens (sm to md) */}
//             <div className="hidden sm:block md:hidden overflow-x-auto">
//               <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
//                 <thead>
//                   <tr className="bg-gray-50 dark:bg-gray-800">
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Name
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       {getAdditionalColumnHeader()}
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
//                   {filteredUsers.map((user) => (
//                     <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//                       <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
//                         {user.id}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {user.firstName} {user.lastName}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {user.role.name}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {getAdditionalColumnValue(user)}
//                       </td>
//                       <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300 flex gap-2">
//                         <button
//                           onClick={() => handleViewProfile(user.id)}
//                           className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
//                           title="View Profile"
//                         >
//                           <Eye className="w-4 h-4" />
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             View Profile
//                           </span>
//                         </button>
//                         <button
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
//                           title="Delete User"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                             Delete User
//                           </span>
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Card layout for extra small screens (below sm) */}
//             <div className="block sm:hidden space-y-3">
//               {filteredUsers.map((user) => (
//                 <div
//                   key={user.id}
//                   className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-3"
//                 >
//                   <div className="grid grid-cols-2 gap-2 text-xs">
//                     <div className="col-span-2 font-semibold text-sm">
//                       {user.firstName} {user.lastName}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">ID: </span>
//                       {user.id}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">Role: </span>
//                       {user.role.name}
//                     </div>
//                     <div className="col-span-2">
//                       <span className="text-gray-500 dark:text-gray-400">Email: </span>
//                       {user.email || "N/A"}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">Created: </span>
//                       {new Date(user.createdAt).toLocaleDateString()}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">
//                         {getAdditionalColumnHeader()}:{" "}
//                       </span>
//                       {getAdditionalColumnValue(user)}
//                     </div>
//                     <div className="col-span-2 flex gap-2">
//                       <button
//                         onClick={() => handleViewProfile(user.id)}
//                         className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform transform hover:scale-105 duration-200"
//                         title="View Profile"
//                       >
//                         <Eye className="w-4 h-4" />
//                         <span className="text-xs">View</span>
//                         <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                           View Profile
//                         </span>
//                       </button>
//                       <button
//                         onClick={() => handleDeleteUser(user.id)}
//                         className="relative group flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-transform transform hover:scale-105 duration-200"
//                         title="Delete User"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         <span className="text-xs">Delete</span>
//                         <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
//                           Delete User
//                         </span>
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}

//         {/* Pagination */}
//         {pagination && (
//           <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 md:mt-8 flex-wrap">
//             <button
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1 || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="First page"
//             >
//               <ChevronsLeft size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1 || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
//               let page;
//               if (pagination.totalPages <= 5) {
//                 page = i + 1;
//               } else if (currentPage <= 3) {
//                 page = i + 1;
//               } else if (currentPage >= pagination.totalPages - 2) {
//                 page = pagination.totalPages - 4 + i;
//               } else {
//                 page = currentPage - 2 + i;
//               }

//               return (
//                 <button
//                   key={page}
//                   onClick={() => setCurrentPage(page)}
//                   className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition ${
//                     currentPage === page
//                       ? "bg-blue-500 dark:bg-blue-600 text-white"
//                       : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//                   }`}
//                   aria-label={`Page ${page}`}
//                   disabled={loading}
//                 >
//                   {page}
//                 </button>
//               );
//             })}
//             {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
//               <span className="px-1 text-gray-500">...</span>
//             )}
//             {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
//               <button
//                 onClick={() => setCurrentPage(pagination.totalPages)}
//                 className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700`}
//                 aria-label={`Page ${pagination.totalPages}`}
//                 disabled={loading}
//               >
//                 {pagination.totalPages}
//               </button>
//             )}
//             <button
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Next page"
//             >
//               <ChevronRight size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             <button
//               onClick={() => setCurrentPage(pagination.totalPages)}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Last page"
//             >
//               <ChevronsRight size={16} className="sm:w-5 sm:h-5" />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserManagement;










// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import {
//   Search,
//   Users,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
// } from "lucide-react";
// import { API_URL } from "../../../../../utils/path";

// // Define nested interfaces for role-specific data
// interface Role {
//   id: number;
//   name: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface Permissions {
//   acceptTerms: boolean;
//   acceptEmails: boolean;
//   premiumServiceNeed?: boolean; // Optional based on API data
// }

// interface Client {
//   id: number;
//   userId: number;
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface IndividualProfessional {
//   id: number;
//   userId: number;
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
//   profile: string | null;
//   documents: string[]; // Assuming documents are file names or IDs
// }

// interface SecurityCompany {
//   id: number;
//   userId: number;
//   companyName: string;
//   registrationNumber: string;
//   address: string;
//   postCode: string;
//   contactPerson: string;
//   jobTitle: string;
//   phoneNumber: string;
//   website: string;
//   servicesRequirements: string[];
//   securityServicesOfferings: string[];
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface CourseProvider {
//   id: number;
//   userId: number;
//   companyName: string;
//   registrationNumber: string;
//   address: string;
//   postCode: string;
//   contactPerson: string;
//   jobTitle: string;
//   phoneNumber: string;
//   website: string;
//   servicesRequirements: string[];
//   securityServicesOfferings: string[];
//   permissions: Permissions;
//   createdAt: string;
//   updatedAt: string;
// }

// interface User {
//   id: number;
//   email?: string;
//   firstName: string;
//   lastName: string;
//   profile?: string | null;
//   screenName?: string | null;
//   phoneNumber?: string;
//   dateOfBirth?: string | null;
//   address?: string;
//   postcode?: string | null;
//   roleId: number;
//   isSubscriber?: boolean;
//   subscriptionTier?: string | null;
//   createdAt: string;
//   updatedAt: string;
//   validated?: boolean;
//   role: Role;
//   client?: Client;
//   individualProfessional?: IndividualProfessional;
//   securityCompany?: SecurityCompany;
//   courseProvider?: CourseProvider;
// }

// interface Pagination {
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// interface ApiResponse {
//   users: User[];
//   pagination: Pagination;
// }

// // interface Tab {
// //   name: string;
// //   roleId: number;
// // }

// const UserManagement: React.FC = () => {
//   const [users, setUsers] = useState<User[]>([]);
//   const [search, setSearch] = useState("");
//   const [pagination, setPagination] = useState<Pagination | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [activeTab, setActiveTab] = useState("Clients"); // Default to Clients
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const tabs = useMemo(() => [
//     { name: "Clients", roleId: 4 },
//     { name: "Professionals", roleId: 3 },
//     { name: "Companies", roleId: 5 },
//     { name: "Trainers", roleId: 6 },
//     { name: "Businesses", roleId: 7 },
//   ], []); // Empty dependency array since tabs is static

//   // Fetch users based on the active tab and current page
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const tab = tabs.find((t) => t.name === activeTab);
//         const roleId = tab?.roleId;

//         if (!roleId) return; // Skip if no roleId

//         const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//         if (!token) throw new Error("No token found in localStorage");
//         const queryParams = new URLSearchParams();
//         queryParams.append("roleId", roleId.toString());
//         queryParams.append("page", currentPage.toString());
//         queryParams.append("limit", "10"); // Add limit as required by API

//         const url = `${API_URL}/admin/users?${queryParams.toString()}`;
//         console.log("Fetching users from:", url);

//         const response = await fetch(url, {
//           headers: {
//             Authorization: `Bearer ${token}`, // Add the token to the Authorization header
//           },
//         });
//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//         }

//         const data: ApiResponse = await response.json();
//         console.log("API Response:", data);
//         setUsers(data.users);
//         setPagination(data.pagination);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         setError(error instanceof Error ? error.message : "An unexpected error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [currentPage, activeTab, tabs]); // tabs is now memoized

//   const handleTabChange = (tabName: string) => {
//     setActiveTab(tabName);
//     setCurrentPage(1); // Reset to page 1 when tab changes
//   };

//   // Filter users based on search input
//   const filteredUsers = users.filter((user) => {
//     const q = search.toLowerCase();
//     return (
//       user.id.toString().includes(q) ||
//       user.firstName.toLowerCase().includes(q) ||
//       user.lastName.toLowerCase().includes(q) ||
//       (user.email?.toLowerCase() || "").includes(q)
//     );
//   });

//   // Determine additional column based on active tab
//   const getAdditionalColumnHeader = () => {
//     switch (activeTab) {
//       case "Clients":
//         return "Subscription Tier";
//       case "Companies":
//       case "Trainers":
//         return "Company Name";
//       case "Professionals":
//         return "Documents";
//       default:
//         return "Details";
//     }
//   };

//   const getAdditionalColumnValue = (user: User) => {
//     switch (activeTab) {
//       case "Clients":
//         return user.subscriptionTier || "N/A";
//       case "Companies":
//         return user.securityCompany?.companyName || "N/A";
//       case "Trainers":
//         return user.courseProvider?.companyName || "N/A";
//       case "Professionals":
//         return user.individualProfessional?.documents?.length || 0;
//       default:
//         return "N/A";
//     }
//   };

//   return (
//     <div className="min-h-screen p-2 md:p-4 lg:p-6 xl:p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 sm:gap-3">
//           <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-300" />
//           User Management
//         </h1>

//         {/* Tabs */}
//         <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 justify-center">
//           {tabs.map((tab) => (
//             <button
//               key={tab.name}
//               onClick={() => handleTabChange(tab.name)}
//               className={`px-2 py-1 sm:px-3 sm:py-2 md:px-4 rounded-lg text-xs xs:text-sm sm:text-base font-medium transition ${
//                 activeTab === tab.name
//                   ? "bg-blue-500 text-white dark:bg-blue-600"
//                   : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//               }`}
//             >
//               {tab.name}
//             </button>
//           ))}
//         </div>

//         {/* Search Bar */}
//         <div className="mb-4 sm:mb-6 max-w-xs xs:max-w-sm sm:max-w-md mx-auto relative">
//           <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
//           <input
//             type="text"
//             placeholder="Search by User ID, Name, or Email..."
//             className="w-full py-2 sm:py-3 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {/* Error Message */}
//         {error && (
//           <p className="text-center text-red-500 dark:text-red-400 mb-3 sm:mb-4 text-xs sm:text-sm">
//             {error}
//           </p>
//         )}

//         {/* User Table or Card Layout */}
//         {loading ? (
//           <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
//             Loading...
//           </p>
//         ) : filteredUsers.length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
//             No users found.
//           </p>
//         ) : (
//           <>
//             {/* Table for medium screens and up */}
//             <div className="hidden md:block overflow-x-auto">
//               <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
//                 <thead>
//                   <tr className="bg-gray-50 dark:bg-gray-800">
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Name
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Email
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Created
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       {getAdditionalColumnHeader()}
//                     </th>
//                     <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                      Actions

//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
//                   {filteredUsers.map((user) => (
//                     <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.id}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.firstName} {user.lastName}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.email || "N/A"}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {user.role.name}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {new Date(user.createdAt).toLocaleDateString(undefined, {
//                           year: 'numeric',
//                           month: 'short',
//                           day: 'numeric'
//                         })}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         {getAdditionalColumnValue(user)}
//                       </td>
//                       <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
//                         <button>Delete</button>
//                         <button>View Profile</button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Simplified table for small screens (sm to md) */}
//             <div className="hidden sm:block md:hidden overflow-x-auto">
//               <table className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
//                 <thead>
//                   <tr className="bg-gray-50 dark:bg-gray-800">
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Name
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                       {getAdditionalColumnHeader()}
//                     </th>
//                     <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
//                   {filteredUsers.map((user) => (
//                     <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//                       <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
//                         {user.id}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {user.firstName} {user.lastName}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {user.role.name}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                         {getAdditionalColumnValue(user)}
//                       </td>
//                       <td className="px-2 py-2 whitespace-normal text-xs text-gray-700 dark:text-gray-300">
//                       <button>Delete</button>
//                       <button>View Profile</button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Card layout for extra small screens (below sm) */}
//             <div className="block sm:hidden space-y-3">
//               {filteredUsers.map((user) => (
//                 <div
//                   key={user.id}
//                   className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-3"
//                 >
//                   <div className="grid grid-cols-2 gap-2 text-xs">
//                     <div className="col-span-2 font-semibold text-sm">
//                       {user.firstName} {user.lastName}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">ID: </span>
//                       {user.id}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">Role: </span>
//                       {user.role.name}
//                     </div>
//                     <div className="col-span-2">
//                       <span className="text-gray-500 dark:text-gray-400">Email: </span>
//                       {user.email || "N/A"}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">Created: </span>
//                       {new Date(user.createdAt).toLocaleDateString()}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">
//                         {getAdditionalColumnHeader()}:{" "}
//                       </span>
//                       {getAdditionalColumnValue(user)}
//                     </div>
//                     <div>
//                       <span className="text-gray-500 dark:text-gray-400">
//                         Actions
//                       </span>
//                       <button>Delete</button>
//                       <button>View Profile</button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}

//         {/* Pagination */}
//         {pagination && (
//           <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 md:mt-8 flex-wrap">
//             <button
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1 || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="First page"
//             >
//               <ChevronsLeft size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1 || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
//               let page;
//               if (pagination.totalPages <= 5) {
//                 page = i + 1;
//               } else if (currentPage <= 3) {
//                 page = i + 1;
//               } else if (currentPage >= pagination.totalPages - 2) {
//                 page = pagination.totalPages - 4 + i;
//               } else {
//                 page = currentPage - 2 + i;
//               }
              
//               return (
//                 <button
//                   key={page}
//                   onClick={() => setCurrentPage(page)}
//                   className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition ${
//                     currentPage === page
//                       ? "bg-blue-500 dark:bg-blue-600 text-white"
//                       : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//                   }`}
//                   aria-label={`Page ${page}`}
//                   disabled={loading}
//                 >
//                   {page}
//                 </button>
//               );
//             })}
//             {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
//               <span className="px-1 text-gray-500">...</span>
//             )}
//             {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
//               <button
//                 onClick={() => setCurrentPage(pagination.totalPages)}
//                 className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700`}
//                 aria-label={`Page ${pagination.totalPages}`}
//                 disabled={loading}
//               >
//                 {pagination.totalPages}
//               </button>
//             )}
//             <button
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Next page"
//             >
//               <ChevronRight size={16} className="sm:w-5 sm:h-5" />
//             </button>
//             <button
//               onClick={() => setCurrentPage(pagination.totalPages)}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-1 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Last page"
//             >
//               <ChevronsRight size={16} className="sm:w-5 sm:h-5" />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserManagement;