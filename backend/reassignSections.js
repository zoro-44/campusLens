const db = require("./config/db");

const alphabet = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
  'W', 'X', 'Y', 'Z'
];

function parseRollNumber(htno) {
  if (!htno || htno.length < 10) return NaN;
  const ending = htno.substring(8, 10).toUpperCase();
  const firstChar = ending.charAt(0);
  const secondChar = ending.charAt(1);

  if (firstChar >= '0' && firstChar <= '9') {
    return parseInt(ending, 10);
  }

  const l1Index = alphabet.indexOf(firstChar);
  if (l1Index === -1) return NaN;

  if (secondChar >= '0' && secondChar <= '9') {
    return 99 + l1Index * 34 + parseInt(secondChar, 10) + 1;
  }

  const l2Index = alphabet.indexOf(secondChar);
  if (l2Index === -1) return NaN;

  return 99 + l1Index * 34 + 10 + l2Index + 1;
}

async function run() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("Connected to database for re-assigning sections...");

    // Disable foreign key checks for schema/data update safety
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Update department codes from '4' to '04', and '5' to '05' in all tables
    console.log("Normalizing department codes to JNTUH standard '04' and '05'...");
    await connection.query("UPDATE departments SET department_code = '04' WHERE department_code = '4'");
    await connection.query("UPDATE departments SET department_code = '05' WHERE department_code = '5'");
    await connection.query("UPDATE sections SET department_code = '04' WHERE department_code = '4'");
    await connection.query("UPDATE sections SET department_code = '05' WHERE department_code = '5'");
    await connection.query("UPDATE student_academics SET branch_code = '04' WHERE branch_code = '4'");
    await connection.query("UPDATE student_academics SET branch_code = '05' WHERE branch_code = '5'");

    // Ensure all 8 department codes exist in the departments table
    const targetDepts = [
      { code: "04", name: "Electronics & Communication Engineering" },
      { code: "05", name: "Computer Science & Engineering" },
      { code: "12", name: "Information Technology" },
      { code: "33", name: "Computer Science & Information Technology" },
      { code: "62", name: "Computer Science & Engineering (Cyber Security)" },
      { code: "66", name: "Computer Science & Engineering (Artificial Intelligence & Machine Learning)" },
      { code: "67", name: "Computer Science & Engineering (Data Science)" },
      { code: "73", name: "Artificial Intelligence & Data Science" }
    ];

    for (const d of targetDepts) {
      await connection.query(
        "INSERT INTO departments (department_code, department_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE department_name = ?",
        [d.code, d.name, d.name]
      );
    }

    // 2. Truncate sections table to rebuild sections clean
    console.log("Clearing sections table...");
    await connection.query("TRUNCATE TABLE sections");

    // 3. Fetch all student academic records
    const [academics] = await connection.query("SELECT academic_id, htno FROM student_academics");
    console.log(`Fetched ${academics.length} student academic records to process.`);

    // Group students by branch code
    const branches = {};
    for (const record of academics) {
      const htno = record.htno.toUpperCase();
      const isLE = htno.includes("R5A") || htno.startsWith("237R5A");

      // Extract branch digits
      // Regular: 237R1A0401 -> index 6,7 is 04
      // Lateral: 237R5A0401 -> index 6,7 is 04
      const branchCode = htno.substring(6, 8);

      if (!branches[branchCode]) {
        branches[branchCode] = {
          regular: [],
          lateral: []
        };
      }

      if (isLE) {
        branches[branchCode].lateral.push(record);
      } else {
        branches[branchCode].regular.push(record);
      }
    }

    let totalUpdated = 0;
    const year = 4; // All students are in 4th year

    for (const [branchCode, groups] of Object.entries(branches)) {
      console.log(`Processing branch ${branchCode}: ${groups.regular.length} regular, ${groups.lateral.length} lateral`);

      // A. Process Lateral Entry (LE) students
      if (groups.lateral.length > 0) {
        // Find or create LE section in DB
        const sectionName = "LE";
        const [secRes] = await connection.query(
          "INSERT INTO sections (department_code, year, section_name) VALUES (?, ?, ?)",
          [branchCode, year, sectionName]
        );
        const sectionId = secRes.insertId;

        for (const record of groups.lateral) {
          await connection.query(
            "UPDATE student_academics SET section_id = ?, current_year = ?, admission_year = 2024 WHERE academic_id = ?",
            [sectionId, year, record.academic_id]
          );
          totalUpdated++;
        }
        console.log(`  Assigned ${groups.lateral.length} lateral entry students to Section LE.`);
      }

      // B. Process Regular students sequentially in blocks of 64
      if (groups.regular.length > 0) {
        // Parse and sort regular students by roll number
        const sortedRegular = groups.regular.map(r => ({
          ...r,
          roll: parseRollNumber(r.htno)
        })).sort((a, b) => a.roll - b.roll);

        // Map containing section name -> sectionId
        const sectionMap = {};

        for (let i = 0; i < sortedRegular.length; i++) {
          const record = sortedRegular[i];
          const blockIdx = Math.floor(i / 64);
          const sectionName = String.fromCharCode(65 + blockIdx); // 'A', 'B', 'C', etc.

          let sectionId = sectionMap[sectionName];
          if (!sectionId) {
            const [secRes] = await connection.query(
              "INSERT INTO sections (department_code, year, section_name) VALUES (?, ?, ?)",
              [branchCode, year, sectionName]
            );
            sectionId = secRes.insertId;
            sectionMap[sectionName] = sectionId;
            console.log(`  Created section ${sectionName} for branch ${branchCode}`);
          }

          await connection.query(
            "UPDATE student_academics SET section_id = ?, current_year = ?, admission_year = 2023 WHERE academic_id = ?",
            [sectionId, year, record.academic_id]
          );
          totalUpdated++;
        }
        console.log(`  Assigned ${groups.regular.length} regular students to sections.`);
      }
    }

    console.log(`\nRe-assignment complete! Total student academic profiles updated: ${totalUpdated}`);

  } catch (err) {
    console.error("Error during section reassignment:", err);
  } finally {
    if (connection) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      connection.release();
    }
    await db.end();
  }
}

run();
