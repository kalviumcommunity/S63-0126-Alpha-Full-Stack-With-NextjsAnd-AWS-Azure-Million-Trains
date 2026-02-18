import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const buildDatasourceUrl = (): string | undefined => {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    return undefined;
  }

  if (process.env.DATABASE_SSL !== "true") {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    const separator = rawUrl.includes("?") ? "&" : "?";
    return rawUrl.includes("sslmode")
      ? rawUrl
      : `${rawUrl}${separator}sslmode=require`;
  }
};

const datasourceUrl = buildDatasourceUrl();

const prismaOptions = datasourceUrl
  ? { datasources: { db: { url: datasourceUrl } } }
  : undefined;

const prismaClient = global.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
