import React from "react";

const StatCard = ({ title, value, icon: Icon, colorClass = "indigo" }) => {
  const colorMap = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
    sky: { bg: "bg-sky-50", text: "text-sky-600" },
  };

  const selectedColor = colorMap[colorClass] || colorMap.indigo;

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          {value}
        </h3>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedColor.bg} ${selectedColor.text}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};

export default StatCard;
