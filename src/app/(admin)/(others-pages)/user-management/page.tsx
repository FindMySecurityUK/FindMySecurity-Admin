"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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
  premiumServiceNeed?: boolean; // Optional based on API data
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
  documents: string[]; // Assuming documents are file names or IDs
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

// interface Tab {
//   name: string;
//   roleId: number;
// }

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Clients"); // Default to Clients
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = useMemo(() => [
    { name: "Clients", roleId: 4 },
    { name: "Professionals", roleId: 3 },
    { name: "Companies", roleId: 5 },
    { name: "Trainers", roleId: 6 },
    { name: "Businesses", roleId: 7 },
  ], []); // Empty dependency array since tabs is static

  // Fetch users based on the active tab and current page
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const tab = tabs.find((t) => t.name === activeTab);
        const roleId = tab?.roleId;

        if (!roleId) return; // Skip if no roleId

        const queryParams = new URLSearchParams();
        queryParams.append("roleId", roleId.toString());
        queryParams.append("page", currentPage.toString());
        queryParams.append("limit", "10"); // Add limit as required by API

        const url = `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/admin/users?${queryParams.toString()}`;
        console.log("Fetching users from:", url);

        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        console.log("API Response:", data);
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(error instanceof Error ? error.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, activeTab, tabs]); // tabs is now memoized

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    setCurrentPage(1); // Reset to page 1 when tab changes
  };

  // Filter users based on search input
  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase();
    return (
      user.id.toString().includes(q) ||
      user.firstName.toLowerCase().includes(q) ||
      user.lastName.toLowerCase().includes(q) ||
      (user.email?.toLowerCase() || "").includes(q)
    );
  });

  // Determine additional column based on active tab
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
      <div className="max-w-7xl mx-auto">
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
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm sm:text-base">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredUsers.map((user) => (
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
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-normal text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {getAdditionalColumnValue(user)}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredUsers.map((user) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card layout for extra small screens (below sm) */}
            <div className="block sm:hidden space-y-3">
              {filteredUsers.map((user) => (
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
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
      </div>
    </div>
  );
};

export default UserManagement;