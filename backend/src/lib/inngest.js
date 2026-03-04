import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import { upsertStreamUser, deleteStreamUser } from "./stream.js";

export const inngest = new Inngest({
  id: "talent-iq",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

// ================= Sync User Function =================
const syncUser = inngest.createFunction(
  { id: "Sync User" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      await connectDB();

      console.log("SyncUser function triggered");
      console.log("Event data:", event.data);

      const {
        id: clerkId,
        email_addresses,
        first_name,
        last_name,
        profile_image_url, // Use the safest image field from Clerk
      } = event.data;

      const email = email_addresses?.[0]?.email_address || "";

      // ✅ Upsert user in MongoDB (prevents duplicate key errors)
      const user = await User.findOneAndUpdate(
        { clerkId },
        {
          clerkId,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          profileImage: profile_image_url || "",
          email,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log("User synced to MongoDB:", user.clerkId);

      // ✅ Sync with Stream
      try {
        const streamResponse = await upsertStreamUser({
          id: user.clerkId.toString(),
          name: user.name,
          image: user.profileImage,
        });

        console.log("User synced to Stream:", user.clerkId, streamResponse);
      } catch (streamError) {
        console.error("Stream sync failed:", streamError); // full error
      }

      return { success: true };
    } catch (error) {
      console.error("SyncUser function failed:", error);
      throw error; // Let Inngest handle retry
    }
  }
);

// ================= Delete User Function =================
const deleteUserFromDB = inngest.createFunction(
  { id: "Delete User From DB" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      await connectDB();

      const { id: clerkId } = event.data;

      // Delete from Mongo
      await User.deleteOne({ clerkId });
      console.log("User deleted from MongoDB:", clerkId);

      // Delete from Stream
      try {
        await deleteStreamUser(clerkId.toString());
        console.log("User deleted from Stream:", clerkId);
      } catch (streamError) {
        console.error("Stream delete failed:", streamError);
      }

      return { success: true };
    } catch (error) {
      console.error("DeleteUserFromDB function failed:", error);
      throw error; // Let Inngest handle retry
    }
  }
);

export const functions = [syncUser, deleteUserFromDB];