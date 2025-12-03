import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./config/db.js";
import userRoutes from "./api/users.js";
import alarmeRoutes from "./api/alarmes.js";
import { iniciarScheduler } from "./services/alarmeScheduler.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/alarmes", alarmeRoutes);
app.get("/", (req, res) => {
  res.send("API MedTime (Backend) está funcionando!");
});

db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Tabelas sincronizadas com o banco de dados. (Modo Alter)");

    app.listen(port, () => {
      console.log(`Backend rodando em http://localhost:${port}`);

      iniciarScheduler();
    });
  })
  .catch((err) => {
    console.error("Erro ao sincronizar as tabelas:", err);
  });
