import dotenv from "dotenv";

dotenv.config();

// console.log("ENV CHECK:", process.env.DB_URI);


export const ENV = {
    PORT: process.env.PORT,
    DB_URI: process.env.DB_URI,
    NODE_ENV: process.env.NODE_ENV
};