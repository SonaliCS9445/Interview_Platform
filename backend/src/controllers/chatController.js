import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
    try{

        // use clerkId as the userId for Stream Chat
        const token = chatClient.createToken(req.user.clerkId);
        return res.status(200).json({
            token,
            userId: req.user.clerkId,
            name: req.user.name,
            email: req.user.email,
            profileImage: req.user.profileImage
            });
    }catch(error){
        console.error("Error generating Stream token:", error);
        return res.status(500).json({message: "Internal server error"});
    }
}