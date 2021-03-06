import bcrypt from "bcrypt";
import { pool as db } from "../src/database/database";

// Helpers {{{

const findUserBy = async (searchBy: string, searchValue: string): Promise<BrabantApi.UserData> => {
	const res = await db.query(
		`SELECT user_id, email, username, role, picture_uri, firstname, lastname, account_creation_ts, last_login_ts
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
		pictureURI: row.picture_uri,
		role: row.role,
		isEmailVerified: row.is_email_verified,
		isActivated: row.is_email_activated,
		accountCreationTs: row.account_creation_ts,
		lastLoginTs: row.last_login_ts,
	};
};

// }}}

// find {{{

export const findUserByEmail = async (email: string) => {
	return await findUserBy("email", email);
};

export const findUserByUsername = async (username: string) => {
	return await findUserBy("username", username);
};

export const findUserById = async (id: string) => {
	return await findUserBy("user_id", id);
};

export const findUsers = async (limit: number = 100): Promise<BrabantApi.UserPreview[]> => {
	const res = await db.query(
		`SELECT user_id, email, username, picture_uri, role
		FROM user_account
		LIMIT $1
	;`,
		[limit]
	);

	return res.rows.map((row) => ({
		userId: row.user_id,
		email: row.email,
		username: row.username,
		pictureURI: row.picture_uri,
		role: row.role,
	}));
};

// }}}

export const createUser = async (email: string, username: string, password: string, pictureURI: string): Promise<BrabantApi.CreateUserRet> => {
	const hash = await bcrypt.hash(password, 10);

	const res = await db.query(
		`INSERT
		INTO user_account(email, username, password, picture_uri, account_creation_ts)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING email, username, account_creation_ts
	`,
		[email, username, hash, pictureURI, new Date()]
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

export const removeUserById = async (id: number, onlyDeactivate: boolean = true): Promise<boolean> => {
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
