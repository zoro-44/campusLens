import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Search } from "lucide-react";

const FilterBar = ({ filters, onFilterChange }) => {
  const [sections, setSections] = useState([]);

  // Filter options
  const years = [1, 2, 3, 4];
  const categories = ["OC", "BC", "SC", "ST"];
  const admissionQuotas = ["Convener Quota", "Management Quota"];

  // Fetch sections when branch or year changes
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const queryParams = [];
        if (filters.branch) {
          queryParams.push(`branch=${filters.branch}`);
        }
        if (filters.year) {
          queryParams.push(`year=${filters.year}`);
        }
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
        const response = await api.get(`/sections${queryString}`);
        if (response.data?.success) {
          // Get unique section names (e.g. A, B)
          const uniqueSectionNames = [...new Set(response.data.data.map(s => s.section_name))].sort();
          setSections(uniqueSectionNames);
        }
      } catch (err) {
        console.error("Error fetching sections for filter:", err);
      }
    };
    fetchSections();
  }, [filters.branch, filters.year]);

  const handleBranchChange = (e) => {
    const deptName = e.target.value;
    onFilterChange("branch", deptName);
    // Reset section when branch changes
    onFilterChange("section", "");
  };

  return (
    <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by HTNO or Name..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Branch Dropdown */}
        <div>
          <select
            value={filters.branch || ""}
            onChange={handleBranchChange}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-950 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Branches</option>
            <option value="CSE">CSE (Computer Science)</option>
            <option value="ECE">ECE (Electronics)</option>
            <option value="IT">IT (Info Tech)</option>
            <option value="CSIT">CSIT (Comp Sci & Info Tech)</option>
            <option value="CSM">CSM (CSE - AI & ML)</option>
            <option value="CSD/AIML">CSD/AIML (CSE - Data Science/AI)</option>
            <option value="EEE">EEE (Electrical)</option>
            <option value="MECH">MECH (Mechanical)</option>
            <option value="CIVIL">CIVIL (Civil)</option>
          </select>
        </div>

        {/* Section Dropdown */}
        <div>
          <select
            value={filters.section || ""}
            disabled={!filters.branch}
            onChange={(e) => onFilterChange("section", e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-950 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All Sections</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Year Dropdown */}
        <div>
          <select
            value={filters.year || ""}
            onChange={(e) => onFilterChange("year", e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-950 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <select
            value={filters.category || ""}
            onChange={(e) => onFilterChange("category", e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-950 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced filters (Collapsible or just small row) */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Gender:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => onFilterChange("gender", filters.gender === "M" ? "" : "M")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                filters.gender === "M"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Male
            </button>
            <button
              onClick={() => onFilterChange("gender", filters.gender === "F" ? "" : "F")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                filters.gender === "F"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Female
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Quota:</span>
          <div className="flex gap-1.5">
            {admissionQuotas.map((q) => (
              <button
                key={q}
                onClick={() => onFilterChange("admission_category", filters.admission_category === q ? "" : q)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  filters.admission_category === q
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
