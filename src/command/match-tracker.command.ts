import TelegramBot from "node-telegram-bot-api";
import { UserProfile } from "../User-Profile/user-profile";
import UserProfileSchema, { IUserProfileDocument } from "../User-Profile/user.model.interface";

export class MatchTracker {
  private matchedProfiles: Map<number, number[]> = new Map();
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  watchChanges() {
    console.log("Watch for match changes");

    const options = { fullDocument: "updateLookup" };

    UserProfileSchema.watch([], options).on("change", async (change) => {
      if(change.updateDescription && change.updateDescription.updatedFields !== undefined) {

      const updatedFields = Object.keys(change.updateDescription.updatedFields);
      const regex = /^matches\.[0-9]+$/;

      if (updatedFields.includes("matches") || regex.test(updatedFields[0])) {
        const updatedProfile = change.fullDocument as IUserProfileDocument;
        const userId = updatedProfile.chatid;
        console.log(userId);
        const matches = updatedProfile.matches;

        if (updatedProfile.matches.length > 0) {
          this.matchedProfiles.set(userId, matches);
          const userProfile = await UserProfile.findByChatId(userId);
          if (userProfile) {
            this.handleMatch(userProfile);
          }

          // Оновлення метчів для заметчених користувачів
          matches.forEach((match) => {
            if (!this.matchedProfiles.has(match)) {
              this.matchedProfiles.set(match, [userId]);
            } else {
              const existingMatches = this.matchedProfiles.get(match) || [];
              if (!existingMatches.includes(userId)) {
                existingMatches.push(userId);
                this.matchedProfiles.set(match, existingMatches);
              }
            }
          });
        } else {
          // Видалення метчів для заметчених користувачів
          matches.forEach((match) => {
            const existingMatches = this.matchedProfiles.get(match) || [];
            const updatedMatches = existingMatches.filter((m) => m !== userId);
            if (updatedMatches.length > 0) {
              this.matchedProfiles.set(match, updatedMatches);
            } else {
              this.matchedProfiles.delete(match);
            }
          });

          this.matchedProfiles.delete(userId);
        }
      } else {
        console.log("smth new");
      }
    }});
  }

  async handleMatch(userProfile: UserProfile) {
    console.log("Sending match notification to user:");

    const userId = userProfile.chatid;
    const matches = this.matchedProfiles.get(userId) || [];

    const matchedUsers = await Promise.all(
      matches.map(async (match) => {
        const matchedUser = await UserProfile.findByChatId(match);
        return matchedUser?.username || "Unknown";
      })
    );

    const uniqueMatchedUsers = [...new Set(matchedUsers)];

    const message = `Ви співпали з ${uniqueMatchedUsers.map((user) => `@${user}`).join(" і ")}!`;

    // Встановлення таймеру на 5 хвилин перед відправкою повідомлення
    setTimeout(() => {
      this.bot.sendMessage(userId, message);
      this.removeMatchAfterDelay(userId, matches);
    }, 5 * 60 * 1000);

    // Оновлення метчів для заметчених користувачів
    matches.forEach((match) => {
      if (!this.matchedProfiles.has(match)) {
        this.matchedProfiles.set(match, [userId]);
      } else {
        const existingMatches = this.matchedProfiles.get(match) || [];
        if (!existingMatches.includes(userId)) {
          existingMatches.push(userId);
          this.matchedProfiles.set(match, existingMatches);
        }
      }
    });
  }

  removeMatchAfterDelay(userId: number, matches: number[]) {
    setTimeout(() => {
      // Видалення метчу після заданого проміжку часу
      if (this.matchedProfiles.has(userId)) {
        this.matchedProfiles.delete(userId);
      }
      matches.forEach((match) => {
        const existingMatches = this.matchedProfiles.get(match) || [];
        const updatedMatches = existingMatches.filter((m) => m !== userId);
        if (updatedMatches.length > 0) {
          this.matchedProfiles.set(match, updatedMatches);
        } else {
          this.matchedProfiles.delete(match);
        }
      });
    }, 30 * 60 * 1000); // 30 хвилин
  }
}
