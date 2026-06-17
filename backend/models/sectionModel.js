const db = require("../config/db");

const Section = {
  findAll: async (filters = {}) => {
    let sql = "SELECT section_id, department_code, year, section_name FROM sections";
    const params = [];
    const whereClauses = [];

    if (filters.department_code) {
      whereClauses.push("department_code = ?");
      params.push(filters.department_code);
    }

    if (filters.branch) {
      const branchMap = {
        "CSE": ["5", "62", "66", "67"],
        "ECE": ["4"],
        "IT": ["12", "33"],
        "EEE": ["2"],
        "MECH": ["3"],
        "CIVIL": ["1"]
      };
      const codes = branchMap[filters.branch] || [filters.branch];
      const placeholders = codes.map(() => "?").join(", ");
      whereClauses.push(`department_code IN (${placeholders})`);
      params.push(...codes);
    }

    if (filters.year) {
      whereClauses.push("year = ?");
      params.push(parseInt(filters.year, 10));
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    sql += " ORDER BY department_code ASC, year ASC, section_name ASC";
    const [rows] = await db.query(sql, params);
    return rows;
  }
};

module.exports = Section;
