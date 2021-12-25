import { pool as db } from "../src/database/database";

export const findProjects = async (): Promise<BrabantApi.ProjectPreview[]> => {
  const res = await db.query(`SELECT name, description, cover_uri FROM project;`);

  return res.rows.map(row => ({
    name: row.name,
    description: row.description,
    coverURI: row.cover_uri,
    technologies: []
  }));
};
