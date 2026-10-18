
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
 ssl: {
  rejectUnauthorized: true,
  // Keep certificate verification enabled.
},
});


pool.query(`
  SELECT
    current_database() AS database_name,
    current_user AS database_user,
    inet_server_addr()::text AS server_address
`)
  .then((result) => {
    console.log("Backend database:", result.rows[0]);
  })
  .catch((error) => {
    console.error("Database check failed:", error.message);
  });
module.exports = pool;
