'use client';

import { useEffect, useState, useRef } from 'react';
import { API_URL } from '../../../../../utils/path';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Order {
  id: string;
  orderNumber: number;
  customOrderId: string | null;
  userId: number;
  stripeCustomerId: string;
  productId: string;
  priceId: string;
  creationDate: string;
  startDate: string;
  endDate: string;
  orderStatus: 'active' | 'cancelled' | 'pending' | string;
  paymentMethodId: string;
  stripePaymentIntentId: string | null;
  stripeSubscriptionId: string;
  amount: string;
  currency: string;
  canceledAt: string | null;
  updatedAt: string | null;

  user: User;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OrdersApiResponse {
  orders: Order[];
  pagination: Pagination;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchOrders() {
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
        const url = `${API_URL}/admin/orders?${params.toString()}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data: OrdersApiResponse = await res.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error(err);
      } finally {
        setLoading(false);
      }
}
    fetchOrders();
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
    <div className="container mx-auto px-4 py-8 max-w-6xl"> {/* limit width */}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Orders List</h1>

      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search by order number, user name or email..."
          onChange={handleSearchChange}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Search orders"
        />
      </div>

      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white text-sm"> 
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Order #</th>
           
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">User Name</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Email</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Subscription ID</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Amount ({orders[0]?.currency || '£'})</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Status</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Created At</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Start Date</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">End Date</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-red-600 font-semibold">
                  Error: {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-gray-500 font-medium">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b hover:bg-gray-100 transition-colors"
                >
                  <td className="py-2 px-3 whitespace-nowrap">{order.orderNumber}</td>
                
                  <td className="py-2 px-3 whitespace-nowrap truncate max-w-[120px]" title={`${order.user.firstName} ${order.user.lastName}`}>
                    {order.user.firstName} {order.user.lastName}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap truncate max-w-[290px]" title={order.user.email}>
                    {order.user.email}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap truncate max-w-[290px]" title={order.stripeSubscriptionId}>{order.stripeSubscriptionId}</td>
                  <td className="py-2 px-3 whitespace-nowrap truncate max-w-[10px]">{(Number(order.amount) / 100).toFixed(2)}</td>
                  <td className={`py-2 px-3 whitespace-nowrap capitalize font-semibold ${
                    order.orderStatus === 'active' ? 'text-green-600' :
                    order.orderStatus === 'cancelled' ? 'text-red-600' :
                    order.orderStatus === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {order.orderStatus}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">{new Date(order.creationDate).toLocaleDateString()}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{new Date(order.startDate).toLocaleDateString()}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{new Date(order.endDate).toLocaleDateString()}</td>
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
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
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
              aria-current={page === pageNum ? 'page' : undefined}
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
</div>
);
}