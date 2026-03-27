import { streamClient,chatClient } from "../lib/stream.js";
import Session from "../models/Session.js";
export async function createSession(req, res) {
    try{
        const {problem, difficulty} = req.body;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        if(!problem || !difficulty){
            return res.status(400).json({message: "Problem and difficulty are required"});
        }

        //generate a unique callId for stream video call
        const callId = `session_${Date.now()}_${Math.random().toString(36).substr(7)}`;
        const session = await Session.create({
            problem,
            difficulty,
            host: userId,
            callId
        });

        //create stream video call
        await streamClient.video.call("default",callId).getOrCreate({
            data:{
                created_by_id: clerkId,
                custom: {problem, difficulty, sessionId: session._id.toString()}
            }
        });

        //chat messaging 
       const channel = chatClient.channel("messaging", callId, {
            name: `${problem} Session`,
            created_by_id: clerkId,
            members: [clerkId]
        });
        await channel.create();
        res.status(201).json({session});

    }catch(error){
        console.error("Error creating session:", error);
        res.status(500).json({message: "Error creating session"});
    }
};

export async function getActiveSessions(_, res) {
    try{
        const sessions = await Session.find({status: "active"})
        .populate("host", "name profileImage email clerkId")
        .sort({createdAt: -1})
        .limit(20);
       
        res.status(200).json({sessions});
    }catch(error){
        console.error("Error fetching active sessions:", error);
        res.status(500).json({message: "Error fetching active sessions"});
    }
};

export async function getMyRecentSessions(req, res) {
    try{
        const userId = req.user._id;
        const sessions = await Session.find({
            status: "completed",
            $or: [{host: userId}, {participant: userId}]
        })
        .sort({createdAt: -1})
        .limit(20);
        res.status(200).json({sessions});
    }catch(error){
        console.error("Error fetching my recent sessions:", error);
        res.status(500).json({message: "Error fetching my recent sessions"});
    }
};

export async function getSessionById(req, res) {
    try{
        const {id} = req.params;
        const session = await Session.findById(id)
        .populate("host", "name profileImage email clerkId")
        .populate("participant", "name profileImage email clerkId"); 

        if(!session){
            return res.status(404).json({message: "Session not found"});
        }
        res.status(200).json({session});
    }catch(error){
        console.error("Error fetching session by ID:", error);
        res.status(500).json({message: "Error fetching session by ID"});
    }
};

export async function joinSession(req, res) {
    try{
        const {id} = req.params;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;
        const session = await Session.findById(id);

        if(!session){
            return res.status(404).json({message: "Session not found"});
        }

        if(session.status !== "active"){
            return res.status(400).json({message: "Session is not active"});
        }

        // Allow host to "join" their own session (they don't become a participant)
        if(session.host.toString() === userId.toString()){
            // Host is already part of the session, just return success
            res.status(200).json({message: "Host joined session successfully", session});
            return;
        }

        //check if session is already full
        if(session.participant) return res.status(409).json({message: "Session is already full"});

        session.participant = userId;
        await session.save();


       const channel = chatClient.channel("messaging", session.callId);
         await channel.addMembers([clerkId]);

         res.status(200).json({message: "Joined session successfully", session});

    }catch(error){
        console.error("Error joining session:", error);
        res.status(500).json({message: "Error joining session"});
    }
};

export async function endSession(req, res) {
    try{
        const {id} = req.params;
        const userId = req.user._id;
        const session = await Session.findById(id); 
        if(!session){
            return res.status(404).json({message: "Session not found"});
        }
        //only host can end the session
        if(session.host.toString() !== userId.toString()){
            return res.status(403).json({message: "Only the host can end the session"});
        }   

        if(session.status === "completed"){
            return res.status(400).json({message: "Session is already completed"});
        }
    

        //delete the stream video call
        await streamClient.video.call("default", session.callId).delete({hard: true});

        //delete the chat channel
        const channel = chatClient.channel("messaging", session.callId);
        await channel.delete();

         session.status = "completed";
        await session.save();

        res.status(200).json({message: "Session ended successfully", session});

    }catch(error){
        console.error("Error ending session:", error);
        res.status(500).json({message: "Error ending session"});
    }
};
