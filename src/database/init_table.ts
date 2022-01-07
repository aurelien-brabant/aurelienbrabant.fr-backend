import type { SqlQuery } from './database';

/**
 * This module contains all the CREATE TABLE sql statements used to initialize the tables of the database.
 * This module exports an array that contains all these statements, in the correct order.
 */

const sqlCreateUserAccountTable: SqlQuery = `CREATE TABLE IF NOT EXISTS user_account (
		user_id				SERIAL PRIMARY KEY,
		email				VARCHAR(70) UNIQUE NOT NULL,
		username			VARCHAR(25) UNIQUE NOT NULL,
		role				SMALLINT DEFAULT 10,
		picture_uri			VARCHAR(255) NOT NULL,
		is_email_verified	BOOLEAN DEFAULT false,
		is_activated		BOOLEAN DEFAULT false,
		firstname			VARCHAR(50),
		lastname			VARCHAR(50),
		password			VARCHAR(100),
		account_creation_ts	TIMESTAMP NOT NULL,
		last_login_ts		TIMESTAMP
	);`;

const sqlCreateBlogpostTable: SqlQuery = `CREATE TABLE IF NOT EXISTS blogpost (
		blogpost_id			SERIAL PRIMARY KEY,
		string_id			VARCHAR(100) NOT NULL,
		title				VARCHAR(100) NOT NULL,
		author_id			INTEGER REFERENCES user_account(user_id) NOT NULL,
		description			VARCHAR(300) NOT NULL,
		content				TEXT NOT NULL,
		release_ts			TIMESTAMP NOT NULL,
		last_edit_ts		TIMESTAMP NOT NULL,
		cover_image_path	VARCHAR(255),
		privacy				VARCHAR(20) DEFAULT 'PRIVATE'
	);`;

const sqlCreateBlogpostCommentTable: SqlQuery = `CREATE TABLE IF NOT EXISTS blogpost_comment (
		blogpost_comment_id	SERIAL PRIMARY KEY,
		author				INTEGER REFERENCES user_account(user_id),
		guest_name			VARCHAR(25),
		up_vote				INTEGER DEFAULT 0,
		down_vote			INTEGER DEFAULT 0,
		is_approved			BOOLEAN DEFAULT false,
		approval_ts			TIMESTAMP,
		content				TEXT NOT NULL,
		post_creation_ts	TIMESTAMP NOT NULL
	);`;

const sqlCreateBlogpostTagTable: SqlQuery = `CREATE TABLE IF NOT EXISTS blogpost_tag (
		blogpost_tag_id	SERIAL PRIMARY KEY,
		tag				VARCHAR(20) UNIQUE NOT NULL
);`;

// One tag can belong to many blogposts while many blogposts can have the same tag.
// Therefore we need ManytoMany relationship through the use of an intermediary table.

const sqlCreateBlogpostToTagTable = `CREATE TABLE IF NOT EXISTS blogpost_blogpost_tag (
		blogpost_id		INTEGER REFERENCES blogpost(blogpost_id),
		blogpost_tag_id	INTEGER REFERENCES blogpost_tag(blogpost_tag_id)
);`;

/*
 * Email verification token 
 */

const sqlCreateEmailVerificationTokenTable: SqlQuery = `CREATE TABLE IF NOT EXISTS email_verification_token (
		email_verification_token_id SERIAL PRIMARY KEY,
		issuer_user_id				INTEGER REFERENCES user_account(user_id) NOT NULL,
		expiration_ts				TIMESTAMP NOT NULL,
		lifetime					INTERVAL
	);`

/*
 * Events
 */

const sqlCreateUserEventTable: SqlQuery = `CREATE TABLE IF NOT EXISTS user_event (
		user_id				INTEGER REFERENCES user_account(user_id) NOT NULL,
		tstz				TIMESTAMPTZ NOT NULL,
		payload				TEXT
	);`;

const sqlCreateUserLoginEventTable: SqlQuery = `CREATE TABLE IF NOT EXISTS user_login_event () INHERITS(user_event);`;

const sqlCreateProjectTable: SqlQuery = `CREATE TABLE IF NOT EXISTS project (
		project_id		SERIAL PRIMARY KEY,
		name			VARCHAR(100) NOT NULL UNIQUE,
		description		VARCHAR(300) NOT NULL,
		content			TEXT NOT NULL,
		start_ts		TIMESTAMP NOT NULL,
		end_ts			TIMESTAMP,
		cover_uri		VARCHAR(255) NOT NULL,
		string_id		VARCHAR(100) UNIQUE,
		privacy			VARCHAR(20) DEFAULT 'PRIVATE',
		github_link		VARCHAR(255) DEFAULT '',
		gitlab_link		VARCHAR(255) DEFAULT '',
		archive_link	VARCHAR(255) DEFAULT ''
	);`

/**
 * exp_yo => number of experience years. Not used yet.
 */

const sqlCreateTechnologyTable: SqlQuery = `CREATE TABLE IF NOT EXISTS technology (
		technology_id	SERIAL PRIMARY KEY,
		name			VARCHAR(50) UNIQUE,
		logo_uri		VARCHAR(255),
		exp_yo			SMALLINT
	);`

/**
 * One project can belong to multiple technologies
 */

const sqlCreateProjectTechnologyTable: SqlQuery = `CREATE TABLE IF NOT EXISTS project_technology (
		project_technology_id	SERIAL PRIMARY KEY,
		technology_id			INTEGER REFERENCES technology(technology_id),
		project_id				INTEGER REFERENCES project(project_id)
	);`

export default [
	sqlCreateUserAccountTable,
	
	sqlCreateBlogpostTable,
	sqlCreateBlogpostCommentTable,
	sqlCreateBlogpostTagTable,
	sqlCreateBlogpostToTagTable,

	sqlCreateEmailVerificationTokenTable,
	
	sqlCreateUserEventTable,
	sqlCreateUserLoginEventTable,

	sqlCreateProjectTable,

	sqlCreateTechnologyTable,

	sqlCreateProjectTechnologyTable
];
