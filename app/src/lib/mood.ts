import pool from "./db";

export async function getMoods() {
  const [rows] = await pool.query(
    "SELECT * FROM moods"
  );

  return rows;
}