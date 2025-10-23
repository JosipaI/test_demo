const {Pool} = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'dbname_2szl',
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

module.exports = {
    query: (text, params) => {
        const start = Date.now();
        return pool.query(text, params)
            .then(res => {
                const duration = Date.now() - start;
                console.log('pg params: ', {user: process.env.DB_USER, host: process.env.DB_HOST, password: process.env.DB_PASSWORD});
                return res;
            });
    },
    pool: pool
}
