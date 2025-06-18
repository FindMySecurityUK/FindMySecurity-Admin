"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  FileCheck,
  User2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Loader2,
} from "lucide-react";
import { API_URL } from "../../../../../utils/path";
import Image from "next/image";

enum DocumentStatus {
  PENDING = "pending",
  VERIFIED = "approved",
  REJECTED = "rejected",
  APPROVED = "approved",
}

interface Document {
  id: number;
  url: string;
  status: DocumentStatus;
  uploadedAt: string;
}

interface GroupedDocument {
  userId: number;
  userName: string;
  documents: Document[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse {
  groupedDocuments: GroupedDocument[];
  pagination: Pagination;
}

/**
 * DocumentVerification component for managing and reviewing uploaded documents.
 * Fetches documents from an API, allows searching, status updates, and document preview.
 */
const DocumentVerification: React.FC = () => {
  const [documents, setDocuments] = useState<GroupedDocument[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [docLoadError, setDocLoadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /**
   * Fetches documents from the API with pagination.
   */
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
  
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) throw new Error("No token found in localStorage");
  
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (search.trim()) {
        queryParams.append("search", search.trim());
      }
      queryParams.append("page", currentPage.toString());
  
      const response = await fetch(
        `${API_URL}/admin/documents?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "insomnia/11.1.0",
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
  
      const data: ApiResponse = await response.json();
  
      const normalizedData = {
        ...data,
        groupedDocuments: data.groupedDocuments.map((group) => ({
          ...group,
          documents: group.documents.map((doc) => ({
            ...doc,
            status:
              doc.status.toLowerCase() === DocumentStatus.APPROVED
                ? DocumentStatus.VERIFIED
                : (doc.status.toLowerCase() as DocumentStatus),
          })),
        })),
      };
  
      setDocuments(normalizedData.groupedDocuments);
      setPagination(normalizedData.pagination);
    } catch (error) {
      setNotification({
        message: "Failed to fetch documents. Please try again.",
        type: "error",
      });
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);
  
  // const fetchDocuments = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
  //     if (!token) throw new Error("No token found in localStorage");
  //     const queryParams = new URLSearchParams({
  //       search: search.toString(),
  //     });
  //     const response = await fetch(
  //       `${API_URL}/admin/documents?${queryParams.toString()}&page=${currentPage}`,
  //       {
  //         headers: {
  //           "Authorization": `Bearer ${token}`, // Add token to Authorization header
  //           "User-Agent": "insomnia/11.1.0",
  //         },
  //       }
  //     );
  //     if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  //     const data: ApiResponse = await response.json();
  //     const normalizedData = {
  //       ...data,
  //       groupedDocuments: data.groupedDocuments.map((group) => ({
  //         ...group,
  //         documents: group.documents.map((doc) => ({
  //           ...doc,
  //           status:
  //             doc.status.toLowerCase() === DocumentStatus.APPROVED
  //               ? DocumentStatus.VERIFIED
  //               : (doc.status.toLowerCase() as DocumentStatus),
  //         })),
  //       })),
  //     };
  //     setDocuments(normalizedData.groupedDocuments);
  //     setPagination(normalizedData.pagination);
  //   } catch (error) {
  //     setNotification({ message: "Failed to fetch documents. Please try again.", type: "error" });
  //     console.error("Error fetching documents:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [currentPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Reset docLoadError when selectedDocument changes
  useEffect(() => {
    if (selectedDocument) {
      setDocLoadError(null);
    }
  }, [selectedDocument]);

  /**
   * Updates the status of a document via API.
   * @param userId - The ID of the user owning the document.
   * @param docId - The ID of the document.
   * @param newStatus - The new status to set ("verified" or "rejected").
   */
  const handleStatusChange = useCallback(
    async (userId: number, docId: number, newStatus: DocumentStatus.VERIFIED | DocumentStatus.REJECTED) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) throw new Error("No token found in localStorage");

        const apiStatus = newStatus === DocumentStatus.VERIFIED ? "APPROVED" : "REJECTED";
        const response = await fetch(
          `${API_URL}/admin/documents/${docId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`, // Add token to Authorization header
              "User-Agent": "insomnia/11.1.0",
            },
            body: JSON.stringify({ status: apiStatus }),
          }
        );
        if (response.ok) {
          setDocuments((prev) =>
            prev.map((group) =>
              group.userId === userId
                ? {
                    ...group,
                    documents: group.documents.map((doc) =>
                      doc.id === docId ? { ...doc, status: newStatus } : doc
                    ),
                  }
                : group
            )
          );
          if (selectedDocument && selectedDocument.id === docId) {
            setSelectedDocument((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
          setNotification({ message: `Document ${newStatus} successfully.`, type: "success" });
        } else {
          throw new Error(await response.text());
        }
      } catch (error) {
        setNotification({ message: "Failed to update document status.", type: "error" });
        console.error("Error updating status:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedDocument]
  );

  /**
   * Determines the file type from the document URL.
   * @param url - The document URL.
   * @returns The file extension or empty string.
   */
  const getFileType = useCallback((url: string): string => {
    return url.split(".").pop()?.toLowerCase() || "";
  }, []);

  /**
   * Renders the document content based on file type.
   * @param doc - The document to render.
   */
  const renderDocumentContent = useCallback(
    (doc: Document) => {
      const fileType = getFileType(doc.url);
      const supportedImageTypes = ["jpg", "jpeg", "png", "gif"];

      if (supportedImageTypes.includes(fileType)) {
        return (
          <Image
            src={doc.url}
            alt={`Document ${doc.id}`}
            className="w-full h-auto max-h-[60vh] object-contain rounded-lg border border-gray-200 dark:border-gray-700"
            onError={() => setDocLoadError("Unable to load image. Please check the file URL.")}
          />
        );
      } else if (fileType === "pdf") {
        return (
          <iframe
            src={doc.url}
            className="w-full h-[60vh] rounded-lg border border-gray-200 dark:border-gray-700"
            title={`Document ${doc.id}`}
            onError={() => setDocLoadError("Unable to load PDF. Please check the file URL.")}
          />
        );
      }
      return (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Preview unavailable for this file type.{" "}
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            View original file
          </a>
        </p>
      );
    },
    [getFileType]
  );

  // const filteredDocuments = documents.filter((group) => {
  //   const query = search.toLowerCase();
  //   return (
  //     group.userId.toString().includes(query) ||
  //     group.userName.toLowerCase().includes(query) ||
  //     group.documents.some((doc) => doc.id.toString().includes(query) || doc.status.includes(query))
  //   );
  // });

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
            <FileCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Document Verification Dashboard
          </h1>
        </header>

        {/* Search Bar */}
        <div className="mb-8 max-w-lg mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by User ID, Name, or Status"
            className="w-full py-2.5 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search documents"
          />
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
            }`}
            role="alert"
          >
            {notification.message}
          </div>
        )}

        {/* Document List */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No documents match your search criteria.</p>
        ) : (
          documents.map((group) => (
            <section key={group.userId} className="mb-10">
              <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <User2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {group.userName} (ID: {group.userId})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.documents.map((doc) => (
                  <article
                    key={doc.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                        Document #{doc.id}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                          (doc.status === DocumentStatus.VERIFIED && doc.status === DocumentStatus.APPROVED)
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : doc.status === DocumentStatus.REJECTED
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleStatusChange(group.userId, doc.id, DocumentStatus.VERIFIED)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        disabled={loading}
                        aria-label={`Verify document ${doc.id}`}
                      >
                        <CheckCircle size={16} /> Approved
                      </button>
                      <button
                        onClick={() => handleStatusChange(group.userId, doc.id, DocumentStatus.REJECTED)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        disabled={loading}
                        aria-label={`Reject document ${doc.id}`}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        aria-label={`View document ${doc.id}`}
                      >
                        <Eye size={16} /> View
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}

        {/* Modal for Document Details */}
        {selectedDocument && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Document #{selectedDocument.id}
                </h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label="Close document preview"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Document ID:</span> {selectedDocument.id}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        (selectedDocument.status === DocumentStatus.VERIFIED &&
                          selectedDocument.status === DocumentStatus.APPROVED)
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : selectedDocument.status === DocumentStatus.REJECTED
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {selectedDocument.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Uploaded:</span>{" "}
                    {new Date(selectedDocument.uploadedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">File:</span>{" "}
                    <a
                      href={selectedDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      View original file
                    </a>
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  {docLoadError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{docLoadError}</p>
                  ) : (
                    renderDocumentContent(selectedDocument)
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  aria-label="Close document preview"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <nav className="flex justify-center items-center gap-2 mt-8 flex-wrap" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Go to first page"
            >
              <ChevronsLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Go to previous page"
            >
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  currentPage === page
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                disabled={loading}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages || loading}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Go to next page"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={currentPage === pagination.totalPages || loading}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Go to last page"
            >
              <ChevronsRight size={20} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;








// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   CheckCircle,
//   XCircle,
//   Eye,
//   Search,
//   FileCheck,
//   User2,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   X,
// } from "lucide-react";

// interface Document {
//   id: number;
//   url: string;
//   status: "pending" | "verified" | "rejected" | "approved";
//   uploadedAt: string;
// }

// interface GroupedDocument {
//   userId: number;
//   userName: string;
//   documents: Document[];
// }

// interface Pagination {
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// interface ApiResponse {
//   groupedDocuments: GroupedDocument[];
//   pagination: Pagination;
// }

// const DocumentVerification: React.FC = () => {
//   const [documents, setDocuments] = useState<GroupedDocument[]>([]);
//   const [search, setSearch] = useState("");
//   const [pagination, setPagination] = useState<Pagination | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
//   const [docLoadError, setDocLoadError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchDocuments = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(
//           `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/admin/documents?page=${currentPage}`
//         );
//         const data: ApiResponse = await response.json();
//         const normalizedData = {
//           ...data,
//           groupedDocuments: data.groupedDocuments.map((group) => ({
//             ...group,
//             documents: group.documents.map((doc) => ({
//               ...doc,
//               status:
//                 doc.status.toLowerCase() === "approved"
//                   ? "verified"
//                   : (doc.status.toLowerCase() as "pending" | "verified" | "rejected"),
//             })),
//           })),
//         };
//         setDocuments(normalizedData.groupedDocuments);
//         setPagination(normalizedData.pagination);
//       } catch (error) {
//         console.error("Error fetching documents:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDocuments();
//   }, [currentPage]);

//   // Reset docLoadError when selectedDocument changes
//   useEffect(() => {
//     if (selectedDocument) {
//       setDocLoadError(null); // Reset error when a new document is selected
//     }
//   }, [selectedDocument]);

//   const handleStatusChange = async (userId: number, docId: number, newStatus: "verified" | "rejected") => {
//     setLoading(true);
//     try {
//       const apiStatus = newStatus === "verified" ? "APPROVED" : "REJECTED";
//       const response = await fetch(
//         `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/admin/documents/${docId}/status`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             "User-Agent": "insomnia/11.1.0",
//           },
//           body: JSON.stringify({ status: apiStatus }),
//         }
//       );

//       if (response.ok) {
//         setDocuments((prev) =>
//           prev.map((group) =>
//             group.userId === userId
//               ? {
//                   ...group,
//                   documents: group.documents.map((doc) =>
//                     doc.id === docId ? { ...doc, status: newStatus } : doc
//                   ),
//                 }
//               : group
//           )
//         );
//         if (selectedDocument && selectedDocument.id === docId) {
//           setSelectedDocument((prev) => (prev ? { ...prev, status: newStatus } : null));
//         }
//       } else {
//         console.error("Failed to update status:", await response.text());
//       }
//     } catch (error) {
//       console.error("Error updating status:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filtered = documents.filter((group) => {
//     const q = search.toLowerCase();
//     return (
//       group.userId.toString().includes(q) ||
//       group.userName.toLowerCase().includes(q) ||
//       group.documents.some((doc) =>
//         doc.id.toString().includes(q) || doc.status.includes(q)
//       )
//     );
//   });

//   const getFileType = (url: string): string => {
//     const extension = url.split(".").pop()?.toLowerCase();
//     return extension || "";
//   };

//   const renderDocumentContent = (doc: Document) => {
//     const fileType = getFileType(doc.url);

//     if (["jpg", "jpeg", "png", "gif"].includes(fileType)) {
//       return (
//         <img
//           src={doc.url}
//           alt={`Document ${doc.id}`}
//           className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
//           onError={() => setDocLoadError("Failed to load image.")}
//         />
//       );
//     } else if (fileType === "pdf") {
//       return (
//         <iframe
//           src={doc.url}
//           className="w-full h-[60vh] rounded-lg"
//           title={`Document ${doc.id}`}
//           onError={() => setDocLoadError("Failed to load PDF.")}
//         />
//       );
//     } else {
//       return (
//         <p className="text-sm text-gray-700 dark:text-gray-300">
//           Preview not available for this file type.{" "}
//           <a
//             href={doc.url}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-blue-600 dark:text-blue-400 hover:underline"
//           >
//             Download or view document
//           </a>
//         </p>
//       );
//     }
//   };

//   return (
//     <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-3">
//           <FileCheck className="w-8 h-8 text-blue-600 dark:text-blue-300" /> Document Verification
//         </h1>

//         <div className="mb-8 max-w-md mx-auto relative">
//           <Search className="absolute left-4 top-3 text-gray-400 dark:text-gray-300" />
//           <input
//             type="text"
//             placeholder="Search by User ID, Name, Doc ID or Status..."
//             className="w-full py-3 pl-12 pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {loading ? (
//           <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
//         ) : filtered.length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-gray-400">No documents found.</p>
//         ) : (
//           filtered.map((group) => (
//             <div key={group.userId} className="mb-12">
//               <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
//                 <User2 className="w-6 h-6 text-blue-600 dark:text-blue-300" />
//                 {group.userName} (ID: {group.userId})
//               </h2>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {group.documents.map((doc) => (
//                   <div
//                     key={doc.id}
//                     className="bg-white/70 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300"
//                   >
//                     <div className="flex justify-between items-center mb-2">
//                       <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
//                         Document #{doc.id}
//                       </h3>
//                       <span
//                         className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
//                           (doc.status === "verified" || doc.status === "approved")
//                             ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
//                             : doc.status === "rejected"
//                             ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
//                             : "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
//                         }`}
//                       >
//                         {doc.status}
//                       </span>
//                     </div>

//                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
//                       Uploaded on:{" "}
//                       {new Date(doc.uploadedAt).toLocaleString(undefined, {
//                         dateStyle: "medium",
//                         timeStyle: "short",
//                       })}
//                     </p>

//                     <div className="flex flex-wrap gap-2 mt-4">
//                       <button
//                         onClick={() =>
//                           handleStatusChange(group.userId, doc.id, "verified")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700 transition"
//                         disabled={loading}
//                       >
//                         <CheckCircle size={16} /> Verify
//                       </button>
//                       <button
//                         onClick={() =>
//                           handleStatusChange(group.userId, doc.id, "rejected")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 transition"
//                         disabled={loading}
//                       >
//                         <XCircle size={16} /> Reject
//                       </button>
//                       <button
//                         onClick={() => setSelectedDocument(doc)}
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-gray-800 hover:bg-black dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
//                         aria-label={`View details of document ${doc.id}`}
//                       >
//                         <Eye size={16} /> View
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))
//         )}

//         {/* Modal for Document Details */}
//         {selectedDocument && (
//           <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
//             <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-3xl shadow-lg border border-gray-200 dark:border-gray-800">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
//                   Document #{selectedDocument.id}
//                 </h3>
//                 <button
//                   onClick={() => setSelectedDocument(null)}
//                   className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
//                   aria-label="Close modal"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//               <div className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-3">
//                     <p className="text-sm text-gray-700 dark:text-gray-300">
//                       <span className="font-medium">Document ID:</span> {selectedDocument.id}
//                     </p>
//                     <p className="text-sm text-gray-700 dark:text-gray-300">
//                       <span className="font-medium">Status:</span>{" "}
//                       <span
//                         className={`px-2 py-1 rounded-full font-semibold capitalize ${
//                           (selectedDocument.status === "verified" || selectedDocument.status === "approved")
//                             ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
//                             : selectedDocument.status === "rejected"
//                             ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
//                             : "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
//                         }`}
//                       >
//                         {selectedDocument.status}
//                       </span>
//                     </p>
//                     <p className="text-sm text-gray-700 dark:text-gray-300">
//                       <span className="font-medium">Uploaded on:</span>{" "}
//                       {new Date(selectedDocument.uploadedAt).toLocaleString(undefined, {
//                         dateStyle: "medium",
//                         timeStyle: "short",
//                       })}
//                     </p>
//                     <p className="text-sm text-gray-700 dark:text-gray-300">
//                       <span className="font-medium">URL:</span>{" "}
//                       <a
//                         href={selectedDocument.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 dark:text-blue-400 hover:underline break-all"
//                       >
//                         View original file
//                       </a>
//                     </p>
//                   </div>
//                   <div className="flex flex-col items-center">
//                     {docLoadError ? (
//                       <p className="text-sm text-red-600 dark:text-red-400">{docLoadError}</p>
//                     ) : (
//                       renderDocumentContent(selectedDocument)
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={() => setSelectedDocument(null)}
//                   className="px-4 py-2 rounded-lg text-sm text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {pagination && (
//           <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
//             <button
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1 || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="First page"
//             >
//               <ChevronsLeft size={20} />
//             </button>
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1 || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
//               <button
//                 key={page}
//                 onClick={() => setCurrentPage(page)}
//                 className={`px-4 py-2 rounded-full text-sm font-medium transition ${
//                   currentPage === page
//                     ? "bg-blue-500 dark:bg-blue-600 text-white"
//                     : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//                 }`}
//                 aria-label={`Page ${page}`}
//                 disabled={loading}
//               >
//                 {page}
//               </button>
//             ))}
//             <button
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Next page"
//             >
//               <ChevronRight size={20} />
//             </button>
//             <button
//               onClick={() => setCurrentPage(pagination.totalPages)}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Last page"
//             >
//               <ChevronsRight size={20} />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DocumentVerification;











// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   CheckCircle,
//   XCircle,
//   Eye,
//   Search,
//   FileCheck,
//   User2,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   X,
// } from "lucide-react";

// interface Document {
//   id: number;
//   url: string;
//   status: "pending" | "verified" | "rejected" | "approved";
//   uploadedAt: string;
// }

// interface GroupedDocument {
//   userId: number;
//   userName: string;
//   documents: Document[];
// }

// interface Pagination {
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// interface ApiResponse {
//   groupedDocuments: GroupedDocument[];
//   pagination: Pagination;
// }

// const DocumentVerification: React.FC = () => {
//   const [documents, setDocuments] = useState<GroupedDocument[]>([]);
//   const [search, setSearch] = useState("");
//   const [pagination, setPagination] = useState<Pagination | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

//   useEffect(() => {
//     const fetchDocuments = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(
//           `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/admin/documents?page=${currentPage}`
//         );
//         const data: ApiResponse = await response.json();
//         // Normalize status to lowercase and map "approved" to "verified"
//         const normalizedData = {
//           ...data,
//           groupedDocuments: data.groupedDocuments.map((group) => ({
//             ...group,
//             documents: group.documents.map((doc) => ({
//               ...doc,
//               status:
//                 doc.status.toLowerCase() === "approved"
//                   ? "verified"
//                   : (doc.status.toLowerCase() as "pending" | "verified" | "rejected"),
//             })),
//           })),
//         };
//         setDocuments(normalizedData.groupedDocuments);
//         setPagination(normalizedData.pagination);
//       } catch (error) {
//         console.error("Error fetching documents:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDocuments();
//   }, [currentPage]);

//   const handleStatusChange = async (userId: number, docId: number, newStatus: "verified" | "rejected") => {
//     setLoading(true);
//     try {
//       const apiStatus = newStatus === "verified" ? "APPROVED" : "REJECTED";
//       const response = await fetch(
//         `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/admin/documents/${docId}/status`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             "User-Agent": "insomnia/11.1.0",
//           },
//           body: JSON.stringify({ status: apiStatus }),
//         }
//       );

//       if (response.ok) {
//         setDocuments((prev) =>
//           prev.map((group) =>
//             group.userId === userId
//               ? {
//                   ...group,
//                   documents: group.documents.map((doc) =>
//                     doc.id === docId ? { ...doc, status: newStatus } : doc
//                   ),
//                 }
//               : group
//           )
//         );
//         // Update selectedDocument if it's the same document
//         if (selectedDocument && selectedDocument.id === docId) {
//           setSelectedDocument((prev) => (prev ? { ...prev, status: newStatus } : null));
//         }
//       } else {
//         console.error("Failed to update status:", await response.text());
//       }
//     } catch (error) {
//       console.error("Error updating status:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filtered = documents.filter((group) => {
//     const q = search.toLowerCase();
//     return (
//       group.userId.toString().includes(q) ||
//       group.userName.toLowerCase().includes(q) ||
//       group.documents.some((doc) =>
//         doc.id.toString().includes(q) || doc.status.includes(q)
//       )
//     );
//   });

//   return (
//     <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-3">
//           <FileCheck className="w-8 h-8 text-blue-600 dark:text-blue-300" /> Document Verification
//         </h1>

//         <div className="mb-8 max-w-md mx-auto relative">
//           <Search className="absolute left-4 top-3 text-gray-400 dark:text-gray-300" />
//           <input
//             type="text"
//             placeholder="Search by User ID, Name, Doc ID or Status..."
//             className="w-full py-3 pl-12 pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {loading ? (
//           <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
//         ) : filtered.length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-gray-400">No documents found.</p>
//         ) : (
//           filtered.map((group) => (
//             <div key={group.userId} className="mb-12">
//               <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
//                 <User2 className="w-6 h-6 text-blue-600 dark:text-blue-300" />
//                 {group.userName} (ID: {group.userId})
//               </h2>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {group.documents.map((doc) => (
//                   <div
//                     key={doc.id}
//                     className="bg-white/70 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300"
//                   >
//                     <div className="flex justify-between items-center mb-2">
//                       <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
//                         Document #{doc.id}
//                       </h3>
//                       <span
//                         className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
//                           (doc.status === "verified" || doc.status === "approved")
//                             ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
//                             : doc.status === "rejected"
//                             ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
//                             : "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
//                         }`}
//                       >
//                         {doc.status}
//                       </span>
//                     </div>

//                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
//                       Uploaded on:{" "}
//                       {new Date(doc.uploadedAt).toLocaleString(undefined, {
//                         dateStyle: "medium",
//                         timeStyle: "short",
//                       })}
//                     </p>

//                     <div className="flex flex-wrap gap-2 mt-4">
//                       <button
//                         onClick={() =>
//                           handleStatusChange(group.userId, doc.id, "verified")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700 transition"
//                         disabled={loading}
//                       >
//                         <CheckCircle size={16} /> Verify
//                       </button>
//                       <button
//                         onClick={() =>
//                           handleStatusChange(group.userId, doc.id, "rejected")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 transition"
//                         disabled={loading}
//                       >
//                         <XCircle size={16} /> Reject
//                       </button>
//                       <button
//                         onClick={() => setSelectedDocument(doc)}
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-gray-800 hover:bg-black dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
//                         aria-label={`View details of document ${doc.id}`}
//                       >
//                         <Eye size={16} /> View
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))
//         )}

//         {/* Modal for Document Details */}
//         {selectedDocument && (
//           <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
//             <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200 dark:border-gray-800">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
//                   Document Details
//                 </h3>
//                 <button
//                   onClick={() => setSelectedDocument(null)}
//                   className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
//                   aria-label="Close modal"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//               <div className="space-y-3">
//                 <p className="text-sm text-gray-700 dark:text-gray-300">
//                   <span className="font-medium">Document ID:</span> {selectedDocument.id}
//                 </p>
//                 <p className="text-sm text-gray-700 dark:text-gray-300">
//                   <span className="font-medium">Status:</span>{" "}
//                   <span
//                     className={`px-2 py-1 rounded-full font-semibold capitalize ${
//                       (selectedDocument.status === "verified" || selectedDocument.status === "approved")
//                         ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
//                         : selectedDocument.status === "rejected"
//                         ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
//                         : "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
//                     }`}
//                   >
//                     {selectedDocument.status}
//                   </span>
//                 </p>
//                 <p className="text-sm text-gray-700 dark:text-gray-300">
//                   <span className="font-medium">Uploaded on:</span>{" "}
//                   {new Date(selectedDocument.uploadedAt).toLocaleString(undefined, {
//                     dateStyle: "medium",
//                     timeStyle: "short",
//                   })}
//                 </p>
//                 <p className="text-sm text-gray-700 dark:text-gray-300">
//                   <span className="font-medium">URL:</span>{" "}
//                   <a
//                     href={selectedDocument.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-blue-600 dark:text-blue-400 hover:underline break-all"
//                   >
//                     {selectedDocument.url}
//                   </a>
//                 </p>
//               </div>
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={() => setSelectedDocument(null)}
//                   className="px-4 py-2 rounded-lg text-sm text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {pagination && (
//           <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
//             {/* First Page Button */}
//             <button
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1 || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="First page"
//             >
//               <ChevronsLeft size={20} />
//             </button>

//             {/* Previous Page Button */}
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1 || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={20} />
//             </button>

//             {/* Page Numbers */}
//             {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
//               <button
//                 key={page}
//                 onClick={() => setCurrentPage(page)}
//                 className={`px-4 py-2 rounded-full text-sm font-medium transition ${
//                   currentPage === page
//                     ? "bg-blue-500 dark:bg-blue-600 text-white"
//                     : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
//                 }`}
//                 aria-label={`Page ${page}`}
//                 disabled={loading}
//               >
//                 {page}
//               </button>
//             ))}

//             {/* Next Page Button */}
//             <button
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Next page"
//             >
//               <ChevronRight size={20} />
//             </button>

//             {/* Last Page Button */}
//             <button
//               onClick={() => setCurrentPage(pagination.totalPages)}
//               disabled={currentPage === pagination.totalPages || loading}
//               className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//               aria-label="Last page"
//             >
//               <ChevronsRight size={20} />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DocumentVerification;





// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   CheckCircle,
//   XCircle,
//   Eye,
//   Search,
//   FileCheck,
//   User2,
// } from "lucide-react";

// // Documents
// interface Document {
//   documentId: number;
//   userId: number;
//   status: "pending" | "verified" | "rejected";
//   uploadedAt: string;
//   fileUrl: string;
// }

// const mockDocuments: Document[] = [
//   {
//     documentId: 101,
//     userId: 1,
//     status: "pending",
//     uploadedAt: "2025-05-08T16:21:43",
//     fileUrl: "https://example.com/doc1.pdf",
//   },
//   {
//     documentId: 102,
//     userId: 1,
//     status: "verified",
//     uploadedAt: "2025-05-08T16:25:10",
//     fileUrl: "https://example.com/doc2.pdf",
//   },
//   {
//     documentId: 103,
//     userId: 2,
//     status: "pending",
//     uploadedAt: "2025-05-08T16:30:15",
//     fileUrl: "https://example.com/doc3.pdf",
//   },
//   {
//     documentId: 104,
//     userId: 3,
//     status: "rejected",
//     uploadedAt: "2025-05-08T16:33:15",
//     fileUrl: "https://example.com/doc4.pdf",
//   },
// ];

// const DocumentVerification: React.FC = () => {
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     setDocuments(mockDocuments);
//   }, []);

//   const handleStatusChange = (id: number, newStatus: "verified" | "rejected") => {
//     setDocuments((prev) =>
//       prev.map((doc) =>
//         doc.documentId === id ? { ...doc, status: newStatus } : doc
//       )
//     );
//   };

//   const filtered = documents.filter((doc) => {
//     const q = search.toLowerCase();
//     return (
//       doc.userId.toString().includes(q) ||
//       doc.documentId.toString().includes(q) ||
//       doc.status.includes(q)
//     );
//   });

//   const grouped = filtered.reduce((acc: Record<number, Document[]>, doc) => {
//     acc[doc.userId] = acc[doc.userId] || [];
//     acc[doc.userId].push(doc);
//     return acc;
//   }, {});

//   return (
//     // <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-[#0f172a]">
//     <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-none dark:bg-gray-950">

//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-3">
//           <FileCheck className="w-8 h-8 text-blue-600 dark:text-blue-300" /> Document Verification
//         </h1>

//         <div className="mb-8 max-w-md mx-auto relative">
//           <Search className="absolute left-4 top-3 text-gray-400 dark:text-gray-300" />
//           <input
//             type="text"
//             placeholder="Search by User ID, Doc ID or Status..."
//             className="w-full py-3 pl-12 pr-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {Object.keys(grouped).length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-gray-400">No documents found.</p>
//         ) : (
//           Object.entries(grouped).map(([userId, docs]) => (
//             <div key={userId} className="mb-12">
//               <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
//                 <User2 className="w-6 h-6 text-blue-600 dark:text-blue-300" />
//                 User ID: {userId}
//               </h2>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {docs.map((doc) => (
//                   <div
//                     key={doc.documentId}
//                     className="bg-white/70 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300"
//                   >
//                     <div className="flex justify-between items-center mb-2">
//                       <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
//                         Document #{doc.documentId}
//                       </h3>
//                       <span
//                         className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
//                           doc.status === "verified"
//                             ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
//                             : doc.status === "rejected"
//                             ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
//                             : "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
//                         }`}
//                       >
//                         {doc.status}
//                       </span>
//                     </div>

//                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
//                       Uploaded on:{" "}
//                       {new Date(doc.uploadedAt).toLocaleString(undefined, {
//                         dateStyle: "medium",
//                         timeStyle: "short",
//                       })}
//                     </p>

//                     <div className="flex flex-wrap gap-2 mt-4">
//                       <button
//                         onClick={() =>
//                           handleStatusChange(doc.documentId, "verified")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700 transition"
//                       >
//                         <CheckCircle size={16} /> Verify
//                       </button>
//                       <button
//                         onClick={() =>
//                           handleStatusChange(doc.documentId, "rejected")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 transition"
//                       >
//                         <XCircle size={16} /> Reject
//                       </button>
//                       <a
//                         href={doc.fileUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-gray-800 hover:bg-black dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
//                       >
//                         <Eye size={16} /> View
//                       </a>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default DocumentVerification;





// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   CheckCircle,
//   XCircle,
//   Eye,
//   Search,
//   FileCheck,
//   User2,
// } from "lucide-react";
// // Documents
// interface Document {
//   documentId: number;
//   userId: number;
//   status: "pending" | "verified" | "rejected";
//   uploadedAt: string;
//   fileUrl: string;
// }

// const mockDocuments: Document[] = [
//   {
//     documentId: 101,
//     userId: 1,
//     status: "pending",
//     uploadedAt: "2025-05-08T16:21:43",
//     fileUrl: "https://example.com/doc1.pdf",
//   },
//   {
//     documentId: 102,
//     userId: 1,
//     status: "verified",
//     uploadedAt: "2025-05-08T16:25:10",
//     fileUrl: "https://example.com/doc2.pdf",
//   },
//   {
//     documentId: 103,
//     userId: 2,
//     status: "pending",
//     uploadedAt: "2025-05-08T16:30:15",
//     fileUrl: "https://example.com/doc3.pdf",
//   },
//   {
//     documentId: 104,
//     userId: 3,
//     status: "rejected",
//     uploadedAt: "2025-05-08T16:33:15",
//     fileUrl: "https://example.com/doc4.pdf",
//   },
// ];

// const statusStyle = {
//   verified: "bg-green-100 text-green-800 border border-green-300",
//   rejected: "bg-red-100 text-red-800 border border-red-300",
//   pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
// };

// const DocumentVerification: React.FC = () => {
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     setDocuments(mockDocuments);
//   }, []);

//   const handleStatusChange = (id: number, newStatus: "verified" | "rejected") => {
//     setDocuments((prev) =>
//       prev.map((doc) =>
//         doc.documentId === id ? { ...doc, status: newStatus } : doc
//       )
//     );
//   };

//   const filtered = documents.filter((doc) => {
//     const q = search.toLowerCase();
//     return (
//       doc.userId.toString().includes(q) ||
//       doc.documentId.toString().includes(q) ||
//       doc.status.includes(q)
//     );
//   });

//   const grouped = filtered.reduce((acc: Record<number, Document[]>, doc) => {
//     acc[doc.userId] = acc[doc.userId] || [];
//     acc[doc.userId].push(doc);
//     return acc;
//   }, {});

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-8">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 flex items-center justify-center gap-3">
//           <FileCheck className="w-8 h-8" /> Document Verification
//         </h1>

//         <div className="mb-8 max-w-md mx-auto relative">
//           <Search className="absolute left-4 top-3 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search by User ID, Doc ID or Status..."
//             className="w-full py-3 pl-12 pr-4 rounded-xl shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {Object.keys(grouped).length === 0 ? (
//           <p className="text-center text-gray-500">No documents found.</p>
//         ) : (
//           Object.entries(grouped).map(([userId, docs]) => (
//             <div key={userId} className="mb-12">
//               <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 <User2 className="w-6 h-6 text-blue-600" />
//                 User ID: {userId}
//               </h2>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {docs.map((doc) => (
//                   <div
//                     key={doc.documentId}
//                     className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-200 transition-all duration-300"
//                   >
//                     <div className="flex justify-between items-center mb-2">
//                       <h3 className="text-lg font-medium text-gray-800">
//                         Document #{doc.documentId}
//                       </h3>
//                       <span
//                         className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${statusStyle[doc.status]}`}
//                       >
//                         {doc.status}
//                       </span>
//                     </div>

//                     <p className="text-sm text-gray-500 mb-4">
//                       Uploaded on:{" "}
//                       {new Date(doc.uploadedAt).toLocaleString(undefined, {
//                         dateStyle: "medium",
//                         timeStyle: "short",
//                       })}
//                     </p>

//                     <div className="flex flex-wrap gap-2 mt-4">
//                       <button
//                         onClick={() =>
//                           handleStatusChange(doc.documentId, "verified")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-green-600 hover:bg-green-700 transition"
//                       >
//                         <CheckCircle size={16} /> Verify
//                       </button>
//                       <button
//                         onClick={() =>
//                           handleStatusChange(doc.documentId, "rejected")
//                         }
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition"
//                       >
//                         <XCircle size={16} /> Reject
//                       </button>
//                       <a
//                         href={doc.fileUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-gray-800 hover:bg-black transition"
//                       >
//                         <Eye size={16} /> View
//                       </a>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default DocumentVerification;
