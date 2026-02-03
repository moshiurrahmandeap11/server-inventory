import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();

let client;
let db;

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

console.log(user , pass);


const uri = `mongodb+srv://${user}:${pass}@mdb.26vlivz.mongodb.net/?appName=MDB`;

const connectDB = async () => {
    try {
        if(!client) {
            client = new MongoClient(uri);
            await client.connect();
            db = client.db();
            console.log(("MongoDB Connected"));
        }
        return db;
    } catch (error) {
        console.log("MongoDB connection failed: ", error.messgae);
        process.exit(1);
    }
}

export { connectDB, db };
