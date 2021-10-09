import { Router } from "express";
import { client } from "../utils/mongo.js";

const weatherRouter = Router();

weatherRouter.get("/weather", async (req, res) => {
    await client.connect();
    const db = client.db("victoria-weather");
    const collection = db.collection("map-data");
    const data = await collection.findOne({});

    res.json(data);
});

export default weatherRouter;
