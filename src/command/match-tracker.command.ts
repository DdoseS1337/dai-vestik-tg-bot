import mongoose, { Types } from "mongoose";
import { ChangeStream, ChangeStreamDocument } from "mongodb";
import { UserProfileModel } from "../User-Profile/user.model";
import { UserProfileDocument } from "../User-Profile/user.model.interface";

export class MatchTracker {
  watchChanges() {
    console.log("hui here");
    const collection = mongoose.connection.collection("userprofiles");
    const pipeline = [
      {
        $match: {
          "updateDescription.updatedFields.matches": { $exists: true },
        },
      },
    ];

    const options = { fullDocument: "updateLookup" };

    const changeStream: ChangeStream = collection.watch(pipeline, options);

    changeStream.on("change", async (change) => {
      console.log("Profile with matches field has been updated");
      // Виконати необхідні дії з метчем

    });
  }

  async handleMatch(userProfile: UserProfileDocument) {
    // Виконуємо необхідні дії з метчем
    // Наприклад, надсилаємо повідомлення користувачам, що зробили метч
  }
}
