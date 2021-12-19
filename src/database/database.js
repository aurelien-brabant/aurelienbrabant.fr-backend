const pg = require("pg");

/**
 * @see https://stackoverflow.com/questions/48751505/how-can-i-choose-between-client-or-pool-for-node-postgres
 */

const pgPool = new pg.Pool();

const initialize = async () => {
	for (const sqlCreateTable of require("./init_table")) {
		try {
			await pgPool.query(sqlCreateTable);
		} catch (e) {
			console.error(e);
		}
	}
};

module.exports = {
	pool: pgPool,
	initialize,
};
