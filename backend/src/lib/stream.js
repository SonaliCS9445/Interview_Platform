import {StreamChat} from "stream-chat";
import {ENV} from "./env.js";

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;


if(!apiKey || !apiSecret){
    console.error("Stream API key and secret are required. Please check your environment variables.");
}

export const chatClient = StreamChat.getInstance(apiKey, apiSecret);

//upsert for both create and delete
export const upsertStreamUser = async (userData) => {
  const response = await chatClient.upsertUser(userData);
  return response;
};

export const deleteStreamUser = async (userId) => {
    try{
        await chatClient.deleteUser(userId);
        console.log("stream user deleted:", userId);
    } catch (error) {
        console.error("Error deleting Stream user:", error);
    }
};


// add another method to generate token
export const generateStreamToken = (userId) => {
    return chatClient.createToken(userId);
};