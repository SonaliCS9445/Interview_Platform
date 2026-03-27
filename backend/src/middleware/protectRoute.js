import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
    requireAuth(), // this will check if the user is authenticated, if not it will redirect to the sign in page
    async (req, res, next) => {
        try {
            const clerkId = req.auth().userId;

            if(!clerkId) return res.status(401).json({message: "Unauthorized - invalid token"});

            let user = await User.findOne({ clerkId });

            if (!user) {
                console.log(`No user in DB for clerkId ${clerkId}. Attempting to build a local user record.`);

                let newUserData;

                if (process.env.CLERK_SECRET_KEY) {
                    try {
                        const clerkUser = await clerkClient.users.request((users) => users.getUser(clerkId));

                        if (clerkUser) {
                            newUserData = {
                                name: `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() || clerkUser.email_addresses?.[0]?.email_address || `User ${clerkId}`,
                                email: clerkUser.email_addresses?.[0]?.email_address || `${clerkId}@clerk.local`,
                                profileImage: clerkUser.image_url || "",
                                clerkId,
                            };
                        }
                    } catch (err) {
                        console.warn(`Clerk user lookup failed for ${clerkId}:`, err.message || err);
                    }
                }

                if (!newUserData) {
                    newUserData = {
                        name: `Clerk user ${clerkId.substring(0, 8)}`,
                        email: `${clerkId}@clerk.local`,
                        profileImage: "",
                        clerkId,
                    };
                    console.log(`CLERK_SECRET_KEY unavailable; using fallback local user data for clerkId ${clerkId}.`);
                }

                user = await User.create(newUserData);
                await upsertStreamUser({ id: newUserData.clerkId, name: newUserData.name, image: newUserData.profileImage });

                console.log(`Created local DB user for clerkId ${clerkId}`);
            }

            req.user = user;
            next();
        } catch (error) {
            console.error("Error in protectRoute middleware:", error);
            res.status(500).json({message: "Internal server error"});
        }
    }
];
