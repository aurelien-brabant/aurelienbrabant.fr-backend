const db = require("../src/database/database").pool;
const fs = require("fs");
const matter = require("gray-matter");

const userServices = require("./users");

const createBlogpostFromMarkdown = async (markdownData) => {
	const { data, content } = matter(markdownData);
	let authorId = null, res = null;

	// try by id
	if (data.authorId) {
		res = await db.query(
			`SELECT user_id
			FROM user_account
			WHERE user_id = $1
		;`,
			[data.authorId]
		);
	}

	// try by email (including the case where id lookup failed)
	if (data.authorEmail !== undefined && (!res || !authorId)) {
		res = await db.query(
			`SELECT user_id
			FROM user_account
			WHERE email = $1
		;`,
			[data.authorEmail]
		);
	}

	if (res !== null && res.rows.length === 1) {
		authorId = res.rows[0].user_id;
	}

	// we are out of luck: no valid user
	if (authorId === null) {
		throw new Error(
			"Could not find a suitable user in database to attach this blogpost to. Either the field authorId or authorEmail are expected in the metadata of the post"
		);
	}

	const expectedFields = ["title", "description", "coverImagePath"];

	for (const field of expectedFields) {
		if (data[field] === undefined) {
			throw new Error(
				`Expected required field ${field} in markdown metadata but it was not found`
			);
		}
	}

	await createBlogpost(
		authorId,
		data.title,
		data.description,
		content,
		data.coverImagePath,
		data.releaseTs !== undefined ? data.releaseTs : new Date(Date.now()),
		data.lastEditTs !== undefined ? data.lastEditTs : new Date(Date.now())
	);
};

// TODO: watch for duplicate posts per user

const createBlogpost = async (
	authorId,
	title,
	description,
	content,
	coverImagePath,
	releaseTs,
	lastEditTs
) => {
	await db.query(
		`
		INSERT INTO blogpost(author_id, title, description, content, cover_image_path, release_ts, last_edit_ts)
		VALUES($1, $2, $3, $4, $5, $6, $7)
	`,
		[
			authorId,
			title,
			description,
			content,
			coverImagePath,
			releaseTs,
			lastEditTs,
		]
	);
};

const findBlogposts = async (limit = 100) => {
	const res = await db.query(
		`
		SELECT blogpost_id, title, author_id, description, release_ts, last_edit_ts, cover_image_path
		FROM blogpost
		LIMIT $1
	`,
		[limit]
	);

	return res.rows.map((row) => ({
		blogpostId: row.blogpost_id,
		title: row.title,
		authorId: row.author_id,
		description: row.description,
		releaseTs: row.release_ts,
		lastEditTs: row.last_edit_ts,
	}));
};

module.exports = {
	createBlogpost,
	findBlogposts,
	createBlogpostFromMarkdown,
};
