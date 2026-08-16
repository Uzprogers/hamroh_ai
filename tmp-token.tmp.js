require("dotenv").config();
const { Client } = require("pg");
const jwt = require("jsonwebtoken");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const t = await c.query("select id from users where role='TEACHER' order by created_at asc limit 1");
  const g = await c.query("select id from groups limit 1");
  const l = await c.query("select id from lessons order by created_at desc limit 1");
  console.log(jwt.sign({ sub: t.rows[0].id, role: "TEACHER" }, process.env.JWT_SECRET, { expiresIn: "2h" }));
  console.log(g.rows[0].id); console.log(l.rows[0].id);
  await c.end();
})();
