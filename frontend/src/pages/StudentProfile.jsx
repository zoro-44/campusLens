import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { Spinner } from "../components/Loader";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  BookOpen, 
  Camera, 
  ArrowLeft,
  Check,
  X,
  Edit2
} from "lucide-react";
import toast from "react-hot-toast";

const StudentProfile = () => {
  const { htno } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [imgError, setImgError] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [formData.identification?.photo_url]);

  const serverUrl = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:3000";

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/students/${htno}`);
      if (response.data?.success) {
        setStudent(response.data.data);
        // Initialize editing form values
        setFormData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching student details:", err);
      toast.error("Student profile not found.");
      navigate("/directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [htno]);

  // Handle image upload
  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPEG and PNG images are allowed");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("photo", file);

    setUploadingPhoto(true);
    const toastId = toast.loading("Uploading photo to Cloudinary...");

    try {
      const response = await api.post(`/students/${htno}/photo`, uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data?.success) {
        toast.success("Profile photo updated successfully!", { id: toastId });
        setStudent(prev => ({
          ...prev,
          identification: {
            ...prev.identification,
            photo_url: response.data.photo_url
          }
        }));
        setFormData(prev => ({
          ...prev,
          identification: {
            ...prev.identification,
            photo_url: response.data.photo_url
          }
        }));
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      const errMsg = err.response?.data?.error || "Failed to upload photo.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Format date helper for input type="date"
  const formatDateForInput = (dateVal) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  // Display date helper
  const formatDateForDisplay = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return "N/A";
    }
  };

  // Handle in-place editing state change
  const handleFieldChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Submit edit changes
  const handleSave = async () => {
    const toastId = toast.loading("Saving updates...");
    try {
      // Map category tab key to matching API body structure
      const tabMap = {
        personal: "personal",
        contact: "contact",
        parents: "parents",
        address: "address",
        academic: "academic",
        category: "category_info"
      };

      const apiKey = tabMap[activeTab];
      let tabPayload = { ...formData[activeTab] };

      // Formatting adjustments for specific tabs
      if (activeTab === "category") {
        tabPayload = { ...formData.category_info };
        tabPayload.income = parseInt(tabPayload.income, 10) || 0;
        tabPayload.ph_status = !!tabPayload.ph_status;
        tabPayload.scribe_required = !!tabPayload.scribe_required;
      } else if (activeTab === "academic") {
        tabPayload.current_year = parseInt(tabPayload.current_year, 10) || 1;
        tabPayload.admission_year = parseInt(tabPayload.admission_year, 10) || 2023;
        if (tabPayload.section_id) tabPayload.section_id = parseInt(tabPayload.section_id, 10);
      } else if (activeTab === "personal") {
        if (tabPayload.dob) {
          tabPayload.dob = formatDateForInput(tabPayload.dob);
        }
      }

      const body = {
        [apiKey]: tabPayload
      };

      const response = await api.put(`/students/${htno}`, body);
      if (response.data?.success) {
        toast.success("Profile updated successfully!", { id: toastId });
        setEditMode(false);
        fetchProfile();
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      const errMsg = err.response?.data?.error || "Failed to save updates.";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleCancel = () => {
    setFormData(student); // Revert
    setEditMode(false);
  };

  if (loading) {
    return <Spinner />;
  }

  if (!student) return null;

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "contact", label: "Contact Details", icon: Phone },
    { id: "parents", label: "Parents", icon: User },
    { id: "address", label: "Address", icon: MapPin },
    { id: "academic", label: "Academic Info", icon: BookOpen },
    { id: "category", label: "Category & Fees", icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/directory")}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Student Directory
      </button>

      {/* Header Profile Info */}
      <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Avatar Picture Area */}
          <div className="relative group cursor-pointer" onClick={!uploadingPhoto ? handlePhotoClick : undefined}>
            <div className="h-28 w-28 overflow-hidden rounded-2xl bg-gray-100 ring-4 ring-indigo-50 flex items-center justify-center relative">
              {formData.identification?.photo_url && !imgError ? (
                <img
                  src={formData.identification.photo_url.startsWith("http://") || formData.identification.photo_url.startsWith("https://") ? formData.identification.photo_url : `${serverUrl}${formData.identification.photo_url}${formData.identification.photo_url.includes("?") ? "&" : "?"}token=${encodeURIComponent(localStorage.getItem("token") || "")}`}
                  alt={`${student.personal.first_name}`}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <User className="h-12 w-12 text-gray-300" />
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            {/* Upload Hover overlay */}
            {!uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/jpeg,image/png,image/jpg"
              disabled={uploadingPhoto}
              className="hidden"
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {student.personal.first_name} {student.personal.last_name || ""}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {student.personal.htno}
              </span>
              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {student.academic.department_name || student.academic.branch_code}
              </span>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Sec {student.academic.section_name || "N/A"}
              </span>
            </div>
            <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="h-4 w-4" />
              {student.personal.email}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Tabs Navigation & Form content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        
        {/* Tab side items */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-150 bg-white p-4 shadow-sm h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setEditMode(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Selected tab content */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-150 bg-white p-6 shadow-sm">
          {/* Section Header Controls */}
          <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
            <h3 className="text-base font-bold text-gray-900">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>

            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: PERSONAL INFO */}
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">HTNO (Roll No)</label>
                <input
                  type="text"
                  disabled
                  value={formData.personal?.htno || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">First Name</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.personal?.first_name || ""}
                  onChange={(e) => handleFieldChange("personal", "first_name", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Last Name</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.personal?.last_name || ""}
                  onChange={(e) => handleFieldChange("personal", "last_name", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Gender</label>
                {editMode ? (
                  <select
                    value={formData.personal?.gender || "M"}
                    onChange={(e) => handleFieldChange("personal", "gender", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                ) : (
                  <p className="mt-2 text-sm font-medium text-gray-800">
                    {student.personal.gender === "M" ? "Male" : "Female"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Date of Birth</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formatDateForInput(formData.personal?.dob)}
                    onChange={(e) => handleFieldChange("personal", "dob", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-gray-800">
                    {formatDateForDisplay(student.personal.dob)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Email Address</label>
                <input
                  type="email"
                  disabled={!editMode}
                  value={formData.personal?.email || ""}
                  onChange={(e) => handleFieldChange("personal", "email", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Aadhaar Card Number</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.personal?.aadhaar_no || ""}
                  onChange={(e) => handleFieldChange("personal", "aadhaar_no", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Religion</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.personal?.religion || ""}
                  onChange={(e) => handleFieldChange("personal", "religion", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Admission Category</label>
                {editMode ? (
                  <select
                    value={formData.personal?.admission_category || "ConvenerQuota"}
                    onChange={(e) => handleFieldChange("personal", "admission_category", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ConvenerQuota">Convener Quota</option>
                    <option value="ManagementQuota">Management Quota</option>
                    <option value="SpotAdmission">Spot Admission</option>
                  </select>
                ) : (
                  <p className="mt-2 text-sm font-medium text-gray-800">
                    {student.personal.admission_category === "ConvenerQuota" ? "Convener Quota" : (student.personal.admission_category === "ManagementQuota" ? "Management Quota" : student.personal.admission_category)}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Profile Photo</label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-100 ring-2 ring-indigo-50 flex items-center justify-center shrink-0">
                    {formData.identification?.photo_url && !imgError ? (
                      <img
                        src={formData.identification.photo_url.startsWith("http://") || formData.identification.photo_url.startsWith("https://") ? formData.identification.photo_url : `${serverUrl}${formData.identification.photo_url}${formData.identification.photo_url.includes("?") ? "&" : "?"}token=${encodeURIComponent(localStorage.getItem("token") || "")}`}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors w-fit">
                      {uploadingPhoto ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        "Change Photo"
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">Supported formats: JPG, JPEG, PNG (Max 5MB)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT DETAILS */}
          {activeTab === "contact" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Mobile Number</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.contact?.mobile_no || ""}
                  onChange={(e) => handleFieldChange("contact", "mobile_no", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Alternate Mobile</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.contact?.alternate_mobile || ""}
                  onChange={(e) => handleFieldChange("contact", "alternate_mobile", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Landline Number</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.contact?.landline_no || ""}
                  onChange={(e) => handleFieldChange("contact", "landline_no", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PARENTS INFO */}
          {activeTab === "parents" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Father's Name</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.parents?.father_name || ""}
                  onChange={(e) => handleFieldChange("parents", "father_name", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Mother's Name</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.parents?.mother_name || ""}
                  onChange={(e) => handleFieldChange("parents", "mother_name", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Parent Mobile</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.parents?.parent_mobile || ""}
                  onChange={(e) => handleFieldChange("parents", "parent_mobile", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESS INFO */}
          {activeTab === "address" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Permanent Address</label>
                <textarea
                  disabled={!editMode}
                  rows={2}
                  value={formData.address?.address || ""}
                  onChange={(e) => handleFieldChange("address", "address", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">City</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.address?.city || ""}
                  onChange={(e) => handleFieldChange("address", "city", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">State</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.address?.state || ""}
                  onChange={(e) => handleFieldChange("address", "state", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Pincode</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.address?.pincode || ""}
                  onChange={(e) => handleFieldChange("address", "pincode", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {/* TAB 5: ACADEMIC INFO */}
          {activeTab === "academic" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">College Code</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.academic?.college_code || ""}
                  onChange={(e) => handleFieldChange("academic", "college_code", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Branch Code (JNTUH)</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.academic?.branch_code || ""}
                  onChange={(e) => handleFieldChange("academic", "branch_code", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Current Year</label>
                {editMode ? (
                  <select
                    value={formData.academic?.current_year || 1}
                    onChange={(e) => handleFieldChange("academic", "current_year", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                ) : (
                  <p className="mt-2 text-sm font-medium text-gray-800">
                    Year {student.academic.current_year || "N/A"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Admission Year</label>
                <input
                  type="number"
                  disabled={!editMode}
                  value={formData.academic?.admission_year || ""}
                  onChange={(e) => handleFieldChange("academic", "admission_year", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Section Name</label>
                <p className="mt-2 text-sm font-medium text-gray-800">
                  {student.academic.section_name || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Branch Display Name</label>
                <p className="mt-2 text-sm font-medium text-gray-800">
                  {student.academic.department_name || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: CATEGORY & FEES INFO */}
          {activeTab === "category" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Reservation Category</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.category_info?.reservation_type || ""}
                  onChange={(e) => handleFieldChange("category_info", "reservation_type", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="e.g. BC-B, OC, SC, ST"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Category Value</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.category_info?.category || ""}
                  onChange={(e) => handleFieldChange("category_info", "category", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Parent Income (₹)</label>
                <input
                  type="number"
                  disabled={!editMode}
                  value={formData.category_info?.income || 0}
                  onChange={(e) => handleFieldChange("category_info", "income", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!editMode}
                    checked={!!formData.category_info?.ph_status}
                    onChange={(e) => handleFieldChange("category_info", "ph_status", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-gray-700">Physically Handicapped (PH)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!editMode}
                    checked={!!formData.category_info?.scribe_required}
                    onChange={(e) => handleFieldChange("category_info", "scribe_required", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-gray-700">Scribe Required</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
