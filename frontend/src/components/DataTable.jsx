import React from "react";
import { User } from "lucide-react";

const DataTable = ({ columns, data, onRowClick }) => {
  const serverUrl = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:3000";

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-150 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className="px-6 py-4 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                No records found. Try modifying your search filters.
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.htno || idx}
                onClick={() => onRowClick && onRowClick(row)}
                className="group cursor-pointer transition-colors hover:bg-indigo-50/40"
              >
                {columns.map((col) => {
                  if (col.key === "photo") {
                    return (
                      <td key={col.key} className="whitespace-nowrap px-6 py-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100 transition-transform group-hover:scale-105">
                          {row.photo_url ? (
                            <img
                              src={row.photo_url.startsWith("http://") || row.photo_url.startsWith("https://") ? row.photo_url : `${serverUrl}${row.photo_url}${row.photo_url.includes("?") ? "&" : "?"}token=${encodeURIComponent(localStorage.getItem("token") || "")}`}
                              alt={row.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23F3F4F6%22/><text y=%22.65em%22 x=%22.25em%22 font-size=%2250%22 fill=%22%239CA3AF%22>👤</text></svg>";
                              }}
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </td>
                    );
                  }

                  if (col.key === "name") {
                    return (
                      <td key={col.key} className="whitespace-nowrap px-6 py-4 font-semibold text-gray-950">
                        {row[col.key]}
                      </td>
                    );
                  }

                  if (col.key === "branch" || col.key === "section") {
                    return (
                      <td key={col.key} className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                          col.key === "branch" ? "bg-indigo-50 text-indigo-700" : "bg-slate-50 text-slate-700"
                        }`}>
                          {row[col.key]}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={col.key} className="whitespace-nowrap px-6 py-4 text-gray-600">
                      {row[col.key] || "N/A"}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
