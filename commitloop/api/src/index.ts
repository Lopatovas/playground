import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { loadAppConfig, assertProductionConfig } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);

const config = loadAppConfig({ apiPort: PORT, rootDir: __dirname });
assertProductionConfig(config);

const app = createApp(prisma, config);

app.listen(PORT, () => {
  console.log(`CommitLoop API → http://localhost:${PORT}`);
});
