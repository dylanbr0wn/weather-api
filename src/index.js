/* eslint-disable no-console */
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { loadData } from "./utils/loaddata.js";

import "dotenv/config"
import { client } from "./utils/mongo.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));


app.listen(port, async () => {

    loadData();
    console.log(`Running at http://localhost:4000`);
    cron.schedule("* * * * *", loadData);
});
