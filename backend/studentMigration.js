const pool = require("./config/db");
const bcrypt = require("bcrypt");

async function migrate() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("Connected to database for student migration...");

    // 1. Check if column exists, if not, add it
    console.log("Checking if password_hash column exists in students table...");
    const [columns] = await connection.query("SHOW COLUMNS FROM students LIKE 'password_hash'");
    
    if (columns.length === 0) {
      console.log("Adding password_hash column to students table...");
      await connection.query("ALTER TABLE students ADD COLUMN password_hash VARCHAR(255) NULL");
      console.log("Column password_hash added successfully.");
    } else {
      console.log("password_hash column already exists.");
    }

    // 2. Fetch students who need their password_hash seeded
    console.log("Fetching students without seeded passwords...");
    const [students] = await connection.query("SELECT htno FROM students WHERE password_hash IS NULL");
    console.log(`Found ${students.length} students to update.`);

    if (students.length === 0) {
      console.log("All student passwords are already seeded. Migration complete!");
      return;
    }

    // 3. Batch seed in parallel to avoid CPU bottleneck and network latency
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(students.length / batchSize)}...`);

      await Promise.all(batch.map(async (student) => {
        try {
          // Default password is their HTNO (roll number)
          const hash = await bcrypt.hash(student.htno, 10);
          await connection.query("UPDATE students SET password_hash = ? WHERE htno = ?", [hash, student.htno]);
          updatedCount++;
        } catch (err) {
          console.error(`Error migrating student ${student.htno}:`, err.message);
        }
      }));
    }

    console.log(`Successfully migrated and seeded ${updatedCount} student default passwords! 🎉`);

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

migrate();
