'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import CourseApplicantAdsPage from './createJobPopup';
import { API_URL } from '../../../../../utils/path';
const initialForm = {
  title: '',
  description: '',
  otherCourse: '',
  courseType: '',
  courseLevel: '',
  duration: '',
  startDate: '',
  endDate: '',
  location: '',
  deliveryMethod: '',
  price: '',
  accreditation: '',
  bookingLink: '',
};

// Interface for the "createdBy" user object
interface CreatedBy {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  screenName: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO date string
  address: string;
  postcode: string;
  roleId: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  validated: boolean;
}

// Interface for each course item
export interface Course {
  id: number;
  createdById: number;
  title: string;
  description: string;
  otherCourse: string;
  courseType: string;
  courseLevel: string;
  duration: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  location: string;
  deliveryMethod: string;
  price: string;
  accreditation: string;
  bookingLink: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  courseProviderId: number | null;
  createdBy: CreatedBy;
}

// Interface for metadata about pagination
interface MetaData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Interface for the entire response
export interface CourseResponse {
  data: Course[];
  meta: MetaData;
}

export default function JobsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        createdById: 1,
        ...form,
      };

      if (editingJobId) {
        // Update existing job
        await axios.patch(
          `${API_URL}/course/course-ads/${editingJobId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add token to Authorization header
            },
          }
        );
        setSuccess('Course updated successfully!');
        setEditingJobId(null); // reset editing state after update
      } else {
        // Create new job
        await axios.post(
          `${API_URL}/course/course-ads`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add token to Authorization header
            },
          }
        );
        setSuccess('Course created successfully!');
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
      const url = `${API_URL}/course/course-ads?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data: CourseResponse = await res.json();

      setCourses(data?.data);
      setTotalPages(data?.meta?.totalPages || 1);
    } catch (err: unknown) {
      setError("Unknown error");
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
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/course/course-ads/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete job');
      fetchJobs(page, limit, searchTerm);
    } catch (err: unknown) {
      setError('Failed to delete job');
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Courses List</h1>

      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search by Course title, user name or email..."
          onChange={handleSearchChange}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Search Courses"
        />
      </div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Courses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-blue-900"
        >
          Create Course
        </button>
      </div>
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-[1000px] bg-white text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Title</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Course Type</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Course Level</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Location</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Duration</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Start Date</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">End Date</th>
              <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Created By</th>
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
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-500 font-medium">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} className="border-b hover:bg-gray-100 transition-colors">
                  <td className="py-2 px-3 whitespace-nowrap">{course.title}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{course.courseType}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{course.courseLevel}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{course.location}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{course.duration}</td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {new Date(course.startDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {new Date(course.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {course.createdBy.firstName} {course.createdBy.lastName}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">{course.createdBy.email}</td>
                  <td className="py-2 px-3 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => {
                        setEditingJobId(course.id);
                        setForm({
                          title: course.title,
                          courseType: course.courseType,
                          courseLevel: course.courseLevel,
                          location: course.location,
                          duration: course.duration,
                          startDate: course.startDate.split('T')[0],
                          endDate: course.endDate.split('T')[0],
                          description: course.description,
                          otherCourse: course.otherCourse,
                          deliveryMethod: course.deliveryMethod,
                          price: course.price,
                          accreditation: course.accreditation,
                          bookingLink: course.bookingLink,
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
                      onClick={() => handleDelete(course.id)}
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
                : 'border-indigo-600 text-indigo-600 hoverkeyboard_arrow_right hover:bg-indigo-600 hover:text-white transition'
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
        {editingJobId ? 'Edit Course' : 'Create New Course'}
      </h2>

      {error && <div className="text-red-700 bg-red-100 p-3 rounded mb-3">{error}</div>}
      {success && <div className="text-green-700 bg-green-100 p-3 rounded mb-3">{success}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const isEmpty = Object.values(form).some(val => val === '');
          if (isEmpty) {
            setError("All fields are required.");
            return;
          }

          handleSubmit(e);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Course Title:</label>
          <input
            required
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter course title"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Course Description:</label>
          <textarea
            required
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Detailed description"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Other Course Info:</label>
          <input
            required
            type="text"
            name="otherCourse"
            value={form.otherCourse}
            onChange={handleChange}
            placeholder="Related course references"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Course Type:</label>
          <input
            required
            type="text"
            name="courseType"
            value={form.courseType}
            onChange={handleChange}
            placeholder="Service, Works, Goods, Consultancy"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Course Level:</label>
          <input
            required
            type="text"
            name="courseLevel"
            value={form.courseLevel}
            onChange={handleChange}
            placeholder="Beginner, Intermediate, Advanced"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Course Duration:</label>
          <select
            required
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">Select Duration</option>
            <option value="1 day">1 day</option>
            <option value="2 days">2 days</option>
            <option value="1 week">1 week</option>
            <option value="1 month">1 month</option>
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="1 year">1 year</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Deadline for Submission:</label>
          <input
            required
            type="datetime-local"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Course Start Date:</label>
          <input
            required
            type="datetime-local"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Location:</label>
          <input
            required
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Enter course location"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Submission Method:</label>
          <input
            required
            type="text"
            name="deliveryMethod"
            value={form.deliveryMethod}
            onChange={handleChange}
            placeholder="Email, portal, physical"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Estimated Budget:</label>
          <input
            required
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            placeholder="Enter budget"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Accreditation:</label>
          <input
            required
            type="text"
            name="accreditation"
            value={form.accreditation}
            onChange={handleChange}
            placeholder="Enter required certifications"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">Booking Link:</label>
          <input
            required
            type="text"
            name="bookingLink"
            value={form.bookingLink}
            onChange={handleChange}
            placeholder="Submission or registration link"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

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
            {loading ? (editingJobId ? 'Updating...' : 'Creating...') : (editingJobId ? 'Update Course' : 'Create Course')}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      <CourseApplicantAdsPage />
    </div>
  );
}








// 'use client';

// import { useEffect, useState, useRef } from 'react';

// import axios from 'axios';
// import CourseApplicantAdsPage from './createJobPopup';


// const initialForm = {
//   title: '',
//   description: '',
//   otherCourse: '',
//   courseType: '',
//   courseLevel: '',
//   duration: '',
//   startDate: '',
//   endDate: '',
//   location: '',
//   deliveryMethod: '',
//   price: '',
//   accreditation: '',
//   bookingLink: '',
// };

// // Interface for the "createdBy" user object
// interface CreatedBy {
//   id: number;
//   email: string;
//   firstName: string;
//   lastName: string;
//   screenName: string;
//   phoneNumber: string;
//   dateOfBirth: string; // ISO date string
//   address: string;
//   postcode: string;
//   roleId: number;
//   createdAt: string; // ISO date string
//   updatedAt: string; // ISO date string
//   validated: boolean;
// }

// // Interface for each course item
// export interface Course {
//   id: number;
//   createdById: number;
//   title: string;
//   description: string;
//   otherCourse: string;
//   courseType: string;
//   courseLevel: string;
//   duration: string;
//   startDate: string; // ISO date string
//   endDate: string; // ISO date string
//   location: string;
//   deliveryMethod: string;
//   price: string;
//   accreditation: string;
//   bookingLink: string;
//   createdAt: string; // ISO date string
//   updatedAt: string; // ISO date string
//   courseProviderId: number | null;
//   createdBy: CreatedBy;
// }

// // Interface for metadata about pagination
// interface MetaData {
//   total: number;
//   page: number;
//   pageSize: number;
//   totalPages: number;
// }

// // Interface for the entire response
// export interface CourseResponse {
//   data: Course[];
//   meta: MetaData;
// }


// export default function JobsPage() {
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [editingJobId, setEditingJobId] = useState<number | null>(null);

//   const [searchTerm, setSearchTerm] = useState('');
//   const searchRef = useRef<NodeJS.Timeout | null>(null);
//     const [form, setForm] = useState(initialForm);

//   const [success, setSuccess] = useState<string | null>(null);
//   const [showForm, setShowForm] = useState(false);


//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setForm({ ...form, [name]: value });
//   };



// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();



//   setLoading(true);
//   setError(null);
//   setSuccess(null);

//   try {
//     const payload = {
//       createdById: 1,
//       ...form,
     
//     };

//     if (editingJobId) {
//       // Update existing job
//       await axios.patch(
//         `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/course/course-ads/${editingJobId}`,
//         payload
//       );
//       setSuccess('Course updated successfully!');
//       setEditingJobId(null); // reset editing state after update
//     } else {
//       // Create new job
//       await axios.post(
//         'https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/course/course-ads',
//         payload
        
//       );
//       setSuccess('Course created successfully!');
//     }

//     setForm(initialForm);
//     setShowForm(false);
//   }
//   catch (error: unknown)  {
//     setError(editingJobId ? 'Failed to update job. Please try again.' : 'Failed to create job. Please try again.');
//     console.log(error);
//   } finally {
//     fetchJobs(page, limit, searchTerm); // Refresh job list after create/update
//     setLoading(false);
//   }
// };

//    async function fetchJobs(page: number, limit: number, searchTerm: string) {
//     setLoading(true);
//     setError(null);
//     try {
//       const params = new URLSearchParams();
//       params.append("page", page.toString());
//       params.append("limit", limit.toString());
//       if (searchTerm.trim()) {
//         params.append("search", searchTerm.trim());
//       }
// const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//       const url = `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/course/course-ads?${params.toString()}`;
//       const res = await fetch(url, {
//   method: "GET",
//   headers: {
//     Authorization: `Bearer ${token}`,
   
//   },
//  // Optional: only if cookies or CORS credentials are needed
// });

//       if (!res.ok) throw new Error("Failed to fetch jobs");

//       const data: CourseResponse= await res.json();

//       setCourses(data?.data);
//       setTotalPages(data?.meta?.totalPages||1);
//     } catch (err: unknown) {
//       setError( "Unknown error");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   // useEffect calls the above function
//   useEffect(() => {
//     fetchJobs(page, limit, searchTerm);
//   }, [page, limit, searchTerm]);

//   function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const val = e.target.value;
//     if (searchRef.current) clearTimeout(searchRef.current);
//     searchRef.current = setTimeout(() => {
//       setPage(1);
//       setSearchTerm(val);
//     }, 500);
//   }
// const handleDelete = async (jobId: number) => {
//   if (!window.confirm('Are you sure you want to delete this job?')) return;
//   const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
//   try {
//     setLoading(true);
//     const res = await fetch(`https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/course/course-ads/${jobId}`, {
//       method: 'DELETE',
     
//           headers: { Authorization: `Bearer ${token}` },
        
//     });
//     if (!res.ok) throw new Error('Failed to delete job');
//     // Refresh jobs list after delete
//     fetchJobs(page, limit, searchTerm);  // assuming you have a function to reload job list
//   } catch (err: unknown) {
//     setError( 'Failed to delete job');
//     console.error(err); 
//   } finally {
//     setLoading(false);
//   }
// };

//   function getPageNumbers() {
//     const pages = [];
//     let startPage = Math.max(1, page - 2);
//     let endPage = Math.min(totalPages, page + 2);

//     if (page <= 3) {
//       endPage = Math.min(5, totalPages);
//     } else if (page > totalPages - 3) {
//       startPage = Math.max(1, totalPages - 4);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
//     return pages;
//   }

//   return (
//     <div className="container overflow-hidden px-4 py-8 max-w-full md:max-w-6xl">
//       <h1 className="text-3xl font-bold mb-6 text-gray-800">Courses List</h1>

//       <div className="mb-4 max-w-md">
//         <input
//           type="text"
//           placeholder="Search by Course title, user name or email..."
//           onChange={handleSearchChange}
//           className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           aria-label="Search Courses"
//         />
//       </div>
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-xl font-bold">Courses</h1>
//         <button
//           onClick={() => setShowForm(true)}
//           className="px-4 py-2  bg-gray-800 text-white rounded hover:bg-blue-900"
//         >
//           Create Course
//         </button>
//       </div>
//       <div className="overflow-x-auto shadow rounded-lg">
//         <table className="min-w-[1000px] bg-white text-sm">
//           <thead className="bg-gray-800 text-white">
//           <tr>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Title</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Course Type</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Course Level</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Location</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Duration</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Start Date</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">End Date</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Created By</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Email</th>
//   <th className="text-left py-2 px-3 uppercase font-semibold whitespace-nowrap">Tools</th>
// </tr>

//           </thead>
//           <tbody className="text-gray-700">
//             {loading ? (
//               <tr>
//                 <td colSpan={9} className="text-center py-6">Loading...</td>
//               </tr>
//             ) : error ? (
//               <tr>
//                 <td colSpan={9} className="text-center py-6 text-red-600 font-semibold">
//                   Error: {error}
//                 </td>
//               </tr>
//             ) : courses.length === 0 ? (
//               <tr>
//                 <td colSpan={9} className="text-center py-6 text-gray-500 font-medium">
//                   No courses found.
//                 </td>
//               </tr>
//             ) : (
//  courses.map(course => (
//   <tr key={course.id} className="border-b hover:bg-gray-100 transition-colors">
//     <td className="py-2 px-3 whitespace-nowrap">{course.title}</td>
//     <td className="py-2 px-3 whitespace-nowrap">{course.courseType}</td>
//     <td className="py-2 px-3 whitespace-nowrap">{course.courseLevel}</td>
//     <td className="py-2 px-3 whitespace-nowrap">{course.location}</td>
//     <td className="py-2 px-3 whitespace-nowrap">{course.duration}</td>
//     <td className="py-2 px-3 whitespace-nowrap">
//       {new Date(course.startDate).toLocaleDateString()}
//     </td>
//     <td className="py-2 px-3 whitespace-nowrap">
//       {new Date(course.endDate).toLocaleDateString()}
//     </td>
//     <td className="py-2 px-3 whitespace-nowrap">
//       {course.createdBy.firstName} {course.createdBy.lastName}
//     </td>
//     <td className="py-2 px-3 whitespace-nowrap">{course.createdBy.email}</td>
//     <td className="py-2 px-3 whitespace-nowrap space-x-2">
//       <button
//         onClick={() => {
//           setEditingJobId(course.id);
//           setForm({
//             title: course.title,
//             courseType: course.courseType,
//             courseLevel: course.courseLevel,
//             location: course.location,
//             duration: course.duration,
//             startDate: course.startDate.split('T')[0],
//             endDate: course.endDate.split('T')[0],
//             description: course.description,
//             otherCourse: course.otherCourse,
//             deliveryMethod: course.deliveryMethod,
//             price: course.price,
//             accreditation: course.accreditation,
//             bookingLink: course.bookingLink,
//             // Add other fields as needed
//           });
//           setShowForm(true);
//           setError(null);
//           setSuccess(null);
//         }}
//         className="px-2 py-1 text-sm bg-yellow-400 text-white rounded hover:bg-yellow-500"
//       >
//         Edit
//       </button>
//       <button
//         onClick={() => handleDelete(course.id)}
//         className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
//       >
//         Delete
//       </button>
//     </td>
//   </tr>
// ))


//             )}
//           </tbody>
//         </table>
//       </div>

//       {totalPages > 1 && (
//         <nav className="flex items-center justify-center space-x-2 mt-6" aria-label="Pagination">
//           <button
//             onClick={() => setPage(1)}
//             disabled={page === 1 || loading}
//             className={`px-2 py-1 rounded border ${
//               page === 1 || loading
//                 ? 'border-gray-300 text-gray-400 cursor-not-allowed'
//                 : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
//             }`}
//             aria-label="First page"
//           >
//             First
//           </button>

//           <button
//             onClick={() => setPage(p => Math.max(p - 1, 1))}
//             disabled={page === 1 || loading}
//             className={`px-2 py-1 rounded border ${
//               page === 1 || loading
//                 ? 'border-gray-300 text-gray-400 cursor-not-allowed'
//                 : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
//             }`}
//             aria-label="Previous page"
//           >
//             Prev
//           </button>

//           {getPageNumbers().map(pageNum => (
//             <button
//               key={pageNum}
//               onClick={() => setPage(pageNum)}
//               disabled={page === pageNum || loading}
//               className={`px-2 py-1 rounded border ${
//                 page === pageNum
//                   ? 'bg-indigo-600 text-white border-indigo-600 cursor-default'
//                   : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
//               }`}
//               aria-current={page === pageNum ? 'page' : undefined}
//             >
//               {pageNum}
//             </button>
//           ))}

//           <button
//             onClick={() => setPage(p => Math.min(p + 1, totalPages))}
//             disabled={page === totalPages || loading}
//             className={`px-2 py-1 rounded border ${
//               page === totalPages || loading
//                 ? 'border-gray-300 text-gray-400 cursor-not-allowed'
//                 : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
//             }`}
//             aria-label="Next page"
//           >
//             Next
//           </button>

//           <button
//             onClick={() => setPage(totalPages)}
//             disabled={page === totalPages || loading}
//             className={`px-2 py-1 rounded border ${
//               page === totalPages || loading
//                 ? 'border-gray-300 text-gray-400 cursor-not-allowed'
//                 : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition'
//             }`}
//             aria-label="Last page"
//           >
//             Last
//           </button>
//         </nav>
//       )}
//     {showForm && (
// <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm">
//   <div className="animate-fade-in-up bg-white p-6 rounded-lg w-full max-w-lg shadow-xl relative overflow-y-auto max-h-[80vh]">
//     <button
//       onClick={() => {
//         setShowForm(false);
//         setError(null);
//         setSuccess(null);
//       }}
//       className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
//       aria-label="Close form"
//     >
//       ✕
//     </button>

//     <h2 className="text-2xl font-semibold mb-4 text-gray-800">
//       {editingJobId ? 'Edit Course' : 'Create New Course'}
//     </h2>

//     {error && <div className="text-red-700 bg-red-100 p-3 rounded mb-3">{error}</div>}
//     {success && <div className="text-green-700 bg-green-100 p-3 rounded mb-3">{success}</div>}

//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Course Title:</label>
//         <input
//           type="text"
//           name="title"
//           value={form.title}
//           onChange={handleChange}
//           placeholder="Enter a brief, descriptive title for the tender/contract"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Course Description:</label>
//         <textarea
//           name="description"
//           value={form.description}
//           onChange={handleChange}
//           rows={3}
//           placeholder="Provide a detailed description of the work or services required..."
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Other Course Info:</label>
//         <input
//           type="text"
//           name="otherCourse"
//           value={form.otherCourse}
//           onChange={handleChange}
//           placeholder="Enter any related course or project references"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Course Type:</label>
//         <input
//           type="text"
//           name="courseType"
//           value={form.courseType}
//           onChange={handleChange}
//           placeholder="Service, Works, Goods, Consultancy, etc."
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Course Level:</label>
//         <input
//           type="text"
//           name="courseLevel"
//           value={form.courseLevel}
//           onChange={handleChange}
//           placeholder="Beginner, Intermediate, Advanced (or similar levels)"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Course Duration:</label>
//         <input
//           type="text"
//           name="duration"
//           value={form.duration}
//           onChange={handleChange}
//           placeholder="e.g., 6 months, 1 year"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Deadline for Submission:</label>
//         <input
//           type="datetime-local"
//           name="startDate"
//           value={form.startDate}
//           onChange={handleChange}
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Course Start Date:</label>
//         <input
//           type="datetime-local"
//           name="endDate"
//           value={form.endDate}
//           onChange={handleChange}
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Location of Work:</label>
//         <input
//           type="text"
//           name="location"
//           value={form.location}
//           onChange={handleChange}
//           placeholder="Enter the location where services are required"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Submission Method:</label>
//         <input
//           type="text"
//           name="deliveryMethod"
//           value={form.deliveryMethod}
//           onChange={handleChange}
//           placeholder="e.g., via email, portal, physical submission"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Estimated Budget or Value:</label>
//         <input
//           type="number"
//           name="price"
//           value={form.price}
//           min="0"
//           step="0.01"
//           onChange={handleChange}
//           placeholder="Enter estimated budget"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Accreditation/Certifications Required:</label>
//         <input
//           type="text"
//           name="accreditation"
//           value={form.accreditation}
//           onChange={handleChange}
//           placeholder="Specify any required qualifications"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div>
//         <label className="block font-medium mb-1 text-sm text-gray-700">Submission/Booking Link:</label>
//         <input
//           type="text"
//           name="bookingLink"
//           value={form.bookingLink}
//           onChange={handleChange}
//           placeholder="Paste the online submission or application link"
//           className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//         />
//       </div>

//       <div className="flex justify-end gap-3 pt-4">
//         <button
//           type="button"
//           onClick={() => {
//             setShowForm(false);
//             setError(null);
//             setSuccess(null);
//           }}
//           className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
//           disabled={loading}
//         >
//           {loading ? (editingJobId ? 'Updating...' : 'Creating...') : (editingJobId ? 'Update Tender' : 'Create Tender')}
//         </button>
//       </div>
//     </form>
//   </div>
// </div>

// )}
// <CourseApplicantAdsPage/>

//     </div>
//   );
// }
