"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarIcon, FilterIcon } from "lucide-react";
import DatePicker from "react-datepicker";
import { API_URL } from "../../../utils/path";
import "react-datepicker/dist/react-datepicker.css";

interface ActivityLog {
  id: number;
  userId: number;
  activity: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserActivityLogsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("id") || "";

  const [activity, setActivity] = useState("login");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!userId) return;
    setLoading(true);
    try {
             const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) throw new Error("No token found in localStorage");
      const params = new URLSearchParams();
      params.append("activity", activity);
      params.append("page", page.toString());
      if (startDate)
     params.append("startDate", startDate.toLocaleDateString("en-CA"));


      if (endDate)
       params.append("endDate", endDate.toLocaleDateString("en-CA"));

    const res = await fetch(
  `${API_URL}/user-activity-logs/${userId}?${params.toString()}`,
  {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
);

      const json = await res.json();
      setLogs(json.data);
      setPagination(json.pagination);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activity, startDate, endDate, page]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">User Activity Logs</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-gray-600" />
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="border px-3 py-2 rounded text-sm"
          >
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-600" />
          <DatePicker
            selected={startDate}
            onChange={(date: Date|null) => setStartDate(date)}
            placeholderText="Start Date"
            className="border px-3 py-2 rounded text-sm"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-600" />
          <DatePicker
            selected={endDate}
            onChange={(date: Date|null) => setEndDate(date)}
            placeholderText="End Date"
            className="border px-3 py-2 rounded text-sm"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      <div className="overflow-x-auto border rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Activity</th>
              <th className="px-4 py-2 text-left">IP Address</th>
              <th className="px-4 py-2 text-left">User Agent</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{log.id}</td>
                  <td className="px-4 py-2 capitalize">{log.activity}</td>
                  <td className="px-4 py-2">{log.ipAddress}</td>
                  <td className="px-4 py-2 truncate max-w-xs" title={log.userAgent}>
                    {log.userAgent}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded border text-sm ${
                  pageNum === page
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
