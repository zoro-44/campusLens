import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Lock, User, AlertCircle, Mail } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const { login, studentLogin } = useAuth();
  const navigate = useNavigate();
  const [isAdminTab, setIsAdminTab] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isAdminTab) {
      if (!username || !password) {
        setError("Please fill in all fields.");
        return;
      }
      setLoading(true);
      const result = await login(username, password);
      setLoading(false);

      if (result.success) {
        toast.success("Welcome back, administrator!");
        navigate("/dashboard");
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } else {
      if (!email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      setLoading(true);
      const result = await studentLogin(email, password);
      setLoading(false);

      if (result.success) {
        toast.success("Welcome back, student!");
        navigate("/my-profile");
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            CampusLens
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Student Profile Management Portal
          </p>
        </div>

        <div className="rounded-2xl border border-gray-150 bg-white p-8 shadow-xl shadow-gray-100">
          {/* Tabs Selector */}
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setIsAdminTab(false);
                setError("");
                setPassword("");
              }}
              className={`w-1/2 rounded-md py-2 text-center text-sm font-semibold transition-all ${
                !isAdminTab
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdminTab(true);
                setError("");
                setPassword("");
              }}
              className={`w-1/2 rounded-md py-2 text-center text-sm font-semibold transition-all ${
                isAdminTab
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Administrator
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {isAdminTab ? "Admin Login" : "Student Login"}
          </h3>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Field based on Tab */}
            {isAdminTab ? (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. admin"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  College Email
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="student@college.edu"
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  isAdminTab ? "Admin Login" : "Student Login"
                )}
              </button>
            </div>
          </form>

          {/* Student Password Helper */}
          {!isAdminTab && (
            <div className="mt-6 rounded-lg bg-indigo-50 p-4 text-xs text-indigo-700 border border-indigo-100 flex items-start gap-2">
              <span className="font-semibold select-none">💡</span>
              <div>
                <span className="font-semibold">First Time Logging In?</span>
                <p className="mt-0.5 text-indigo-600 font-normal">
                  Use your official college email. Your default password is your roll number (HTNO) in uppercase.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
