const fs = require("fs");
const path = require("path");
const readline = require("readline");
const db = require("./config/db");

async function importPhotos() {
  const logFilePath = process.argv[2];
  if (!logFilePath) {
    console.error("Error: Please provide the path to the log file as a CLI argument.");
    console.error("Usage: node importPhotos.js <path_to_log_file>");
    process.exit(1);
  }

  if (!fs.existsSync(logFilePath)) {
    console.error(`Error: File does not exist at path "${logFilePath}"`);
    process.exit(1);
  }

  let connection;
  try {
    connection = await db.getConnection();
    console.log("Database connection established for bulk photo import...");

    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let successCount = 0;
    let skippedCount = 0;
    let totalLines = 0;

    for await (const line of rl) {
      totalLines++;
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.includes("->")) {
        skippedCount++;
        continue;
      }

      const parts = trimmedLine.split("->");
      if (parts.length < 2) {
        skippedCount++;
        continue;
      }

      const filename = parts[0].trim();
      const cloudinaryUrl = parts[1].trim();

      // Extract htno (filename without extension)
      const htno = path.basename(filename, path.extname(filename)).toUpperCase();

      // Extract public ID from cloudinary url
      // e.g. https://res.cloudinary.com/<cloud_name>/image/upload/v1781537905/students/237R1A0401.jpg
      const match = cloudinaryUrl.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/i);
      if (!match || !match[1]) {
        console.warn(`[Line ${totalLines}] Could not extract public_id from URL: ${cloudinaryUrl}`);
        skippedCount++;
        continue;
      }
      const publicId = match[1];

      // Verify if student exists in the students table
      const [students] = await connection.query(
        "SELECT htno FROM students WHERE htno = ?",
        [htno]
      );

      if (students.length === 0) {
        console.log(`[Line ${totalLines}] Skipping: Student ${htno} not found in database.`);
        skippedCount++;
        continue;
      }

      // Upsert into student_identification
      const [existing] = await connection.query(
        "SELECT id FROM student_identification WHERE htno = ?",
        [htno]
      );

      if (existing.length === 0) {
        await connection.query(
          "INSERT INTO student_identification (htno, photo_url, cloudinary_public_id) VALUES (?, ?, ?)",
          [htno, cloudinaryUrl, publicId]
        );
      } else {
        await connection.query(
          "UPDATE student_identification SET photo_url = ?, cloudinary_public_id = ? WHERE htno = ?",
          [cloudinaryUrl, publicId, htno]
        );
      }

      successCount++;
    }

    console.log("\n==========================================");
    console.log("Migration Summary:");
    console.log(`Total lines processed: ${totalLines}`);
    console.log(`Successful imports: ${successCount}`);
    console.log(`Skipped/Not-found entries: ${skippedCount}`);
    console.log("==========================================");

  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    if (connection) connection.release();
    await db.end();
  }
}

importPhotos();
