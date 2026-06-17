const pool = require("./config/db");
const bcrypt = require("bcrypt");

const DEPARTMENTS = [
  { code: "4", name: "Electronics & Communication Engineering" },
  { code: "5", name: "Computer Science & Engineering" },
  { code: "12", name: "Information Technology" },
  { code: "33", name: "Computer Science & Information Technology" },
  { code: "62", name: "Computer Science & Engineering (Cyber Security)" },
  { code: "66", name: "Computer Science & Engineering (Artificial Intelligence & Machine Learning)" },
  { code: "67", name: "Computer Science & Engineering (Data Science)" },
  { code: "73", name: "Artificial Intelligence & Data Science" }
];

async function setup() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("Database connection established for setup...");

    // 1. Create admins table
    console.log("Creating admins table if not exists...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Seed default admin
    const [admins] = await connection.query("SELECT * FROM admins WHERE username = 'admin'");
    if (admins.length === 0) {
      console.log("Seeding default admin...");
      const passwordHash = await bcrypt.hash("admin123", 10);
      await connection.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", ["admin", passwordHash]);
      console.log("Default admin seeded: admin / admin123");
    } else {
      console.log("Admin account already exists.");
    }

    // 3. Seed departments
    console.log("Seeding departments...");
    for (const dept of DEPARTMENTS) {
      await connection.query(`
        INSERT INTO departments (department_code, department_name)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE department_name = ?
      `, [dept.code, dept.name, dept.name]);
    }
    console.log("Departments seeded successfully.");

    // 4. Seed sections
    console.log("Seeding sections (Years 1-4, Sections A, B, C)...");
    const sectionNames = ["A", "B", "C"];
    const years = [1, 2, 3, 4];

    // Check if sections are already seeded
    const [existingSections] = await connection.query("SELECT COUNT(*) as count FROM sections");
    if (existingSections[0].count === 0) {
      for (const dept of DEPARTMENTS) {
        for (const year of years) {
          for (const secName of sectionNames) {
            await connection.query(`
              INSERT INTO sections (department_code, year, section_name)
              VALUES (?, ?, ?)
            `, [dept.code, year, secName]);
          }
        }
      }
      console.log("Sections seeded successfully.");
    } else {
      console.log("Sections already populated.");
    }

    // 5. Fetch sections map
    const [sectionsList] = await connection.query("SELECT * FROM sections");
    const sectionsMap = {}; // key: dept_year_name -> val: section_id
    sectionsList.forEach(sec => {
      const key = `${sec.department_code}_${sec.year}_${sec.section_name}`;
      sectionsMap[key] = sec.section_id;
    });

    // 6. Update student academics to distribute them
    console.log("Updating and distributing students across years and sections...");
    const [academics] = await connection.query("SELECT academic_id, htno, branch_code FROM student_academics");
    console.log(`Found ${academics.length} student academic records to update.`);

    let updatedCount = 0;
    for (let i = 0; i < academics.length; i++) {
      const record = academics[i];
      
      // Determine year: 1 to 4
      const currentYear = (i % 4) + 1;
      const admissionYear = 2026 - currentYear;
      
      // Determine section name: A, B, C
      const sectionName = sectionNames[i % sectionNames.length];
      
      // Find matching section_id
      const key = `${record.branch_code}_${currentYear}_${sectionName}`;
      const sectionId = sectionsMap[key];

      if (sectionId) {
        await connection.query(`
          UPDATE student_academics
          SET section_id = ?, admission_year = ?, current_year = ?
          WHERE academic_id = ?
        `, [sectionId, admissionYear, currentYear, record.academic_id]);
        updatedCount++;
      } else {
        console.warn(`No section found for key: ${key}`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} student academic profiles.`);
    console.log("Database setup complete! 🎉");

  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

setup();
