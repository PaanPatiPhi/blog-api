// db.mjs
import { Pool } from "pg";

const connectionPool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false, // Supabase ต้องการ SSL
  },
});
console.log("CONNECTION_STRING:", process.env.CONNECTION_STRING);
export default connectionPool;
