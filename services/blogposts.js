const db = require("../src/database/database").pool;
const matter = require("gray-matter");
const validator = require("validator");

// Because we need to parse the file using gray-matter after it has been uploaded,
// we need to perform metadata validation in the service. The validation errors, if any,
// are returned in an array, which is empty in case validation is successful.

const validateBlogpostMarkdownMetadata = (meta) => {
  const errors = [];
  const mandatoryFields = ["title", "description", "coverImagePath"];
  const pushFieldError = (field) => {
    errors.push({ field, msg: "Provided value is invalid" });
  };

  for (field of mandatoryFields) {
    if (meta[field] === undefined) {
      errors.push({
        field,
        msg: `Expected to find ${field} field in markdown meta data, but was not there`,
      });
    }
  }

  // validation of mandatory fields

  const { title, description, coverImagePath } = meta;

  if (
    typeof title !== "string" ||
    !validator.isLength(title, { min: 10, max: 100 })
  ) {
    pushFieldError("title");
  }

  if (
    typeof description !== "string" ||
    !validator.isLength(description, { min: 30, max: 300 })
  ) {
    pushFieldError("description");
  }

  if (
    typeof coverImagePath !== "string" ||
    !validator.isLength(coverImagePath, { min: 1, max: 300 })
  ) {
    pushFieldError("coverImagePath");
  }

  // validation of optional fields

  const { authorId, authorEmail, releaseTs, lastEditTs } = meta;

  if (
    authorId !== undefined &&
    (typeof authorId !== "string" || !validator.isNumeric(authorId))
  ) {
    pushFieldError("authorId");
  }

  if (
    authorEmail !== undefined &&
    (typeof authorEmail !== "string" || !validator.isEmail(authorEmail))
  ) {
    pushFieldError("authorEmail");
  }

  if (
    releaseTs !== undefined &&
    (typeof releaseTs !== "string" || !validator.isDate(releaseTs))
  ) {
    pushFieldError("releaseTs");
  }

  if (
    lastEditTs !== undefined &&
    (typeof lastEditTs !== "string" || !validator.isDate(lastEditTs))
  ) {
    pushFieldError("lastEditTs");
  }

  return errors;
};

// Will attempt to validate the post metadata, ensuring that required fields are present
// and that they are in the expected format.
// Given either the authorId or authorEmail fields, it will also attempt to find a relevant
// user to attach the post to. In case such user can't be found, no blogpost will be created in database and an error will be pushed
// into the error array, which is eventually returned.

const createBlogpostFromMarkdown = async (markdownData) => {
  const { data, content } = matter(markdownData);
  let authorId = null,
    res = null;

  const errors = validateBlogpostMarkdownMetadata(data);

  if (errors.length) {
    return errors;
  }

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
    return [
      {
        msg: "Could not attach the post to an existing user in database. Either authorId or authorEmail are not present, or these are not refering to a valid user.",
      },
    ];
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

  return [];
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

const findBlogpost = async (searchCriteria, searchValue) => {
  const res = await db.query(
    `SELECT blogpost_id, title, author_id, description, content, release_ts, last_edit_ts, cover_image_path
    FROM blogpost
    WHERE ${searchCriteria} = $1
    ;`,
    [searchValue]
  );

  if (res.rows.length == 0) {
    return null;
  }

  const row = res.rows[0];

  return {
    blogpostId: row.blogpost_id,
    title: row.title,
    description: row.description,
    authorId: row.author_id,
    content: row.content,
    releaseTs: row.release_ts,
    lastEditTs: row.last_edit_ts,
    coverImagePath: row.cover_image_path
  }
};

const findBlogpostById = (id) => {
  return findBlogpost('blogpost_id', id);
}

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

const removeBlogpostById = async (id) => {
  const res = await db.query(`
    DELETE FROM blogpost
    WHERE blogpost_id = $1
  `, [id]);

  return !!res.rowCount;
}

module.exports = {
  createBlogpost,
  findBlogposts,
  findBlogpostById,
  createBlogpostFromMarkdown,
  removeBlogpostById,
};


