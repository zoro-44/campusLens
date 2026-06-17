import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import FilterBar from "../components/FilterBar";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/Loader";

const Directory = () => {
  const navigate = useNavigate();
  
  // Local state for filters
  const [filters, setFilters] = useState({
    search: "",
    branch: "",
    section: "",
    year: "",
    gender: "",
    category: "",
    admission_category: "",
  });

  // State for debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setCurrentPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch student records on filter/page change
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const queryParams = {
          page: currentPage,
          limit: 100,
          branch: filters.branch,
          section: filters.section,
          year: filters.year,
          gender: filters.gender,
          category: filters.category,
          admission_category: filters.admission_category,
        };

        // If search is active, inject it
        if (debouncedSearch) {
          queryParams.search = debouncedSearch;
        }

        const response = await api.get("/students", { params: queryParams });
        if (response.data?.success) {
          setStudents(response.data.students);
          setTotalPages(response.data.pages);
          setTotalCount(response.data.total);
        }
      } catch (err) {
        console.error("Error fetching students directory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [
    currentPage,
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
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleRowClick = (student) => {
    navigate(`/students/${student.htno}`);
  };

  const columns = [
    { header: "Photo", key: "photo" },
    { header: "Roll No (HTNO)", key: "htno" },
    { header: "Name", key: "name" },
    { header: "Branch", key: "branch" },
    { header: "Section", key: "section" },
    { header: "Gender", key: "gender" },
    { header: "Mobile No", key: "mobile" }
  ];

  return (
    <div className="space-y-6">
      {/* Filtering Header Panel */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Directory Statistics */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Showing <span className="text-gray-900 font-semibold">{students.length}</span> of{" "}
          <span className="text-gray-900 font-semibold">{totalCount}</span> total students
        </span>
      </div>

      {/* Results Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} data={students} onRowClick={handleRowClick} />
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};

export default Directory;
