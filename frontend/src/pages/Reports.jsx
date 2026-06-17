import React, { useEffect, useState } from "react";
import api from "../api/api";
import FilterBar from "../components/FilterBar";
import { FileSpreadsheet, Download, RefreshCw, Users } from "lucide-react";
import toast from "react-hot-toast";

const Reports = () => {
  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    branch: "",
    section: "",
    year: "",
    gender: "",
    category: "",
    admission_category: "",
  });

  const [matchingCount, setMatchingCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Debounced search for query
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch count of students matching current filters
  useEffect(() => {
    const fetchMatchingCount = async () => {
      setLoadingCount(true);
      try {
        const queryParams = {
          page: 1,
          limit: 1, // Only need count, keep payload tiny
          branch: filters.branch,
          section: filters.section,
          year: filters.year,
          gender: filters.gender,
          category: filters.category,
          admission_category: filters.admission_category,
        };
        if (debouncedSearch) {
          queryParams.search = debouncedSearch;
        }

        const response = await api.get("/students", { params: queryParams });
        if (response.data?.success) {
          setMatchingCount(response.data.total);
        }
      } catch (err) {
        console.error("Error fetching filtered student count:", err);
      } finally {
        setLoadingCount(false);
      }
    };
    fetchMatchingCount();
  }, [
    debouncedSearch,
    filters.branch,
    filters.section,
    filters.year,
    filters.gender,
    filters.category,
    filters.admission_category
  ]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = async () => {
    if (matchingCount === 0) {
      toast.error("No students match your selected filters to export.");
      return;
    }

    setExporting(true);
    const toastId = toast.loading("Generating Excel spreadsheet...");

    try {
      const response = await api.get("/export", {
        params: {
          branch: filters.branch,
          section: filters.section,
          year: filters.year,
          gender: filters.gender,
          category: filters.category,
          admission_category: filters.admission_category,
          search: debouncedSearch
        },
        responseType: "blob"
      });

      // Stream download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `students_report_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Excel report exported successfully!", { id: toastId });
    } catch (err) {
      console.error("Error exporting Excel sheet:", err);
      toast.error("Failed to export report. Please try again.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtering Options */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Report Summary Card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
        <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm flex flex-col justify-between h-56">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <Users className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Filtered Cohort</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Matching Records</h3>
            <p className="text-sm text-gray-500 mt-1">Total student profiles aligned with active filters</p>
          </div>

          <div className="flex items-baseline gap-2 mt-4">
            {loadingCount ? (
              <RefreshCw className="h-7 w-7 animate-spin text-gray-400" />
            ) : (
              <span className="text-4xl font-extrabold text-gray-900">{matchingCount}</span>
            )}
            <span className="text-sm font-semibold text-gray-500">Students</span>
          </div>
        </div>

        {/* Action Export Card */}
        <div className="rounded-xl border border-gray-150 bg-indigo-50/20 p-6 shadow-sm flex flex-col justify-between h-56">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Reports</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Excel Spreadsheet Export</h3>
            <p className="text-sm text-gray-500 mt-1">Download a full `.xlsx` workbook containing complete details of all matching records.</p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || loadingCount}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
          >
            {exporting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export to Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
