import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
    try {
        const auth = req.auth?.();
        const clerkId = auth?.userId;

        if (!clerkId) {
            return res.status(401).json({ message: "Unauthorized - missing or invalid token" });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: "User not found in the database" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
