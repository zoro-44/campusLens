const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Student = require("../models/studentModel");
const cloudinary = require("../config/cloudinary");

// GET /api/students
exports.getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, branch, section, year, gender, category, admission_category } = req.query;

    const result = await Student.findAll(
      { search, branch, section, year, gender, category, admission_category },
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    if (result.students && Array.isArray(result.students)) {
      result.students = result.students.map(s => {
        if (s.photo_url) {
          s.photo_url = `/api/students/${s.htno}/photo`;
        }
        return s;
      });
    }

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/students/:htno
exports.getStudentByHtno = async (req, res, next) => {
  try {
    const { htno } = req.params;
    const profile = await Student.findByHtno(htno);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    if (profile.identification && profile.identification.photo_url) {
      profile.identification.photo_url = `/api/students/${htno}/photo`;
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/:htno
exports.updateStudent = async (req, res, next) => {
  try {
    const { htno } = req.params;
    
    // Partial updates inside a transaction
    await Student.updateByHtno(htno, req.body);

    res.status(200).json({
      success: true,
      message: "Student profile updated successfully"
    });
  } catch (error) {
    if (error.message === "Student not found") {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }
    next(error);
  }
};

// POST /api/students/:htno/photo
exports.uploadPhoto = async (req, res, next) => {
  try {
    const { htno } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a photo file (JPEG or PNG)"
      });
    }

    // Verify student exists
    const student = await Student.findByHtno(htno);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Fetch existing cloudinary public ID to delete old image
    const oldPublicId = await Student.getCloudinaryPublicId(htno);
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (destroyError) {
        console.error("Failed to destroy old Cloudinary image:", destroyError);
      }
    }

    // Upload to Cloudinary using stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "students",
          public_id: htno,
          overwrite: true,
          invalidate: true
        },
        (error, uploadRes) => {
          if (error) reject(error);
          else resolve(uploadRes);
        }
      );
      stream.write(req.file.buffer);
      stream.end();
    });

    const photoUrl = result.secure_url;
    const publicId = result.public_id;

    // Update DB
    await Student.updateCloudinaryPhoto(htno, photoUrl, publicId);

    res.status(200).json({
      success: true,
      message: "Photo uploaded and profile updated successfully",
      photo_url: `/api/students/${htno}/photo`
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/me/photo
exports.uploadOwnPhoto = async (req, res, next) => {
  try {
    const htno = req.user.htno;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a photo file (JPEG or PNG)"
      });
    }

    // Verify student exists
    const student = await Student.findByHtno(htno);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Fetch existing cloudinary public ID to delete old image
    const oldPublicId = await Student.getCloudinaryPublicId(htno);
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (destroyError) {
        console.error("Failed to destroy old Cloudinary image:", destroyError);
      }
    }

    // Upload to Cloudinary using stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "students",
          public_id: htno,
          overwrite: true,
          invalidate: true
        },
        (error, uploadRes) => {
          if (error) reject(error);
          else resolve(uploadRes);
        }
      );
      stream.write(req.file.buffer);
      stream.end();
    });

    const photoUrl = result.secure_url;
    const publicId = result.public_id;

    // Update DB
    await Student.updateCloudinaryPhoto(htno, photoUrl, publicId);

    res.status(200).json({
      success: true,
      message: "Photo uploaded and profile updated successfully",
      photo_url: "/api/students/me/photo"
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/students/:htno/photo (Admin Proxy)
exports.getPhoto = async (req, res, next) => {
  try {
    const { htno } = req.params;
    const student = await Student.findByHtno(htno);
    if (!student || !student.identification?.photo_url) {
      return res.status(404).json({ success: false, error: "Photo not found" });
    }

    const imageUrl = student.identification.photo_url;
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: "Failed to fetch image from storage" });
    }

    res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache for 1 day

    const { Readable } = require("stream");
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/students/me/photo (Student Proxy)
exports.getOwnPhoto = async (req, res, next) => {
  try {
    req.params.htno = req.user.htno;
    return exports.getPhoto(req, res, next);
  } catch (error) {
    next(error);
  }
};

// GET /api/students/:htno/idcard
exports.generateIdCard = async (req, res, next) => {
  try {
    const { htno } = req.params;
    const profile = await Student.findByHtno(htno);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Create a PDF Document in landscape ID card dimensions
    // 1 inch = 72 points. Standard ID card is ~3.375 x 2.125 inches. Let's make it slightly larger for better print resolution: 400x250 points
    const doc = new PDFDocument({
      size: [400, 250],
      margins: { top: 10, bottom: 10, left: 10, right: 10 }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=idcard_${htno}.pdf`);
    doc.pipe(res);

    // --- ID CARD DESIGN ---

    // Draw Outer Border
    doc.lineWidth(2)
       .rect(10, 10, 380, 230)
       .stroke("#0F172A"); // Dark grey border

    // Draw Header Banner
    doc.rect(11, 11, 378, 50)
       .fill("#1E3A8A"); // Royal Blue header

    // Header Text
    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .fontSize(16)
       .text("CAMPUS LENS ACADEMY", 0, 22, { align: "center", width: 400 });

    doc.fontSize(8)
       .font("Helvetica")
       .text("STUDENT IDENTITY CARD", 0, 42, { align: "center", width: 400 });

    // Draw Photo Area on the left
    const photoWidth = 80;
    const photoHeight = 96;
    const photoX = 30;
    const photoY = 85;

    // Check if photo exists
    let photoLoaded = false;
    if (profile.identification.photo_url) {
      const photoUrl = profile.identification.photo_url;
      try {
        if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
          const imgRes = await fetch(photoUrl);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            doc.image(buffer, photoX, photoY, { width: photoWidth, height: photoHeight });
            photoLoaded = true;
          } else {
            console.error(`Failed to fetch photo from Cloudinary (HTTP ${imgRes.status}) for PDF`);
          }
        } else {
          const fullPhotoPath = path.join(__dirname, "..", photoUrl);
          if (fs.existsSync(fullPhotoPath)) {
            doc.image(fullPhotoPath, photoX, photoY, { width: photoWidth, height: photoHeight });
            photoLoaded = true;
          }
        }
      } catch (e) {
        console.error("Failed to render student photo in PDF:", e);
      }
    }

    // Fallback if no photo
    if (!photoLoaded) {
      doc.lineWidth(1)
         .rect(photoX, photoY, photoWidth, photoHeight)
         .stroke("#94A3B8"); // Slate border
      
      doc.fillColor("#64748B")
         .font("Helvetica")
         .fontSize(9)
         .text("No Photo", photoX, photoY + 40, { align: "center", width: photoWidth });
    }

    // Draw Details on the right
    const detailsX = 135;
    const detailsY = 85;
    const lineSpacing = 16;

    doc.fillColor("#0F172A");

    // Student Name
    doc.font("Helvetica-Bold")
       .fontSize(14)
       .text(`${profile.personal.first_name} ${profile.personal.last_name || ""}`.trim().toUpperCase(), detailsX, detailsY);

    // Roll number (HTNO)
    doc.font("Helvetica-Bold")
       .fontSize(11)
       .fillColor("#1E3A8A")
       .text(`Roll No: ${profile.personal.htno}`, detailsX, detailsY + 22);

    // Details Grid
    doc.fillColor("#334155")
       .font("Helvetica")
       .fontSize(10);

    const branchName = profile.academic.department_name || profile.academic.branch_code || "N/A";
    const sectionName = profile.academic.section_name || "N/A";
    const currentYear = profile.academic.current_year ? `Year ${profile.academic.current_year}` : "N/A";

    doc.text(`Branch: ${branchName}`, detailsX, detailsY + 45, { width: 240, height: 30 });
    doc.text(`Section: ${sectionName}  |  Year: ${currentYear}`, detailsX, detailsY + 75);
    
    // Add a signature line
    doc.lineWidth(0.5)
       .moveTo(detailsX + 130, detailsY + 110)
       .lineTo(detailsX + 220, detailsY + 110)
       .stroke("#94A3B8");

    doc.fillColor("#64748B")
       .fontSize(7)
       .text("Authorized Signature", detailsX + 132, detailsY + 114);

    // Finalize the PDF
    doc.end();

  } catch (error) {
    next(error);
  }
};

// GET /api/students/me
exports.getOwnProfile = async (req, res, next) => {
  try {
    const htno = req.user.htno;
    const profile = await Student.findByHtno(htno);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    // Exclude sensitive details from student self-view
    if (profile.personal) {
      delete profile.personal.aadhaar_no;
    }
    if (profile.identification) {
      delete profile.identification.mole_marks;
    }

    if (profile.identification && profile.identification.photo_url) {
      profile.identification.photo_url = "/api/students/me/photo";
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/me
exports.updateOwnProfile = async (req, res, next) => {
  try {
    const htno = req.user.htno;
    
    // Restricted only to contact details, address details, and profile photo URL
    const allowedUpdate = {};
    if (req.body.contact) {
      allowedUpdate.contact = {};
      const contactFields = ["mobile_no", "alternate_mobile", "landline_no"];
      contactFields.forEach(field => {
        if (req.body.contact[field] !== undefined) {
          allowedUpdate.contact[field] = req.body.contact[field];
        }
      });
    }
    if (req.body.address) {
      allowedUpdate.address = {};
      const addressFields = ["address", "city", "state", "pincode"];
      addressFields.forEach(field => {
        if (req.body.address[field] !== undefined) {
          allowedUpdate.address[field] = req.body.address[field];
        }
      });
    }
    if (req.body.photo_url !== undefined) {
      allowedUpdate.identification = {
        photo_url: req.body.photo_url
      };
    }

    if (Object.keys(allowedUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Only contact, address, and profile photo details can be updated by students"
      });
    }

    await Student.updateByHtno(htno, allowedUpdate);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    if (error.message === "Student not found") {
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }
    next(error);
  }
};
