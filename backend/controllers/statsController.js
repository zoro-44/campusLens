const db = require("../config/db");

exports.getOverview = async (req, res, next) => {
  try {
    // Run all stats queries in parallel for efficiency
    const [
      [totalRows],
      [branchRows],
      [genderRows],
      [categoryRows],
      [admissionRows],
      [phRows]
    ] = await Promise.all([
      // 1. Total Student Count
      db.query("SELECT COUNT(*) as count FROM students"),

      // 2. Branch-wise count (mapped to frontend names)
      db.query(`
        SELECT branch, COUNT(*) as count FROM (
          SELECT 
            CASE 
              WHEN branch_code IN ('5', '62', '66', '67') THEN 'CSE'
              WHEN branch_code = '4' THEN 'ECE'
              WHEN branch_code IN ('12', '33') THEN 'IT'
              WHEN branch_code = '2' THEN 'EEE'
              WHEN branch_code = '3' THEN 'MECH'
              WHEN branch_code = '1' THEN 'CIVIL'
              ELSE 'OTHER'
            END AS branch
          FROM student_academics
        ) t GROUP BY branch
      `),

      // 3. Gender distribution
      db.query("SELECT gender, COUNT(*) as count FROM students GROUP BY gender"),

      // 4. Reservation category distribution (mapped to OC, BC, SC, ST)
      db.query(`
        SELECT category, COUNT(*) as count FROM (
          SELECT 
            CASE 
              WHEN reservation_type LIKE 'BC%' THEN 'BC'
              WHEN reservation_type IN ('OC', 'EWS') THEN 'OC'
              WHEN reservation_type = 'SC' THEN 'SC'
              WHEN reservation_type = 'ST' THEN 'ST'
              ELSE 'OTHER'
            END AS category
          FROM student_categories
        ) t GROUP BY category
      `),

      // 5. Admission category breakdown
      db.query("SELECT admission_category as admissionType, COUNT(*) as count FROM students GROUP BY admission_category"),

      // 6. PH status count
      db.query("SELECT COUNT(*) as count FROM student_categories WHERE ph_status = 1")
    ]);

    // Format branch distribution
    const branchDistribution = {};
    const branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];
    branches.forEach(b => { branchDistribution[b] = 0; });
    branchRows.forEach(row => {
      if (row.branch !== "OTHER") {
        branchDistribution[row.branch] = row.count;
      }
    });

    // Format gender distribution and calculate ratio
    let maleCount = 0;
    let femaleCount = 0;
    genderRows.forEach(row => {
      if (row.gender === "M") maleCount = row.count;
      if (row.gender === "F") femaleCount = row.count;
    });

    // Format reservation categories
    const categoryDistribution = { OC: 0, BC: 0, SC: 0, ST: 0 };
    categoryRows.forEach(row => {
      if (categoryDistribution[row.category] !== undefined) {
        categoryDistribution[row.category] = row.count;
      }
    });

    // Format admission categories
    const admissionDistribution = {};
    admissionRows.forEach(row => {
      // Clean up name mapping for frontend (e.g. ConvenerQuota -> Convener Quota)
      let label = row.admissionType;
      if (label === "ConvenerQuota") label = "Convener Quota";
      if (label === "ManagementQuota") label = "Management Quota";
      admissionDistribution[label] = row.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents: totalRows[0].count,
        branchDistribution,
        genderDistribution: {
          M: maleCount,
          F: femaleCount
        },
        genderRatio: {
          malePercentage: totalRows[0].count > 0 ? parseFloat(((maleCount / totalRows[0].count) * 100).toFixed(2)) : 0,
          femalePercentage: totalRows[0].count > 0 ? parseFloat(((femaleCount / totalRows[0].count) * 100).toFixed(2)) : 0
        },
        categoryDistribution,
        admissionDistribution,
        phCount: phRows[0].count
      }
    });

  } catch (error) {
    next(error);
  }
};
