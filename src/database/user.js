const bcrypt = require("bcrypt");
const db = require("./database").pool;

const findUsers = async (limit = 100) => {
	const res = await db.query(
		`SELECT email, username, role, is_email_verified, is_activated
		FROM user_account
		LIMIT $1
	;`,
		[limit]
	);

	return res.rows.map(row => ({
		email: row.email,
		username: row.username,
		role: row.role,
		isEmailVerified: row.is_email_verified,
		isActivated: row.is_activated
	}));
};

const createUser = async (email, username, password) => {
	const hash = await bcrypt.hash(password, 10);

	const res = await db.query(
		`INSERT
		INTO user_account(email, username, password, account_creation_ts)
		VALUES ($1, $2, $3, $4)
		RETURNING email, username, account_creation_ts
	`,
		[email, username, hash, new Date()]
	);

	return {
		email,
		username,
		accountCreationTs: res.rows[0].account_creation_ts,
	};
};

module.exports = {
	findUsers,
	createUser,
};
