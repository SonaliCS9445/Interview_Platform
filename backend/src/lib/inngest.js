import { Inngest} from "inngest";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import { upsertStreamUser,deleteStreamUser } from "./stream.js";
 
export const inngest = new Inngest({
  id: "talent-iq",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

const syncUser = inngest.createFunction(
    { id: "Sync User" },
    {event: "clerk/user.created" },
    async ({ event}) => { 
        await connectDB();
          console.log("SyncUser function triggered");
         console.log("Event data:", event.data);
        const {id, email_addresses, first_name, last_name, image_url} = event.data;
        const newUser = new User({
            clerkId: newUser.clerkId = id,
            name: `${first_name || ""} ${last_name}`,
            profileImage: image_url ,
            email: email_addresses[0].email_address,  
        });  
        await newUser.save();
      
        await upsertStreamUser({
            id: newUser.clerkId.toString(),
            name: newUser.name,
            image: newUser.profileImage,
        });

    }
);


const deleteUserFromDB = inngest.createFunction(
    { id: "Delete User From DB" },
    {event: "clerk/user.deleted" },
    async ({ event}) => { 
        await connectDB();
          
        const {id} = event.data;
         await User.deleteOne({clerkId: id});
        

         await deleteStreamUser(id.toString());
    }
);

export const functions = [syncUser, deleteUserFromDB];