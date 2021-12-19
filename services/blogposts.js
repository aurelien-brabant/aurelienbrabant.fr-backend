const db = require('../src/database/database').pool;
const fs = require('fs');

const parseMarkdownPost = (path) => {
	const content = fs.readFileSync(path);

	// parse markdown and insert a new blogpost if possible
}

const findBlogposts = async (limit = 100) => {
	const res = await db.query(`
		SELECT blogpost_id, title, author_id, description, release_ts, last_edit_ts, cover_image_path
		FROM blogpost
		LIMIT $1
	`, [limit]);

	return res.rows.map(row => ({
		blogpostId: row.blogpost_id,
		title: row.title,
		authorId: row.author_id,
		description: row.description,
		releaseTs: row.release_ts,
		lastEditTs: row.last_edit_ts
	}));
}

module.exports = {
	findBlogposts,
}
