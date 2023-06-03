import { UserProfile } from "../User-Profile/user-profile";
import { Command } from "./command.class";

export class ViewProfilesCommand extends Command {
  private cachedProfiles: UserProfile[] | null = null; // Кеш анкет

  private currentIndex = 0; // Поточний індекс відображеної анкети

  async handle(currentUserChatid: number, message?: string): Promise<void> {
    const response = `Ви вибрали перегляд анкет. Відправляю анкети...`;
    this.bot.sendMessage(currentUserChatid, response);

    if (!this.cachedProfiles) {
      this.cachedProfiles = await this.getProfilesFromDatabase();
    }
    console.log(this.currentIndex);
    if (this.cachedProfiles) {
      const profile = this.cachedProfiles[this.currentIndex];

      if (profile) {
        let nextProfile = profile;

        if (profile.chatid === currentUserChatid) {
          this.currentIndex++;
          nextProfile = this.cachedProfiles[this.currentIndex];
        }

        if (nextProfile && nextProfile.chatid !== currentUserChatid) {
          this.displayProfile(currentUserChatid, nextProfile);

          if (message === "Подобається") {
            // Обробити вибір користувача "Подобається"
            this.handleLike(currentUserChatid, nextProfile);
          }

          this.currentIndex++;
        }

        if (this.currentIndex >= this.cachedProfiles.length) {
          // Всі анкети відображено
          this.handleProfilesExhausted(currentUserChatid);
        }
      } else {
        // No more profiles to display
        this.handleProfilesExhausted(currentUserChatid);
      }
    }
  }

  private displayProfile(
    currentUserChatid: number,
    profile: UserProfile
  ): void {
    const options = {
      caption: `${profile.name || "-"}, ${profile.age || "-"} - ${
        profile.about || "-"
      }\n`,
      reply_markup: {
        keyboard: [
          [
            {
              text: "Подобається",
            },
            {
              text: "Не подобається",
            },
            {
              text: "Стоп",
            },
          ],
        ],
      },
    };
    this.bot.sendPhoto(currentUserChatid, profile.photoURL, options);
  }

  private async handleLike(
    currentUserChatid: number,
    profile: UserProfile
  ): Promise<void> {
    const currentUserProfile = await UserProfile.findByChatId(
      currentUserChatid
    );
    if (currentUserProfile) {
      if (!currentUserProfile.likes.includes(profile.chatid)) {
        currentUserProfile.likes.push(profile.chatid);
      }
      if (profile.likes.includes(currentUserChatid)) {
        console.log('i m here profile.likes.includes(currentUserChatid)')
        profile.matches.push(currentUserChatid);
        currentUserProfile.matches.push(profile.chatid);
        await profile.saveLikes(profile.chatid);
      }
      
      await currentUserProfile.saveLikes(currentUserChatid);
      console.log(currentUserProfile.likes)
      console.log(currentUserProfile.matches)
    }
  }

  private handleProfilesExhausted(currentUserChatid: number): void {
    this.bot.sendMessage(currentUserChatid, "Всі анкети переглянуто!");
  }

  private async getProfilesFromDatabase(): Promise<UserProfile[]> {
    const profiles = await UserProfile.getAllProfiles();
    // Логіка для фільтрації або сортування анкет
    if (profiles === null) {
      return []; // Return an empty array if profiles is null
    }
    return profiles;
  }
}
