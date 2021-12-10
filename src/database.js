const pg = require('pg');

/**
 * @see https://stackoverflow.com/questions/48751505/how-can-i-choose-between-client-or-pool-for-node-postgres
 */

const pgPool = new pg.Pool();

module.exports = {
	pool: pgPool
};
