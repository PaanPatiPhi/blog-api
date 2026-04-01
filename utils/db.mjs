// db.mjs
import { Pool } from "pg";



const connectionPool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false, // Supabase ต้องการ SSL
  },
});
export default connectionPool;
