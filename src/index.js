/* eslint-disable no-console */
import express from "express";
import cors from "cors";
import cron from "node-cron";

import weatherRouter from "./routes/weatherRouter.js";
import { loadData } from "./utils/loaddata.js";

import "dotenv/config"

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use("/api", weatherRouter);

app.listen(port, () => {
    loadData();
    console.log(`Running at http://localhost:4000`);
    cron.schedule("* * * * *", loadData);
});
