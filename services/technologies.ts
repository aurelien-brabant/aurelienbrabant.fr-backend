import buildPatchQuery from "../src/database/buildPatchQuery";
import { pool as db } from "../src/database/database";

export const findTechnologyByName = async (
  technologyName: string
): Promise<BrabantApi.Technology | null> => {
  const res = await db.query(
    `SELECT technology_id, name, logo_uri FROM technology WHERE name = $1`,
    [technologyName]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];

  return {
    technologyId: row.technology_id,
    name: row.name,
    logoURI: row.logo_uri,
  };
};

export const findTechnologyById = async (
  technologyId: string
): Promise<BrabantApi.Technology | null> => {
  const res = await db.query(
    `SELECT technology_id, name, logo_uri FROM technology WHERE technology_id = $1`,
    [technologyId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];

  return {
    technologyId: row.technology_id,
    name: row.name,
    logoURI: row.logo_uri,
  };
};

export const findTechnologies = async (): Promise<BrabantApi.Technology[]> => {
  const res = await db.query(
    `SELECT technology_id, name, logo_uri FROM technology`
  );

  return res.rows.map((row) => ({
    technologyId: row.technology_id,
    name: row.name,
    logoURI: row.logo_uri,
  }));
};

export const createTechnology = async (
  technologyName: string,
  technologyLogoURI: string
): Promise<BrabantApi.Technology> => {
  const res = await db.query(
    `INSERT INTO technology (name, logo_uri) VALUES($1, $2) RETURNING technology_id, name, logo_uri`,
    [technologyName, technologyLogoURI]
  );

  const { technology_id: technologyId, name, logo_uri: logoURI } = res.rows[0];

  return { technologyId, name, logoURI };
};

export const editTechnologyById = async (
  technologyId: string,
  technologyName?: string,
  technologyLogoURI?: string
): Promise<BrabantApi.Technology> => {
  const patchRes = buildPatchQuery({
    name: technologyName,
    logo_uri: technologyLogoURI,
  });

  const res = await db.query(
    `UPDATE technology ${patchRes.query} WHERE technology_id = $${
      patchRes.args.length + 1
    } RETURNING name, logo_uri as logoURI;`,
    [...patchRes.args, technologyId]
  );

  const { name, logoURI } = res.rows[0];

  return {
    technologyId, name, logoURI
  }

};
