import { requireAuth } from "@clerk/express";
import User from "../models/User.js";


export const protectRoute = [
    requireAuth(), // this will check if the user is authenticated, if not it will redirect to the sign in page
    async (req, res, next) => {
        try {
            const clerkId = req.auth().userId;

            if(!clerkId) return res.status(401).json({message: "Unauthorized - invalid token"});

            const user = await User.findOne({clerkId});

            if(!user) return res.status(404).json({message: "User not found in the database"});
            // attach user to the request object so that it can be accessed in the route handlers
            req.user = user;

            next();
        } catch (error) {
            console.error("Error in protectRoute middleware:", error);
            res.status(500).json({message: "Internal server error"});
        }
    }
];
