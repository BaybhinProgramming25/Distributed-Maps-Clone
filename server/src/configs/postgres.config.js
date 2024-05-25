// postgres set up
const { Pool } = require('pg');

const pool = new Pool({
    user: 'renderer',
    host: 'maps-clone_tileserver_1',
    database: 'gis',
    password: 'renderer',
    port: 5432, // Port mapped to the PostgreSQL container
});


module.exports = pool; 