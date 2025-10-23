const db = require('./index');


const createSessionTable = `
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`;

db.pool.query(createSessionTable)
  .then(() => console.log('Session table ready'))
  .catch(err => console.error('Could not create session table:', err));