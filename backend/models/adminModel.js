const db = require("../config/db");

const Admin = {
  findByUsername: async (username) => {
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );
    return rows[0] || null;
  }
};

module.exports = Admin;
