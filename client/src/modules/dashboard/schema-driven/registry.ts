import "server-only";

import { readdirSync } from "fs";
import path from "path";
import type { AnyFeatureToolSchema } from "./types";

type SchemaFactory = (
  headers?: HeadersInit,
) => AnyFeatureToolSchema | Promise<AnyFeatureToolSchema>;

type SchemaExport = AnyFeatureToolSchema | SchemaFactory;

type SchemaModule = {
  toolSchema?: SchemaExport;
};

const SCHEMA_FILE_PATTERN = /^(.+)\.schema\.(ts|tsx|js|jsx)$/;
const SCHEMA_DIR = path.join(
  process.cwd(),
  "src/modules/dashboard/schema-driven/schemas",
);

function getSchemaSlugs() {
  try {
    return readdirSync(SCHEMA_DIR)
      .map((fileName) => fileName.match(SCHEMA_FILE_PATTERN)?.[1])
      .filter((slug): slug is string => Boolean(slug))
      .sort();
  } catch {
    return [];
  }
}

export const schemaSlugs = getSchemaSlugs();

export function isSchemaSlug(slug: string): slug is (typeof schemaSlugs)[number] {
  return schemaSlugs.includes(slug);
}

async function importSchemaModule(slug: string): Promise<SchemaModule | null> {
  if (!isSchemaSlug(slug)) {
    return null;
  }

  return import(`./schemas/${slug}.schema`) as Promise<SchemaModule>;
}

export async function getFeatureToolSchema(
  slug: string,
  headers?: HeadersInit,
): Promise<AnyFeatureToolSchema | null> {
  const schemaModule = await importSchemaModule(slug);
  const schemaExport = schemaModule?.toolSchema as SchemaExport
   if (!schemaExport) {
    return null;
  }

  return typeof schemaExport === "function"
    ? schemaExport(headers)
    : schemaExport;
}
