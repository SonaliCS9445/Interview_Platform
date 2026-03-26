import express from 'express';
import cors from "cors";
import { connectDB } from './lib/db.js';
import { ENV } from './lib/env.js';
import { inngest, functions } from './lib/inngest.js';
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import dns from "node:dns";
import { protectRoute } from './middleware/protectRoute.js';
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import path from "path";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");


const app = express();

app.set("trust proxy", 1);

const __dirname = process.cwd();
app.use(express.json());
// Middleware
//credential true means that the server will accept cookies from the client and also allow the client to send cookies in the request. This is necessary for authentication and maintaining user sessions across different domains (cross-origin requests). By setting credentials to true, you enable the server to handle cookies properly, which is essential for features like user login and session management.
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ["http://localhost:5173", ENV.CLIENT_URL].filter(Boolean);

      // Allow server-to-server tools or same-origin requests without an Origin header.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(clerkMiddleware());

app.use("/api/inngest", serve({ client: inngest, functions })
);
app.use("/api/chat", chatRoutes)
app.use("/api/sessions", sessionRoutes)
// to eexecute code in the editor, we will use the piston api which is a free api that supports multiple programming languages. We will create a route for it in the backend and then call that route from the frontend when the user clicks on the run button in the code editor.
app.use("/api/code", codeRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({ message: "success from api" })
});



// when you pass an array of middleware to a route, they will be executed in order. So in this case, the requireAuth middleware will run first to check if the user is authenticated. If the user is authenticated, it will call next() and the execution will move on to the next middleware function in the array, which is the async function that handles the request and response for the /video-calls route. This allows you to protect the /video-calls route so that only authenticated users can access it.
app.get('/video-calls', protectRoute, (req, res) => {
  res.status(200).json({ message: "this is the protected video calls api", user: req.user })
});

const PORT = process.env.PORT || 5000;

// console.log("EVENT KEY:", process.env.INNGEST_EVENT_KEY);
// console.log("SIGNING KEY:", process.env.INNGEST_SIGNING_KEY);
// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`)
    });
  } catch (error) {
    console.error("😭Error starting the server:", error);
  }
};

startServer();