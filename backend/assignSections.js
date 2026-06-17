const db = require("./config/db");

// JNTUH alphabet sequence (skipping I and O)
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

  // Case 1: Standard numeric ending, e.g. "01" to "99"
  if (firstChar >= '0' && firstChar <= '9') {
    return parseInt(ending, 10);
  }

  // Case 2: Alphanumeric ending, e.g. "A0" to "A9" or "AA" to "AZ"
  const l1Index = alphabet.indexOf(firstChar);
  if (l1Index === -1) return NaN;

  if (secondChar >= '0' && secondChar <= '9') {
    // e.g. "A0"-"A9" -> 100-109
    return 99 + l1Index * 34 + parseInt(secondChar, 10) + 1;
  }

  const l2Index = alphabet.indexOf(secondChar);
  if (l2Index === -1) return NaN;

  // e.g. "AA"-"AZ" -> 110-133
  return 99 + l1Index * 34 + 10 + l2Index + 1;
}

async function assignSections() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("Database connection established for section assignment...");

    // Fetch all student academic profiles
    const [academics] = await connection.query(
      "SELECT academic_id, htno, current_year FROM student_academics"
    );
    console.log(`Found ${academics.length} student academic records to process.`);

    let updatedCount = 0;
    let createdSectionsCount = 0;

    for (const record of academics) {
      const { academic_id, htno, current_year } = record;
      if (!htno || htno.length < 10) {
        console.warn(`Skipping invalid HTNO: ${htno}`);
        continue;
      }

      // Parse branch code and roll number from HTNO
      // HTNO e.g. 237R1A0401 (branch: 04, roll: 01)
      const rawBranch = htno.substring(6, 8);
      const branchCode = parseInt(rawBranch, 10).toString(); // e.g. "04" -> "4", "12" -> "12"
      
      const rollNum = parseRollNumber(htno);
      if (isNaN(rollNum)) {
        console.warn(`Could not parse roll number for HTNO: ${htno}`);
        continue;
      }

      // Group by 64 students:
      // 1-64 -> Section A
      // 65-128 -> Section B
      // 129-192 -> Section C
      // etc.
      const sectionIndex = Math.floor((rollNum - 1) / 64);
      if (sectionIndex < 0) {
        console.warn(`Invalid roll number ${rollNum} for HTNO: ${htno}`);
        continue;
      }
      const sectionName = String.fromCharCode(65 + sectionIndex); // 65 is 'A'
      const year = current_year || 1;

      // Ensure the department exists in the departments table to satisfy FK constraints
      const [depts] = await connection.query(
        "SELECT department_code FROM departments WHERE department_code = ?",
        [branchCode]
      );
      if (depts.length === 0) {
        console.log(`Creating missing department code: ${branchCode}`);
        await connection.query(
          "INSERT INTO departments (department_code, department_name) VALUES (?, ?)",
          [branchCode, `Branch ${branchCode}`]
        );
      }

      // Find or create the section in the sections table
      let [sections] = await connection.query(
        "SELECT section_id FROM sections WHERE department_code = ? AND year = ? AND section_name = ?",
        [branchCode, year, sectionName]
      );

      let sectionId;
      if (sections.length > 0) {
        sectionId = sections[0].section_id;
      } else {
        console.log(`Creating section: Dept ${branchCode}, Year ${year}, Sec ${sectionName}`);
        const [insertResult] = await connection.query(
          "INSERT INTO sections (department_code, year, section_name) VALUES (?, ?, ?)",
          [branchCode, year, sectionName]
        );
        sectionId = insertResult.insertId;
        createdSectionsCount++;
      }

      // Update student_academics with the sectionId
      await connection.query(
        "UPDATE student_academics SET section_id = ? WHERE academic_id = ?",
        [sectionId, academic_id]
      );
      updatedCount++;
    }

    console.log(`Section assignment complete!`);
    console.log(`Updated academic profiles: ${updatedCount}`);
    console.log(`New sections created: ${createdSectionsCount}`);

  } catch (error) {
    console.error("Error running section assignment script:", error);
  } finally {
    if (connection) connection.release();
    await db.end();
  }
}

assignSections();
