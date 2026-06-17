const fs = require("fs");
const path = require("path");
const db = require("./config/db");

async function run() {
  const logFilePath = process.argv[2];
  if (!logFilePath) {
    console.error("Error: Please provide the path to the log file as a CLI argument.");
    process.exit(1);
  }

  if (!fs.existsSync(logFilePath)) {
    console.error(`Error: File does not exist at path "${logFilePath}"`);
    process.exit(1);
  }

  let connection;
  try {
    connection = await db.getConnection();
    console.log("Database connection established for fast bulk photo import...");

    // 1. Fetch all student HTNOs in the system
    const [studentsList] = await connection.query("SELECT htno FROM students");
    const validHtnos = new Set(studentsList.map(s => s.htno.toUpperCase()));
    console.log(`Found ${validHtnos.size} valid students in the database.`);

    // 2. Fetch all existing student_identification records
    const [idList] = await connection.query("SELECT htno FROM student_identification");
    const existingHtnos = new Set(idList.map(s => s.htno.toUpperCase()));
    console.log(`Found ${existingHtnos.size} existing rows in student_identification.`);

    // 3. Read and parse log file
    const content = fs.readFileSync(logFilePath, "utf-8");
    const lines = content.split("\n");

    const mappings = [];
    let skippedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || !line.includes("->")) {
        if (line) skippedCount++;
        continue;
      }

      const parts = line.split("->");
      if (parts.length < 2) {
        skippedCount++;
        continue;
      }

      const filename = parts[0].trim();
      const cloudinaryUrl = parts[1].trim();

      const htno = path.basename(filename, path.extname(filename)).toUpperCase();

      const match = cloudinaryUrl.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/i);
      if (!match || !match[1]) {
        console.warn(`[Line ${i + 1}] Could not parse public_id from URL: ${cloudinaryUrl}`);
        skippedCount++;
        continue;
      }
      const publicId = match[1];

      if (!validHtnos.has(htno)) {
        console.log(`[Line ${i + 1}] Skipping: Student ${htno} not found in database.`);
        skippedCount++;
        continue;
      }

      mappings.push({ htno, cloudinaryUrl, publicId });
    }

    console.log(`Parsed ${mappings.length} valid student photo mappings to import.`);

    // 4. Process in parallel batches of 100
    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
      const batch = mappings.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (m) => {
        const hasId = existingHtnos.has(m.htno);
        if (!hasId) {
          await connection.query(
            "INSERT INTO student_identification (htno, photo_url, cloudinary_public_id) VALUES (?, ?, ?)",
            [m.htno, m.cloudinaryUrl, m.publicId]
          );
        } else {
          await connection.query(
            "UPDATE student_identification SET photo_url = ?, cloudinary_public_id = ? WHERE htno = ?",
            [m.cloudinaryUrl, m.publicId, m.htno]
          );
        }
      });

      await Promise.all(promises);
      successCount += batch.length;
      console.log(`Imported ${successCount}/${mappings.length} mappings...`);
    }

    console.log("\n==========================================");
    console.log("Fast Migration Summary:");
    console.log(`Total lines processed: ${lines.length}`);
    console.log(`Successful imports: ${successCount}`);
    console.log(`Skipped/Not-found entries: ${skippedCount}`);
    console.log("==========================================");

  } catch (err) {
    console.error("Error during fast migration:", err);
  } finally {
    if (connection) connection.release();
    await db.end();
  }
}

run();
