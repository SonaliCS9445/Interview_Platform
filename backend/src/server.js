import express from 'express';
import cors from "cors";
import { connectDB } from './lib/db.js';
import { ENV } from './lib/env.js';
import { inngest } from './lib/inngest.js';
import {serve} from "inngest/express";
import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");


const app = express();

const __dirname = process.resolve();
// Middleware

//credential true means that the server will accept cookies from the client and also allow the client to send cookies in the request. This is necessary for authentication and maintaining user sessions across different domains (cross-origin requests). By setting credentials to true, you enable the server to handle cookies properly, which is essential for features like user login and session management.
app.use(cors({origin:ENV.CLIENT_URL, credentials:true}));
app.use(express.json());

app.use("/api/inngest", serve({client:inngest, functions})
);

app.get('/health', (req, res) => {
  res.status(200).json({message: "success from api"})
});

app.get('/books', (req, res) => {
  res.status(200).json({message: "this is the books api"})
});

const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try{
    await connectDB();
    app.listen(PORT, async() => {
      console.log(`Server is running on port ${PORT}`)
});
  }catch(error){
    console.error("😭Error starting the server:", error);
  }
};

startServer();