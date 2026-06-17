import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Spinner } from "../components/Loader";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  BookOpen, 
  Check, 
  X, 
  Edit2 
} from "lucide-react";
import toast from "react-hot-toast";

const getDirectImageUrl = (url) => {
  if (!url) return "";
  
  let match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  }
  if (!match) {
    match = url.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);
  }
  
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  
  return url;
};

const MyProfile = () => {
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
      const response = await api.get("/students/me");
      if (response.data?.success) {
        setStudent(response.data.data);
        setFormData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching own profile:", err);
      toast.error("Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filetypes = /jpeg|jpg|png/i;
    const isImage = filetypes.test(file.type) || filetypes.test(file.name);
    if (!isImage) {
      toast.error("Only JPEG and PNG image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5MB.");
      return;
    }

    setUploadingPhoto(true);
    const toastId = toast.loading("Uploading photo to Cloudinary...");
    try {
      const formDataObj = new FormData();
      formDataObj.append("photo", file);

      const response = await api.put("/students/me/photo", formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
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

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const handleFieldChange = (category, field, value) => {
    let finalValue = value;
    if (category === "identification" && field === "photo_url") {
      finalValue = getDirectImageUrl(value);
    }
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: finalValue
      }
    }));
  };

  const handleSave = async () => {
    const toastId = toast.loading("Saving changes...");
    try {
      const allowedCategories = ["contact", "address"];
      if (!allowedCategories.includes(activeTab)) {
        toast.error("You are not allowed to update this category.", { id: toastId });
        return;
      }

      const body = {
        [activeTab]: formData[activeTab]
      };

      const response = await api.put("/students/me", body);
      if (response.data?.success) {
        toast.success("Profile details updated successfully!", { id: toastId });
        setEditMode(false);
        fetchProfile();
      }
    } catch (err) {
      console.error("Error saving profile changes:", err);
      const errMsg = err.response?.data?.error || "Failed to save updates.";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setEditMode(false);
  };

  if (loading) {
    return <Spinner />;
  }

  if (!student) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <p className="text-gray-500 font-medium">Failed to load profile. Please try again later.</p>
      </div>
    );
  }

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "contact", label: "Contact Details", icon: Phone },
    { id: "parents", label: "Parents Info", icon: User },
    { id: "address", label: "Address Details", icon: MapPin },
    { id: "academic", label: "Academic Info", icon: BookOpen },
    { id: "category", label: "Category & Fees", icon: Award },
  ];

  // Only contact and address tabs are editable by the student
  const isEditableTab = activeTab === "contact" || activeTab === "address";

  return (
    <div className="space-y-6">
      {/* Header Profile Info */}
      <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Avatar Picture Area with live preview and broken URL fallback */}
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-2xl bg-gray-100 ring-4 ring-indigo-50 flex items-center justify-center">
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
            </div>
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
                {student.academic?.department_name || student.academic?.branch_code || "JNTUH"}
              </span>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Sec {student.academic?.section_name || "N/A"}
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

            {isEditableTab && (
              !editMode ? (
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
              )
            )}
          </div>

          {/* TAB 1: PERSONAL INFO (READ-ONLY) */}
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
                  disabled
                  value={formData.personal?.first_name || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Last Name</label>
                <input
                  type="text"
                  disabled
                  value={formData.personal?.last_name || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Gender</label>
                <input
                  type="text"
                  disabled
                  value={student.personal?.gender === "M" ? "Male" : "Female"}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Date of Birth</label>
                <input
                  type="text"
                  disabled
                  value={formatDateForDisplay(student.personal?.dob)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={formData.personal?.email || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Religion</label>
                <input
                  type="text"
                  disabled
                  value={formData.personal?.religion || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Admission Category</label>
                <input
                  type="text"
                  disabled
                  value={
                    student.personal?.admission_category === "ConvenerQuota" 
                      ? "Convener Quota" 
                      : (student.personal?.admission_category === "ManagementQuota" 
                          ? "Management Quota" 
                          : student.personal?.admission_category || "")
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-250 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-555 uppercase">Profile Photo</label>
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

          {/* TAB 2: CONTACT DETAILS (EDITABLE) */}
          {activeTab === "contact" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Mobile Number</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.contact?.mobile_no || ""}
                  onChange={(e) => handleFieldChange("contact", "mobile_no", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-550 uppercase">Alternate Mobile</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.contact?.alternate_mobile || ""}
                  onChange={(e) => handleFieldChange("contact", "alternate_mobile", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-550 uppercase">Landline Number</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.contact?.landline_no || ""}
                  onChange={(e) => handleFieldChange("contact", "landline_no", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PARENTS INFO (READ-ONLY) */}
          {activeTab === "parents" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Father's Name</label>
                <input
                  type="text"
                  disabled
                  value={formData.parents?.father_name || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-250 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Mother's Name</label>
                <input
                  type="text"
                  disabled
                  value={formData.parents?.mother_name || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-250 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Parent Mobile</label>
                <input
                  type="text"
                  disabled
                  value={formData.parents?.parent_mobile || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-250 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESS INFO (EDITABLE) */}
          {activeTab === "address" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-550 uppercase">Permanent Address</label>
                <textarea
                  disabled={!editMode}
                  rows={2}
                  value={formData.address?.address || ""}
                  onChange={(e) => handleFieldChange("address", "address", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-550 uppercase">City</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.address?.city || ""}
                  onChange={(e) => handleFieldChange("address", "city", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-550 uppercase">State</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.address?.state || ""}
                  onChange={(e) => handleFieldChange("address", "state", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-550 uppercase">Pincode</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.address?.pincode || ""}
                  onChange={(e) => handleFieldChange("address", "pincode", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          )}

          {/* TAB 5: ACADEMIC INFO (READ-ONLY) */}
          {activeTab === "academic" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">College Code</label>
                <input
                  type="text"
                  disabled
                  value={formData.academic?.college_code || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Branch Code</label>
                <input
                  type="text"
                  disabled
                  value={formData.academic?.branch_code || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Department</label>
                <input
                  type="text"
                  disabled
                  value={formData.academic?.department_name || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Section</label>
                <input
                  type="text"
                  disabled
                  value={formData.academic?.section_name || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Admission Year</label>
                <input
                  type="text"
                  disabled
                  value={formData.academic?.admission_year || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Current Year</label>
                <input
                  type="text"
                  disabled
                  value={formData.academic?.current_year || ""}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* TAB 6: CATEGORY & FEES (READ-ONLY) */}
          {activeTab === "category" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Reservation Type</label>
                <input
                  type="text"
                  disabled
                  value={formData.category_info?.reservation_type || "OC"}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Social Category</label>
                <input
                  type="text"
                  disabled
                  value={formData.category_info?.category || "OC"}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase">Family Income (Annual)</label>
                <input
                  type="text"
                  disabled
                  value={`₹ ${(formData.category_info?.income || 0).toLocaleString()}`}
                  className="mt-1 block w-full rounded-lg border border-gray-255 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col justify-center gap-2 mt-4 sm:col-span-2">
                <label className="relative flex items-center gap-3 cursor-not-allowed">
                  <input
                    type="checkbox"
                    disabled
                    checked={!!formData.category_info?.ph_status}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-700">Physically Handicapped (PH) Status</span>
                </label>

                <label className="relative flex items-center gap-3 cursor-not-allowed mt-2">
                  <input
                    type="checkbox"
                    disabled
                    checked={!!formData.category_info?.scribe_required}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-700">Scribe Required for Exams</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
