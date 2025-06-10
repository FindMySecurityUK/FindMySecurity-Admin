'use client'

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../../../utils/path";

interface Plan {
  id: number;
  stripePriceId: string;
  billingInterval: string;
  price: number;
  currency: string;
  features: {
    ai: boolean;
    ads: boolean;
  };
}

interface Product {
  id: number;
  name: string;
  description: string;
  tier: string;
  plans: Plan[];
}

const roleMap: { [key: number]: string } = {
  3: "Security Professional",
  4: "Individual Looking for Security Professional",
  5: "Security Company",
  6: "Course Provider",
  7: "Corporate Client",
};

const RolePlansPage: React.FC = () => {
  const [roleId, setRoleId] = useState<number>(3);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const fetchPlans = async (id: number) => {
    setLoading(true);
    try {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZm1zLmNvbSIsInJvbGVJZCI6MSwiaWF0IjoxNzQ3OTI2Nzc1LCJleHAiOjE3NDg1MzE1NzV9.V-WqavGyHTnrS3oCNTMw3yGM5F38ohqU4FtMlsmslPs'; // fallback token
      const res = await axios.get(
        `${API_URL}/stripe/product/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch plans", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans(roleId);
  }, [roleId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value.toLowerCase());
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search)
  );

  return (
    <div className="p-6 bg-white min-h-screen text-black font-sans">
      <h2 className="text-2xl font-bold mb-6 text-black">Role-Based Plans</h2>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {Object.entries(roleMap).map(([id, name]) => (
          <button
            key={id}
            onClick={() => setRoleId(Number(id))}
            className={`px-4 py-2 rounded text-sm font-medium border transition ${
              roleId === Number(id)
                ? "bg-black text-white"
                : "bg-white text-black border-black hover:bg-black hover:text-white"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by product name..."
          value={search}
          onChange={handleSearch}
          className="w-full max-w-md px-4 py-2 text-black rounded border border-gray-400"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading plans...</p>
      ) : (
        <div className="overflow-x-auto">
          {filteredProducts.length > 0 ? (
            <table className="min-w-full border border-black">
              <thead className="bg-white-800">
                <tr>
                  <th className="border border-black px-4 py-2 text-left">Product</th>
                  <th className="border border-black px-4 py-2 text-left">Tier</th>
                  <th className="border border-black px-4 py-2 text-left">Plan ID</th>
                  <th className="border  border-black px-4 py-2 text-left">Interval</th>
                  <th className="border  border-black px-4 py-2 text-left">Price</th>
                  <th className="border  border-black px-4 py-2 text-left">AI</th>
                  <th className="border  border-black px-4 py-2 text-left">Ads</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) =>
                  product.plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-900">
                      <td className="border  border-black px-4 py-2">{product.name}</td>
                      <td className="border  border-black px-4 py-2">{product.tier}</td>
                      <td className="border  border-black px-4 py-2">{plan.stripePriceId}</td>
                      <td className="border border-black px-4 py-2">{plan.billingInterval}</td>
                      <td className="border border-black px-4 py-2">
                        {plan.price} {plan.currency.toUpperCase()}
                      </td>
                      <td className="border  border-black px-4 py-2">
                        {plan.features.ai ? "✅" : "❌"}
                      </td>
                      <td className="border  border-black px-4 py-2">
                        {plan.features.ads ? "✅" : "❌"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No plans available for {roleMap[roleId]}.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RolePlansPage;
