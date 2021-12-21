import { Pool as pgPool } from 'pg';
import sqlTables from './init_table';

export type SqlQuery = string;

/**
 * On why I did use pg.Pool instead of pg.Client:
 * @see https://stackoverflow.com/questions/48751505/how-can-i-choose-between-client-or-pool-for-node-postgres
 */

export const pool = new pgPool();

export const initialize = async () => {
	for (const sqlCreateTable of sqlTables) {
		try {
			await pool.query(sqlCreateTable);
		} catch (e) {
			console.error(e);
		}
	}
};
