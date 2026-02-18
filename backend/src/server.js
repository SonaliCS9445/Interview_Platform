import express from 'express';
import cors from "cors";
import { connectDB } from './lib/db.js';
import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");


const app = express();

app.use(cors());
app.use(express.json());

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