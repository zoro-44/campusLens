import React, { useEffect, useState } from "react";
import api from "../api/api";
import StatCard from "../components/StatCard";
import { SkeletonCard, ChartSkeleton } from "../components/Loader";
import { 
  Users, 
  GitBranch, 
  UserCheck, 
  Accessibility, 
  TrendingUp 
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/stats/overview");
        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching overview statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ChartSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-gray-300 p-8 text-gray-500">
        Could not load dashboard statistics. Please ensure the backend server is running and try again.
      </div>
    );
  }

  // Convert stats object structures to array formats for Recharts
  const branchData = Object.entries(stats.branchDistribution)
    .map(([name, value]) => ({ name, value }))
    .filter((b) => b.value > 0);

  const categoryData = Object.entries(stats.categoryDistribution)
    .map(([name, value]) => ({ name, value }));

  const admissionData = Object.entries(stats.admissionDistribution)
    .map(([name, value]) => ({ name, value }));

  // Calculate unique active branches
  const activeBranchesCount = Object.values(stats.branchDistribution).filter(v => v > 0).length;

  return (
    <div className="space-y-8">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Students */}
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={Users}
          colorClass="indigo"
        />

        {/* Total Active Branches */}
        <StatCard
          title="Active Branches"
          value={`${activeBranchesCount} / 6`}
          icon={GitBranch}
          colorClass="emerald"
        />

        {/* Male / Female Ratio */}
        <StatCard
          title="Male / Female Ratio"
          value={`${stats.genderDistribution.M}:${stats.genderDistribution.F}`}
          icon={UserCheck}
          colorClass="amber"
        />

        {/* PH Status Count */}
        <StatCard
          title="PH Students"
          value={stats.phCount}
          icon={Accessibility}
          colorClass="rose"
        />
      </div>

      {/* Recharts Graphics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* 1. Branch-wise distribution (Pie) */}
        <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
            Branch-wise Distribution
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={branchData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {branchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Students`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Reservation Category distribution (Bar) */}
        <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
            Reservation Categories
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip formatter={(value) => [`${value} Students`, "Count"]} />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Admission Category breakdown (Donut) */}
        <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
            Admission Categories
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={admissionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {admissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Students`, "Count"]} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
