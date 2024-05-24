// postgres set up
const { Pool } = require('pg');

const pool = new Pool({
    user: 'renderer',
    host: 'tileserver',
    database: 'gis',
    password: 'renderer',
    port: 5432, // Port mapped to the PostgreSQL container
});


module.exports = pool; 