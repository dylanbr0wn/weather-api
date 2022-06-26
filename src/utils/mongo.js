import "dotenv/config"

const connectionURL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@victoria-weather.hzivz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

import { MongoClient } from "mongodb";
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
export const client = new MongoClient(connectionURL);


