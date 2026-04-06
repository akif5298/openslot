import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import routes from "./routes/index.js";
import { getDatabaseMeta, initializeDatabase } from "./db/database.js";

initializeDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, "../../client");

export const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);
app.use(express.static(CLIENT_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, "login.html"));
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "OpenSlot API",
    milestone: 3,
    database: path.basename(getDatabaseMeta().path)
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    ok: false,
    message: "Unexpected server error."
  });
});

export async function startServer(port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);

    server.once("error", reject);
    server.once("listening", () => {
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : port;
      console.log(`OpenSlot API running on http://localhost:${resolvedPort}`);
      resolve(server);
    });
  });
}

const isDirectRun = process.argv[1] && __filename === path.resolve(process.argv[1]);

if (isDirectRun) {
  await startServer();
}
