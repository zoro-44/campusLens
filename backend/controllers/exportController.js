const ExcelJS = require("exceljs");
const Student = require("../models/studentModel");

exports.exportStudents = async (req, res, next) => {
  try {
    const { branch, section, year, gender, category, admission_category } = req.query;

    // Fetch full filtered list without pagination
    const students = await Student.findAllForExport({
      branch,
      section,
      year,
      gender,
      category,
      admission_category
    });

    // Create a new workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students Profile");

    // Define columns
    worksheet.columns = [
      { header: "S. No", key: "sno", width: 8 },
      { header: "Roll Number (HTNO)", key: "htno", width: 20 },
      { header: "First Name", key: "first_name", width: 20 },
      { header: "Last Name", key: "last_name", width: 20 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "DOB (YYYY-MM-DD)", key: "dob", width: 18 },
      { header: "Email ID", key: "email", width: 28 },
      { header: "Aadhaar Card No", key: "aadhaar_no", width: 18 },
      { header: "Religion", key: "religion", width: 15 },
      { header: "Admission Category", key: "admission_category", width: 20 },
      { header: "Mobile No", key: "mobile_no", width: 15 },
      { header: "Alternate Mobile", key: "alternate_mobile", width: 15 },
      { header: "Father Name", key: "father_name", width: 22 },
      { header: "Mother Name", key: "mother_name", width: 22 },
      { header: "Parent Mobile", key: "parent_mobile", width: 15 },
      { header: "Branch Code", key: "branch_code", width: 12 },
      { header: "Branch Name", key: "branch_name", width: 25 },
      { header: "Current Year", key: "current_year", width: 12 },
      { header: "Section", key: "section_name", width: 10 },
      { header: "Reservation Category", key: "reservation_type", width: 20 },
      { header: "Income (LPA/Class)", key: "income", width: 12 },
      { header: "PH Status", key: "ph_status", width: 10 },
      { header: "Scribe Required", key: "scribe_required", width: 15 },
      { header: "Address", key: "address", width: 40 },
      { header: "City", key: "city", width: 15 },
      { header: "State", key: "state", width: 15 },
      { header: "Pincode", key: "pincode", width: 10 },
      { header: "Identification Marks", key: "mole_marks", width: 35 }
    ];

    // Style the Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A8A" } // Dark blue
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    headerRow.height = 28;

    // Populate data
    students.forEach((student, index) => {
      // Map branch code to frontend name
      let branchName = student.department_name;
      if (!branchName) {
        const branchMappings = {
          "4": "Electronics & Communication Engineering",
          "5": "Computer Science & Engineering",
          "12": "Information Technology",
          "33": "Computer Science & Information Technology",
          "62": "Computer Science & Engineering (Cyber Security)",
          "66": "Computer Science & Engineering (Artificial Intelligence & Machine Learning)",
          "67": "Computer Science & Engineering (Data Science)",
          "73": "Artificial Intelligence & Data Science"
        };
        branchName = branchMappings[student.branch_code] || student.branch_code;
      }

      // Format date
      let dobStr = student.dob;
      if (student.dob instanceof Date) {
        dobStr = student.dob.toISOString().split("T")[0];
      }

      worksheet.addRow({
        sno: index + 1,
        htno: student.htno,
        first_name: student.first_name,
        last_name: student.last_name || "",
        gender: student.gender,
        dob: dobStr || "",
        email: student.email,
        aadhaar_no: student.aadhaar_no,
        religion: student.religion,
        admission_category: student.admission_category === "ConvenerQuota" ? "Convener Quota" : (student.admission_category === "ManagementQuota" ? "Management Quota" : student.admission_category),
        mobile_no: student.mobile_no || "",
        alternate_mobile: student.alternate_mobile || "",
        father_name: student.father_name || "",
        mother_name: student.mother_name || "",
        parent_mobile: student.parent_mobile || "",
        branch_code: student.branch_code,
        branch_name: branchName,
        current_year: student.current_year,
        section_name: student.section_name || "N/A",
        reservation_type: student.reservation_type,
        income: student.income,
        ph_status: student.ph_status ? "Yes" : "No",
        scribe_required: student.scribe_required ? "Yes" : "No",
        address: student.address || "",
        city: student.city || "",
        state: student.state || "",
        pincode: student.pincode || "",
        mole_marks: student.mole_marks || ""
      });
    });

    // Style data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      // Zebra striping
      const isEven = rowNumber % 2 === 0;
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10 };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        
        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" } // Very light slate grey
          };
        }
      });
      row.height = 20;
    });

    // Set headers and stream response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=students_export_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    next(error);
  }
};
