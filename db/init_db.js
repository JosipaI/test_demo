const db = require('./index');


const createSessionTable = `
CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE TABLE IF NOT EXISTS rounds (
  rounds_id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  numbers INTEGER[],
  creation_time TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  rounds_id INTEGER REFERENCES rounds(rounds_id),
  user_email TEXT,
  user_id VARCHAR(20),
  numbers TEXT,
  uuid_code UUID DEFAULT gen_random_uuid(),
  creation_time TIMESTAMP DEFAULT NOW()
);
`;

db.pool.query(createSessionTable)
  .then(() => console.log('Session table ready'))
  .catch(err => console.error('Could not create session table:', err));