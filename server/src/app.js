import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ ok: true, service: "OpenSlot API", milestone: 1 });
});

app.listen(PORT, () => {
  console.log(`✅ OpenSlot API running on http://localhost:${PORT}`);
});
