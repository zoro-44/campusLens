import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Spinner } from "../components/Loader";
import { User, Search, Contact, Download, School } from "lucide-react";
import toast from "react-hot-toast";

const IDCardGenerator = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const serverUrl = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:3000";

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch student list for selection
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingList(true);
      try {
        const queryParams = {
          page: currentPage,
          limit: 8,
          branch: branchFilter,
        };
        if (debouncedSearch) {
          queryParams.search = debouncedSearch;
        }

        const response = await api.get("/students", { params: queryParams });
        if (response.data?.success) {
          setStudents(response.data.students);
          setTotalPages(response.data.pages);
          
          // Select first student automatically if none selected
          if (!selectedStudent && response.data.students.length > 0) {
            handleSelectStudent(response.data.students[0].htno);
          }
        }
      } catch (err) {
        console.error("Error fetching student list for ID generator:", err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchStudents();
  }, [currentPage, debouncedSearch, branchFilter]);

  const handleSelectStudent = async (htno) => {
    try {
      const response = await api.get(`/students/${htno}`);
      if (response.data?.success) {
        setSelectedStudent(response.data.data);
      }
    } catch (err) {
      console.error("Error loading student for ID card preview:", err);
      toast.error("Could not load preview profile.");
    }
  };

  const downloadIdCard = async () => {
    if (!selectedStudent) return;
    
    setGeneratingPdf(true);
    const toastId = toast.loading(`Generating ID Card for ${selectedStudent.personal.first_name}...`);

    try {
      const response = await api.get(`/students/${selectedStudent.personal.htno}/idcard`, {
        responseType: "blob"
      });

      // Download file using native blob URL
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `idcard_${selectedStudent.personal.htno}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Identity Card PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Error downloading ID Card:", err);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT PANEL: Student Selector list */}
      <div className="lg:col-span-1 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900">Select Student</h3>

        {/* Search & Branch Select */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-10 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roll or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="IT">IT</option>
            <option value="CSIT">CSIT</option>
            <option value="CSM">CSM</option>
            <option value="CSD/AIML">CSD/AIML</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>
        </div>

        {/* Student items */}
        {loadingList ? (
          <Spinner />
        ) : (
          <div className="space-y-2 h-[26rem] overflow-y-auto pr-1">
            {students.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No students found.</p>
            ) : (
              students.map((student) => {
                const isSelected = selectedStudent?.personal.htno === student.htno;
                return (
                  <button
                    key={student.htno}
                    onClick={() => handleSelectStudent(student.htno)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-gray-150 hover:bg-gray-50"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url.startsWith("http://") || student.photo_url.startsWith("https://") ? student.photo_url : `${serverUrl}${student.photo_url}${student.photo_url.includes("?") ? "&" : "?"}token=${encodeURIComponent(localStorage.getItem("token") || "")}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    {/* Short details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-950 truncate">{student.name}</p>
                      <p className="text-xs font-medium text-gray-500">{student.htno}  |  {student.branch}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Compact pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-150 pt-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Live preview Card */}
      <div className="lg:col-span-2 flex flex-col items-center justify-center rounded-2xl border border-gray-150 bg-white p-8 shadow-sm space-y-8">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">Card Preview</h3>
          <p className="text-sm text-gray-500">Live preview of student identity card output</p>
        </div>

        {selectedStudent ? (
          <div className="flex flex-col items-center space-y-6 w-full max-w-md">
            {/* CARD CONTAINER (matches PDF proportions) */}
            <div className="relative aspect-[1.6/1] w-full rounded-2xl border-2 border-slate-900 bg-white overflow-hidden shadow-xl shadow-gray-200">
              
              {/* Card Header Banner */}
              <div className="flex h-[20%] items-center justify-center bg-indigo-900 px-4">
                <div className="flex items-center gap-1.5 text-white">
                  <School className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-wider uppercase">CMR Technical Campus</span>
                </div>
              </div>

              {/* Sub-header title */}
              <div className="bg-indigo-950/10 py-1 text-center text-[8px] font-bold tracking-widest text-indigo-950 uppercase border-b border-gray-100">
                Student Identity Card
              </div>

              {/* Card Body */}
              <div className="flex h-[68%] p-4 gap-4 items-center">
                {/* Photo Column */}
                <div className="flex h-24 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 border border-gray-200 shadow-sm">
                  {selectedStudent.identification.photo_url ? (
                    <img
                      src={selectedStudent.identification.photo_url.startsWith("http://") || selectedStudent.identification.photo_url.startsWith("https://") ? selectedStudent.identification.photo_url : `${serverUrl}${selectedStudent.identification.photo_url}${selectedStudent.identification.photo_url.includes("?") ? "&" : "?"}token=${encodeURIComponent(localStorage.getItem("token") || "")}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-300" />
                  )}
                </div>

                {/* Details Column */}
                <div className="flex-1 space-y-2 min-w-0 text-left">
                  <h4 className="text-sm font-extrabold tracking-wide text-gray-950 truncate">
                    {selectedStudent.personal.first_name} {selectedStudent.personal.last_name || ""}
                  </h4>
                  <p className="text-xs font-extrabold text-indigo-700">
                    Roll No: {selectedStudent.personal.htno}
                  </p>
                  
                  <div className="space-y-0.5 text-[10px] font-semibold text-slate-600">
                    <p className="truncate">
                      Branch: {selectedStudent.academic.department_name || selectedStudent.academic.branch_code}
                    </p>
                    <p>
                      Section: {selectedStudent.academic.section_name || "N/A"}  |  Year: {selectedStudent.academic.current_year ? `Year ${selectedStudent.academic.current_year}` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signature badge overlay */}
              <div className="absolute bottom-3 right-6 flex flex-col items-center">
                <div className="h-5 w-16 border-b border-slate-300"></div>
                <span className="text-[6px] font-bold text-gray-400 mt-1 uppercase">Auth Sign</span>
              </div>
            </div>

            {/* Print trigger button */}
            <button
              onClick={downloadIdCard}
              disabled={generatingPdf}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              {generatingPdf ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate PDF ID Card
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 text-gray-400">
            <Contact className="h-16 w-16 text-gray-200 mb-3" />
            <p className="text-sm font-medium">Select a student from the directory to preview and generate their ID card.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IDCardGenerator;
