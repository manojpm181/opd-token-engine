import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);
app.use((err: any, req: any, res: any, next: any) => {
  if (err.name === "ZodError") {
    return res.status(400).json({ error: err.errors });
  }
  res.status(500).json({ error: err.message || "Internal Server Error" });
});


export default app;
