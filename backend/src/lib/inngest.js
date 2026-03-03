import { Inngest} from "inngest";
import { connectDB } from "./db.js";
import User from "../models/User.js";
 
export const inngest = new Inngest({
  id: "talent-iq",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

const syncUser = inngest.createFunction(
    { id: "Sync User" },
    {event: "clerk.user.created" },
    async ({ event}) => { 
        await connectDB();
          
        const {id, email_addresses, first_name, last_name, image_url} = event.data;
        const newUser = new User({
            clerkId: id,
            name: `${first_name || ""} ${last_name}`,
            profileImage: image_url ,
            email: email_addresses[0].email_address,  
        });  
        await newUser.save();
    }
);
// console.log("EVENT KEY:", process.env.INNGEST_EVENT_KEY);
// console.log("SIGNING KEY:", process.env.INNGEST_SIGNING_KEY);


const deleteUserFromDB = inngest.createFunction(
    { id: "Delete User From DB" },
    {event: "clerk.user.deleted" },
    async ({ event}) => { 
        await connectDB();
          
        const {id} = event.data;
         await User.deleteOne({clerkId: id});
        
    }
);

export const functions = [syncUser, deleteUserFromDB];