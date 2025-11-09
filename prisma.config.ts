import { defineConfig, env } from "prisma/config";

// Carregar variáveis de ambiente do .env
if (typeof process !== "undefined" && process.env) {
  const envPath = new URL(".env", import.meta.url).pathname;
  try {
    const fs = await import("fs");
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    // Silently fail if .env doesn't exist
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
