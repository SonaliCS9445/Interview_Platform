import express from 'express';
import mongoose from "mongoose";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DB_URI)
  .then(() => console.log("DB connected"))
  .catch(() => console.log("DB not connected yet"));

app.get('/health', (req, res) => {
  res.status(200).json({message: "success from api"})
});

app.get('/books', (req, res) => {
  res.status(200).json({message: "this is the books api"})
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});

