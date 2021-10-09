const config = {
    username: "dbuser",
    password: "01Oj4VrlLwm2J6dF",
};

const connectionURL = `mongodb+srv://${config.username}:${config.password}@victoria-weather.hzivz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

import { MongoClient } from "mongodb";
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
export const client = new MongoClient(connectionURL);
