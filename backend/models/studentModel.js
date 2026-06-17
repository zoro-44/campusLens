const db = require("../config/db");

const Student = {
  // GET /api/students: paginated list with filters
  findAll: async (filters = {}, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const params = [];
    const countParams = [];

    let whereClauses = [];

    const branchMap = {
      "CSE": ["5", "05"],
      "ECE": ["4", "04"],
      "IT": ["12"],
      "CSIT": ["33"],
      "CSM": ["66"],
      "CSD/AIML": ["67"],
      "EEE": ["2", "02"],
      "MECH": ["3", "03"],
      "CIVIL": ["1", "01"],
      "CSE-CS": ["62"],
      "AIDS": ["73"]
    };

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      whereClauses.push("(s.htno LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, '')) LIKE ?)");
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (filters.branch) {
      const codes = branchMap[filters.branch] || [filters.branch];
      const placeholders = codes.map(() => "?").join(", ");
      whereClauses.push(`sa.branch_code IN (${placeholders})`);
      codes.forEach(c => {
        params.push(c);
        countParams.push(c);
      });
    }
    if (filters.section) {
      whereClauses.push("sec.section_name = ?");
      params.push(filters.section);
      countParams.push(filters.section);
    }
    if (filters.year) {
      whereClauses.push("sa.current_year = ?");
      params.push(parseInt(filters.year, 10));
      countParams.push(parseInt(filters.year, 10));
    }
    if (filters.gender) {
      whereClauses.push("s.gender = ?");
      params.push(filters.gender);
      countParams.push(filters.gender);
    }
    if (filters.category) {
      if (filters.category === "BC") {
        whereClauses.push("scat.reservation_type LIKE 'BC%'");
      } else if (filters.category === "OC") {
        whereClauses.push("scat.reservation_type IN ('OC', 'EWS')");
      } else {
        whereClauses.push("scat.reservation_type = ?");
        params.push(filters.category);
        countParams.push(filters.category);
      }
    }
    if (filters.admission_category) {
      let dbVal = filters.admission_category;
      if (dbVal === "Convener Quota") dbVal = "ConvenerQuota";
      if (dbVal === "Management Quota") dbVal = "ManagementQuota";
      whereClauses.push("s.admission_category = ?");
      params.push(dbVal);
      countParams.push(dbVal);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 1. Get total count
    const countSql = `
      SELECT COUNT(DISTINCT s.htno) AS total
      FROM students s
      LEFT JOIN student_academics sa ON s.htno = sa.htno
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      LEFT JOIN student_categories scat ON s.htno = scat.htno
      ${whereSql}
    `;
    const [countRows] = await db.query(countSql, countParams);
    const total = countRows[0].total;

    // 2. Get paginated data
    const dataSql = `
      SELECT 
        s.htno,
        CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, '')) AS name,
        CASE 
          WHEN sa.branch_code IN ('5', '05') THEN 'CSE'
          WHEN sa.branch_code IN ('4', '04') THEN 'ECE'
          WHEN sa.branch_code = '12' THEN 'IT'
          WHEN sa.branch_code = '33' THEN 'CSIT'
          WHEN sa.branch_code = '66' THEN 'CSM'
          WHEN sa.branch_code = '67' THEN 'CSD/AIML'
          WHEN sa.branch_code = '62' THEN 'CSE-CS'
          WHEN sa.branch_code = '73' THEN 'AIDS'
          WHEN sa.branch_code = '2' THEN 'EEE'
          WHEN sa.branch_code = '3' THEN 'MECH'
          WHEN sa.branch_code = '1' THEN 'CIVIL'
          ELSE sa.branch_code
        END AS branch,
        sec.section_name AS section,
        s.gender,
        sc.mobile_no AS mobile,
        si.photo_url
      FROM students s
      LEFT JOIN student_academics sa ON s.htno = sa.htno
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      LEFT JOIN student_contacts sc ON s.htno = sc.htno
      LEFT JOIN student_identification si ON s.htno = si.htno
      LEFT JOIN student_categories scat ON s.htno = scat.htno
      ${whereSql}
      ORDER BY s.htno ASC
      LIMIT ? OFFSET ?
    `;
    
    // mysql2 expects numbers for limit and offset if passed as params
    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const [rows] = await db.query(dataSql, params);

    return {
      students: rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit)
    };
  },

  // GET /api/export: query full filtered dataset (no pagination)
  findAllForExport: async (filters = {}) => {
    const params = [];
    let whereClauses = [];

    const branchMap = {
      "CSE": ["5", "05"],
      "ECE": ["4", "04"],
      "IT": ["12"],
      "CSIT": ["33"],
      "CSM": ["66"],
      "CSD/AIML": ["67"],
      "EEE": ["2", "02"],
      "MECH": ["3", "03"],
      "CIVIL": ["1", "01"],
      "CSE-CS": ["62"],
      "AIDS": ["73"]
    };

    if (filters.branch) {
      const codes = branchMap[filters.branch] || [filters.branch];
      const placeholders = codes.map(() => "?").join(", ");
      whereClauses.push(`sa.branch_code IN (${placeholders})`);
      codes.forEach(c => {
        params.push(c);
      });
    }
    if (filters.section) {
      whereClauses.push("sec.section_name = ?");
      params.push(filters.section);
    }
    if (filters.year) {
      whereClauses.push("sa.current_year = ?");
      params.push(parseInt(filters.year, 10));
    }
    if (filters.gender) {
      whereClauses.push("s.gender = ?");
      params.push(filters.gender);
    }
    if (filters.category) {
      if (filters.category === "BC") {
        whereClauses.push("scat.reservation_type LIKE 'BC%'");
      } else if (filters.category === "OC") {
        whereClauses.push("scat.reservation_type IN ('OC', 'EWS')");
      } else {
        whereClauses.push("scat.reservation_type = ?");
        params.push(filters.category);
      }
    }
    if (filters.admission_category) {
      let dbVal = filters.admission_category;
      if (dbVal === "Convener Quota") dbVal = "ConvenerQuota";
      if (dbVal === "Management Quota") dbVal = "ManagementQuota";
      whereClauses.push("s.admission_category = ?");
      params.push(dbVal);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const sql = `
      SELECT 
        s.htno,
        s.first_name,
        s.last_name,
        s.gender,
        s.dob,
        s.email,
        s.aadhaar_no,
        s.religion,
        s.admission_category,
        s.created_at,
        sc.mobile_no,
        sc.alternate_mobile,
        sc.landline_no,
        sp.father_name,
        sp.mother_name,
        sp.parent_mobile,
        sadd.address,
        sadd.city,
        sadd.state,
        sadd.pincode,
        sa.college_code,
        sa.branch_code,
        sa.current_year,
        sa.admission_year,
        sec.section_name,
        dept.department_name,
        scat.reservation_type,
        scat.category,
        scat.income,
        scat.ph_status,
        scat.scribe_required,
        si.mole_marks,
        si.photo_url
      FROM students s
      LEFT JOIN student_contacts sc ON s.htno = sc.htno
      LEFT JOIN student_parents sp ON s.htno = sp.htno
      LEFT JOIN student_addresses sadd ON s.htno = sadd.htno
      LEFT JOIN student_academics sa ON s.htno = sa.htno
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      LEFT JOIN departments dept ON sa.branch_code = dept.department_code
      LEFT JOIN student_categories scat ON s.htno = scat.htno
      LEFT JOIN student_identification si ON s.htno = si.htno
      ${whereSql}
      ORDER BY s.htno ASC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  },

  // GET /api/students/:htno: full nested profile
  findByHtno: async (htno) => {
    const sql = `
      SELECT 
        s.htno, s.first_name, s.last_name, s.gender, s.dob, s.email, s.aadhaar_no, s.religion, s.admission_category, s.created_at,
        sc.mobile_no, sc.alternate_mobile, sc.landline_no,
        sp.father_name, sp.mother_name, sp.parent_mobile,
        sadd.address, sadd.city, sadd.state, sadd.pincode,
        sa.college_code, sa.branch_code, sa.current_year, sa.admission_year, sa.section_id,
        sec.section_name,
        dept.department_name,
        scat.reservation_type, scat.category, scat.income, scat.ph_status, scat.scribe_required,
        si.mole_marks, si.photo_url, si.cloudinary_public_id
      FROM students s
      LEFT JOIN student_contacts sc ON s.htno = sc.htno
      LEFT JOIN student_parents sp ON s.htno = sp.htno
      LEFT JOIN student_addresses sadd ON s.htno = sadd.htno
      LEFT JOIN student_academics sa ON s.htno = sa.htno
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      LEFT JOIN departments dept ON sa.branch_code = dept.department_code
      LEFT JOIN student_categories scat ON s.htno = scat.htno
      LEFT JOIN student_identification si ON s.htno = si.htno
      WHERE s.htno = ?
    `;
    const [rows] = await db.query(sql, [htno]);
    if (rows.length === 0) return null;

    const row = rows[0];

    return {
      personal: {
        htno: row.htno,
        first_name: row.first_name,
        last_name: row.last_name,
        gender: row.gender,
        dob: row.dob,
        email: row.email,
        aadhaar_no: row.aadhaar_no,
        religion: row.religion,
        admission_category: row.admission_category,
        created_at: row.created_at
      },
      contact: {
        mobile_no: row.mobile_no,
        alternate_mobile: row.alternate_mobile,
        landline_no: row.landline_no
      },
      parents: {
        father_name: row.father_name,
        mother_name: row.mother_name,
        parent_mobile: row.parent_mobile
      },
      address: {
        address: row.address,
        city: row.city,
        state: row.state,
        pincode: row.pincode
      },
      academic: {
        college_code: row.college_code,
        branch_code: row.branch_code,
        current_year: row.current_year,
        admission_year: row.admission_year,
        section_id: row.section_id,
        section_name: row.section_name,
        department_name: row.department_name
      },
      category_info: {
        reservation_type: row.reservation_type,
        category: row.category,
        income: row.income,
        ph_status: row.ph_status === 1 || row.ph_status === true,
        scribe_required: row.scribe_required === 1 || row.scribe_required === true
      },
      identification: {
        mole_marks: row.mole_marks,
        photo_url: row.photo_url,
        cloudinary_public_id: row.cloudinary_public_id
      }
    };
  },

  // PUT /api/students/:htno: transaction-safe partial updates
  updateByHtno: async (htno, updateData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if student exists
      const [exists] = await connection.query("SELECT htno FROM students WHERE htno = ?", [htno]);
      if (exists.length === 0) {
        throw new Error("Student not found");
      }

      // Helper to dynamically update a table
      const updateTable = async (tableName, tableFields, data) => {
        const updates = [];
        const values = [];
        
        tableFields.forEach(field => {
          if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(data[field]);
          }
        });

        if (updates.length > 0) {
          values.push(htno);
          const sql = `UPDATE ${tableName} SET ${updates.join(", ")} WHERE htno = ?`;
          await connection.query(sql, values);
        }
      };

      // 1. Update students table
      const studentFields = ["first_name", "last_name", "gender", "dob", "email", "aadhaar_no", "religion", "admission_category"];
      if (updateData.personal) {
        await updateTable("students", studentFields, updateData.personal);
      }

      // 2. Update student_contacts table
      const contactFields = ["mobile_no", "alternate_mobile", "landline_no"];
      if (updateData.contact) {
        await updateTable("student_contacts", contactFields, updateData.contact);
      }

      // 3. Update student_parents table
      const parentFields = ["father_name", "mother_name", "parent_mobile"];
      if (updateData.parents) {
        await updateTable("student_parents", parentFields, updateData.parents);
      }

      // 4. Update student_addresses table
      const addressFields = ["address", "city", "state", "pincode"];
      if (updateData.address) {
        await updateTable("student_addresses", addressFields, updateData.address);
      }

      // 5. Update student_academics table
      const academicFields = ["college_code", "branch_code", "section_id", "admission_year", "current_year"];
      if (updateData.academic) {
        await updateTable("student_academics", academicFields, updateData.academic);
      }

      // 6. Update student_categories table
      const categoryFields = ["reservation_type", "category", "income", "ph_status", "scribe_required"];
      if (updateData.category_info) {
        // Handle boolean parsing
        const categoryData = { ...updateData.category_info };
        if (categoryData.ph_status !== undefined) {
          categoryData.ph_status = categoryData.ph_status ? 1 : 0;
        }
        if (categoryData.scribe_required !== undefined) {
          categoryData.scribe_required = categoryData.scribe_required ? 1 : 0;
        }
        await updateTable("student_categories", categoryFields, categoryData);
      }

      // 7. Update student_identification table (upsert: insert row if none exists, else update)
      const identificationFields = ["mole_marks", "photo_url"];
      if (updateData.identification) {
        const [existing] = await connection.query("SELECT htno FROM student_identification WHERE htno = ?", [htno]);
        if (existing.length === 0) {
          const fields = ["htno"];
          const placeholders = ["?"];
          const values = [htno];
          
          identificationFields.forEach(field => {
            if (updateData.identification[field] !== undefined) {
              fields.push(field);
              placeholders.push("?");
              values.push(updateData.identification[field]);
            }
          });
          
          if (fields.length > 1) {
            const sql = `INSERT INTO student_identification (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`;
            await connection.query(sql, values);
          }
        } else {
          await updateTable("student_identification", identificationFields, updateData.identification);
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update only photo_url
  updatePhotoUrl: async (htno, photoUrl) => {
    const sql = "UPDATE student_identification SET photo_url = ? WHERE htno = ?";
    const [result] = await db.query(sql, [photoUrl, htno]);
    return result.affectedRows > 0;
  },

  // Fetch only cloudinary_public_id
  getCloudinaryPublicId: async (htno) => {
    const sql = "SELECT cloudinary_public_id FROM student_identification WHERE htno = ?";
    const [rows] = await db.query(sql, [htno]);
    return rows[0]?.cloudinary_public_id || null;
  },

  // Upsert photo_url and cloudinary_public_id
  updateCloudinaryPhoto: async (htno, photoUrl, publicId) => {
    const [existing] = await db.query("SELECT id FROM student_identification WHERE htno = ?", [htno]);
    if (existing.length === 0) {
      const sql = "INSERT INTO student_identification (htno, photo_url, cloudinary_public_id) VALUES (?, ?, ?)";
      await db.query(sql, [htno, photoUrl, publicId]);
    } else {
      const sql = "UPDATE student_identification SET photo_url = ?, cloudinary_public_id = ? WHERE htno = ?";
      await db.query(sql, [photoUrl, publicId, htno]);
    }
    return true;
  },

  // Find student by email (for student login)
  findByEmail: async (email) => {
    const sql = "SELECT htno, email, password_hash FROM students WHERE LOWER(email) = LOWER(?)";
    const [rows] = await db.query(sql, [email]);
    return rows[0] || null;
  },

  // Update password hash
  updatePassword: async (htno, newHash) => {
    const sql = "UPDATE students SET password_hash = ? WHERE htno = ?";
    const [result] = await db.query(sql, [newHash, htno]);
    return result.affectedRows > 0;
  }
};

module.exports = Student;
