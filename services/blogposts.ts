import { pool as db } from "../src/database/database";
import matter from "gray-matter";
import validator from "validator";
import buildPatchQuery from "../src/database/buildPatchQuery";
import slugify from 'slugify';

// Because we need to parse the file using gray-matter after it has been uploaded,
// we need to perform metadata validation in the service. The validation errors, if any,
// are returned in an array, which is empty in case validation is successful.

const validateBlogpostMarkdownMetadata = (meta: any) => {
  const errors = [];
  const mandatoryFields = ["title", "description", "coverImagePath"];
  const pushFieldError = (field: string) => {
    errors.push({ field, msg: "Provided value is invalid" });
  };

  for (const field of mandatoryFields) {
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

const insertBlogostTags = async (
  blogpostId: string,
  tags: string[]
): Promise<void> => {
  let tagId: string;

  await db.query(`DELETE FROM blogpost_blogpost_tag WHERE blogpost_id = $1`, [
    blogpostId,
  ]);

  for (const tag of tags) {
    let res = await db.query(
      `SELECT blogpost_tag_id
        FROM blogpost_tag
        WHERE tag = $1`,
      [tag]
    );

    // create tag in database if this is a new tag
    if (res.rows.length === 0) {
      res = await db.query(
        `INSERT INTO blogpost_tag(tag)
                              VALUES($1)
                              RETURNING blogpost_tag_id;`,
        [tag]
      );
    }

    tagId = res.rows[0].blogpost_tag_id;

    // tag the blogpost
    await db.query(
      `INSERT INTO blogpost_blogpost_tag(blogpost_id, blogpost_tag_id)
      VALUES($1, $2);`,
      [blogpostId, tagId]
    );
  }
};

const extractBlogpostTags = async (blogpostId: string): Promise<string[]> => {
  const res = await db.query(
    `SELECT tag
      FROM blogpost_blogpost_tag
      INNER JOIN blogpost_tag
      ON blogpost_tag.blogpost_tag_id = blogpost_blogpost_tag.blogpost_tag_id
      WHERE blogpost_id = $1
    ;`,
    [blogpostId]
  );

  return res.rows.map((row) => row.tag);
};

export const getTags = async (): Promise<string[]> => {
  const res = await db.query(`SELECT tag
                             FROM blogpost_tag`);

  return res.rows.map((row) => row.tag);
};

/**
 * @description Returns estimated reading time for the given input
 * @param {string} The content to compute the estimated reading time of
 * @return {number} the estimated reading time, in _minutes_
 *
 * NOTE: Formula taken from: https://infusion.media/content-marketing/how-to-calculate-reading-time/
 */

const computeReadingTime = (input: string): number => {
  const t = input.split(" ").length / 200; // get word count

  const minutes = Math.floor(t);
  const decimal = Math.abs(t) - minutes; // extract the decimal part

  return Math.round(minutes + decimal * 0.6);
};

/**
 * Transform blogpost title into a string suitable for identification
 * - all lowercase
 * - spaces are replaced by hyphens
 *
 * Example: "Everything about the typescript transpiler" => "everything-about-the-typescript-transpiler"
 */

const findBlogpost = async (
  searchCriteria: string,
  searchValue: string,
  publicOnly: boolean = true
): Promise<BrabantApi.BlogpostData> => {
  const res = await db.query(
    `SELECT
    blogpost_id,
    string_id,
    title,
    privacy,
    author_id,
    username AS author_username,
    picture_uri AS author_picture_uri,
    description,
    content,
    release_ts,
    last_edit_ts,
    cover_image_path
    FROM blogpost
    INNER JOIN user_account
    ON user_account.user_id = blogpost.author_id
    WHERE ${searchCriteria} = $1 ${publicOnly ? 'AND privacy = \'PUBLIC\'' : ''}
    ;`,
    [searchValue]
  );

  if (res.rows.length == 0) {
    return null;
  }

  const row = res.rows[0];

  const tags = await extractBlogpostTags(res.rows[0].blogpost_id);

  return {
    blogpostId: row.blogpost_id,
    title: row.title,
    description: row.description,
    authorId: row.author_id,
    authorUsername: row.author_username,
    authorPictureURI: row.author_picture_uri,
    content: row.content,
    releaseTs: row.release_ts,
    lastEditTs: row.last_edit_ts,
    coverImagePath: row.cover_image_path,
    estimatedReadingTime: computeReadingTime(
      row.title + row.description + row.content
    ),
    stringId: row.string_id,
    tags,
    privacy: row.privacy as ('PRIVATE' | 'PUBLIC' | 'PRIVATE-PREV')
  };
};

export const hasAuthorBlogpostWithTitle = async (
  authorId: string,
  title: string
): Promise<boolean> => {
  const res = await db.query(
    `SELECT COUNT(*) AS count
                             FROM blogpost
                             WHERE author_id = $1 AND title ILIKE $2
                             ;`,
    [authorId, title]
  );

  // if count != 0 we'll return true
  return Boolean(+res.rows[0].count);
};

// Will attempt to validate the post metadata, ensuring that required fields are present
// and that they are in the expected format.
// Given either the authorId or authorEmail fields, it will also attempt to find a relevant
// user to attach the post to. In case such user can't be found, no blogpost will be created in database and an error will be pushed
// into the error array, which is eventually returned.

export const createBlogpostFromMarkdown = async (
  markdownData: string
): Promise<{ field: string; msg: string }[]> => {
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
        field: "authorId",
        msg: "Could not attach the post to an existing user in database. Either authorId or authorEmail are not present, or these are not refering to a valid user.",
      },
    ];
  }

  if (await hasAuthorBlogpostWithTitle(authorId, data.title)) {
    return [
      {
        field: "title",
        msg: `This user already has a blogpost entitled "${data.title}"`,
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
    data.lastEditTs !== undefined ? data.lastEditTs : new Date(Date.now()),
    data.tags !== undefined && Array.isArray(data.tags) ? data.tags : []
  );

  return [];
};

export const editBlogpost = async (
  blogpostId: string,
  title?: string,
  description?: string,
  content?: string,
  coverImagePath?: string,
  privacy?: string,
  tags?: string[]
) => {
  // process tags separately
  if (tags) {
    insertBlogostTags(blogpostId, tags);
  }

  const patchRes = buildPatchQuery({
    blogpost_id: blogpostId,
    title,
    description,
    content,
    cover_image_path: coverImagePath,
    privacy
  });

  console.log(patchRes);

  await db.query(
    `UPDATE blogpost ${patchRes.query} WHERE blogpost_id = $${
      patchRes.args.length + 1
    };`,
    [...patchRes.args, blogpostId]
  );
};

// TODO: watch for duplicate posts per user

export const createBlogpost = async (
  authorId: number,
  title: string,
  description: string,
  content: string,
  coverImagePath: string,
  releaseTs: Date,
  lastEditTs: Date,
  tags: string[]
): Promise<string> => {
  const res = await db.query(
    `
		INSERT INTO blogpost(string_id, author_id, title, description, content, cover_image_path, release_ts, last_edit_ts)
		VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING blogpost_id
	`,
    [
      slugify(title),
      authorId,
      title,
      description,
      content,
      coverImagePath,
      releaseTs,
      lastEditTs,
    ]
  );

  const blogpostId = res.rows[0].blogpost_id;

  // tags should always be inserted uppercase
  insertBlogostTags(
    blogpostId,
    tags.map((tag) => tag.toUpperCase())
  );

  return blogpostId;
};

export const findBlogpostById = (
  id: string,
  publicOnly: boolean = true,
): Promise<BrabantApi.BlogpostData> => {
  return findBlogpost("blogpost_id", id, publicOnly);
};

export const findBlogpostByStringId = (
  stringId: string,
): Promise<BrabantApi.BlogpostData> => {
  return findBlogpost("string_id", stringId);
};

/**
 * publicOnly is usually set to false for administrative requests.
 */

export const findBlogposts = async (
  publicOnly: boolean = true,
  limit: number = 100
): Promise<BrabantApi.BlogpostPreview[]> => {
  const res = await db.query(
    `
		SELECT
        blogpost_id,
        string_id,
        title,
        author_id,
        username as author_username,
        picture_uri as author_picture_uri,
        description,
        release_ts,
        last_edit_ts,
        cover_image_path,
        content
		FROM blogpost
        INNER JOIN user_account
        ON blogpost.author_id = user_account.user_id
    ${publicOnly ? 'WHERE privacy = \'PUBLIC\'' : ''}
		LIMIT $1
	`,
    [limit]
  );

  return await Promise.all(
    res.rows.map(async (row) => {
      const tags = await extractBlogpostTags(row.blogpost_id);

      return {
        blogpostId: row.blogpost_id,
        title: row.title,
        authorId: row.author_id,
        authorPictureURI: row.author_picture_uri,
        description: row.description,
        releaseTs: row.release_ts,
        lastEditTs: row.last_edit_ts,
        estimatedReadingTime: computeReadingTime(
          row.title + row.description + row.content
        ),
        stringId: row.string_id,
        authorUsername: row.author_username,
        tags,
        coverImagePath: row.cover_image_path
      };
    })
  );
};

export const removeBlogpostById = async (id: string) => {
  const res = await db.query(
    `
    DELETE FROM blogpost
    WHERE blogpost_id = $1
  `,
    [id]
  );

  return !!res.rowCount;
};
