import express from 'express';
import { ENV } from './lib/env.js';

const app = express()

console.log(ENV.PORT, ENV.DB_URI)

app.get('/health', (req, res) => {
  res.status(200).json({message: "success from api"})
})

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`)
})

