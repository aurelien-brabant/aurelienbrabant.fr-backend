import slugify from "slugify";
import buildPatchQuery from "../src/database/buildPatchQuery";
import { pool as db } from "../src/database/database";

const extractTechnologies = async (
  projectId: string
): Promise<BrabantApi.Technology[]> => {
  const res = await db.query(
    `SELECT technology.technology_id, technology.name, technology.logo_uri FROM project_technology
      INNER JOIN technology
      ON project_technology.technology_id = technology.technology_id
      WHERE project_id = $1;`,
    [projectId]
  );

  console.log(res.rows);

  return res.rows.map((row) => ({
    technologyId: row.technology_id,
    name: row.name,
    logoURI: row.logo_uri,
  }));
};

const insertTechnologies = async (
  projectId: string,
  technologiesIds: string[]
): Promise<void> => {
  await db.query(`DELETE FROM project_technology WHERE project_id = $1`, [
    projectId,
  ]);

  for (const id of technologiesIds) {
    await db.query(
      `INSERT INTO project_technology(project_id, technology_id) VALUES($1, $2)`,
      [projectId, id]
    );
  }
};

const findProject = async (
  findBy: string,
  value: string,
  onlyPublic = true
): Promise<BrabantApi.Project | null> => {
  const res = await db.query(
    `SELECT
                              project_id,
                              name,
                              description,
                              content,
                              cover_uri,
                              start_ts,
                              end_ts,
                              string_id,
                              privacy
                              FROM project
                              WHERE ${findBy} = $1 ${
      onlyPublic ? "AND privacy = 'PUBLIC'" : ""
    }
                             `,
    [value]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];

  return {
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    content: row.content,
    coverURI: row.cover_uri,
    startTs: row.start_ts,
    endTs: row.end_ts,
    technologies: await extractTechnologies(row.project_id),
    stringId: row.string_id,
    privacy: row.privacy as 'PRIVATE' | 'PRIVATE-PREV' | 'PUBLIC'
  };
};

export const findProjectById = (projectId: string, publicOnly = true) => {
  return findProject("project_id", projectId, publicOnly);
};

export const findProjectByName = (projectName: string, publicOnly = true) => {
  return findProject("name", projectName, publicOnly);
};

export const findProjects = async (
  onlyPublic = true
): Promise<BrabantApi.ProjectPreview[]> => {
  const res = await db.query(`SELECT
                               project_id,
                               name,
                               description,
                               cover_uri,
                               start_ts,
                               end_ts,
                               string_id
                             FROM project
                             ${onlyPublic ? "WHERE privacy = 'PUBLIC'" : ""}
                             ;`);

  return await Promise.all(
    res.rows.map(async (row) => ({
      projectId: row.project_id,
      name: row.name,
      description: row.description,
      coverURI: row.cover_uri,
      technologies: await extractTechnologies(row.project_id),
      startTs: row.start_ts,
      endTs: row.end_ts,
      stringId: row.string_id,
    }))
  );
};

// TODO: insert technologies

export const createProject = async (
  name: string,
  description: string,
  content: string,
  coverURI: string,
  startTs: Date,
  endTs: Date,
  technologiesIds: string[]
): Promise<BrabantApi.ProjectPreview> => {
  const res = await db.query(
    `INSERT INTO project(name, description, content, cover_uri, start_ts, end_ts, string_id)
    VALUES($1, $2, $3, $4, $5, $6, $7)
    RETURNING project_id, name, description, cover_uri, string_id
  ;`,
    [name, description, content, coverURI, startTs, endTs, slugify(name)]
  );

  const row = res.rows[0];

  insertTechnologies(row.project_id, technologiesIds);

  return {
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    coverURI: row.cover_uri,
    technologies: await extractTechnologies(row.project_id),
    startTs: row.start_ts,
    endTs: row.end_ts,
    stringId: row.string_id,
  };
};

export const editProject = async (
  projectId: string,
  name?: string,
  description?: string,
  content?: string,
  coverURI?: string,
  startTs?: Date,
  endTs?: Date,
  technologiesIds?: string[],
  privacy?: 'PRIVATE' | 'PRIVATE-PREV' | 'PUBLIC'
) => {
  if (technologiesIds) {
    insertTechnologies(projectId, technologiesIds);
  }

  const patchRes = buildPatchQuery({
    name,
    description,
    content,
    cover_uri: coverURI,
    start_ts: startTs,
    end_ts: endTs,
    string_id: name ? slugify(name) : undefined,
    privacy
  });

  if (patchRes.args.length === 0) {
    return;
  }

  await db.query(
    `UPDATE project ${patchRes.query} WHERE project_id = $${
      patchRes.args.length + 1
    };`,
    [...patchRes.args, projectId]
  );
};

export const deleteProjectById = async (
  projectId: string
): Promise<boolean> => {
  const res = await db.query(`DELETE FROM project WHERE project_id = $1`, [
    projectId,
  ]);

  return res.rowCount > 0;
};
