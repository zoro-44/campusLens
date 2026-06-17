const db = require("../config/db");

const Department = {
  findAll: async () => {
    const [rows] = await db.query(
      "SELECT department_code, department_name FROM departments ORDER BY department_name ASC"
    );
    return rows;
  }
};

module.exports = Department;
