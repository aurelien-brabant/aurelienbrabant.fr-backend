const bcrypt = require("bcrypt");
const db = require("../src/database/database").pool;

// Helpers {{{

const findUserBy = async (searchBy, searchValue) => {
	const res = await db.query(
		`SELECT user_id, email, username, role, firstname, lastname, account_creation_ts, last_login_ts
		FROM user_account
		WHERE ${searchBy} = $1
		LIMIT 1
		;`,
		[searchValue]
	);

	/* no-match */

	if (!res.rows.length) {
		return null;
	}

	const row = res.rows[0];

	return {
		userId: row.user_id,
		email: row.email,
		username: row.username,
		firstname: row.firstname,
		lastname: row.lastname,
		role: row.role,
		isEmailVerified: row.is_email_verified,
		isActivated: row.is_email_activated,
		accountCreationTs: row.account_creation_ts,
		lastLoginTs: row.last_login_ts,
	};
};

// }}}


// find {{{

const findUserByEmail = async (email) => {
	return await findUserBy("email", email);
};

const findUserByUsername = async (username) => {
	return await findUserBy("username", username);
};

const findUserById = async (id) => {
	return await findUserBy("user_id", id);
};

const findUsers = async (limit = 100) => {
	const res = await db.query(
		`SELECT user_id, email, username, role
		FROM user_account
		LIMIT $1
	;`,
		[limit]
	);

	return res.rows.map((row) => ({
		userId: row.user_id,
		email: row.email,
		username: row.username,
		role: row.role,
	}));
};

// }}}

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

/**
 * @return {bool} true if targeted user has been successfully deactivated/deleted false otherwise.
 */

const removeUserById = async (id, onlyDeactivate = true) => {
	if (onlyDeactivate) {
		const res = await db.query(
			`UPDATE user_account
			SET is_activated = false
			WHERE user_id = $1
			RETURNING is_activated
		;`,
			[id]
		);

		return res.rows.length ? res.rows[0].activated : false;
	}

	const res = await db.query(`
		DELETE FROM user_account
		WHERE user_id = $1
	;`, [id]);

	return !!res.rowCount;
};

module.exports = {
	findUsers,
	findUserById,
	findUserByUsername,
	findUserByEmail,
	removeUserById,
	createUser,
};
