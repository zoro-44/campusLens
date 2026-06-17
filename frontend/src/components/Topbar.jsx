import React from "react";
import { useAuth } from "../context/AuthContext";
import { User, School, Menu } from "lucide-react";

const Topbar = ({ title = "Overview", onToggleSidebar }) => {
  const { user, role } = useAuth();

  const roleLabel = role === "student" ? "Student" : "Administrator";
  const displayName = role === "student" ? user?.email : user?.username || "Admin";

  return (
    <header className="fixed right-0 top-0 z-10 flex h-16 w-full md:w-[calc(100%-16rem)] items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 shadow-sm">
      {/* Page Title & Institution */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onToggleSidebar}
          className="mr-1 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <School className="h-5 w-5 text-gray-400 hidden sm:block" />
        <span className="text-sm font-semibold text-gray-500 hidden sm:block">CMR Technical Campus</span>
        <span className="text-gray-300 hidden sm:block">/</span>
        <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">{title}</h1>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{roleLabel}</span>
          <span className="text-sm font-medium text-gray-800 truncate max-w-[100px] sm:max-w-none">{displayName}</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
