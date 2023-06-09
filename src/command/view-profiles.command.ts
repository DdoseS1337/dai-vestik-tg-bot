import { UserProfile } from "../User-Profile/user-profile";
import { Command } from "./command.class";

export class ViewProfilesCommand extends Command {
  private cachedProfiles: UserProfile[] | null = null; // Кеш анкет

  private currentIndex = 0; // Поточний індекс відображеної анкети
  private previousProfile: UserProfile | null = null; // Попередня анкета
  private answeredProfiles: UserProfile[] = [];
  async handle(currentUserChatid: number, message?: string): Promise<void> {
    if (!this.cachedProfiles) {
      this.cachedProfiles = await this.getProfilesFromDatabase(
        currentUserChatid
      );
    }

    if (this.cachedProfiles && this.cachedProfiles.length > 0) {
      const profile = this.cachedProfiles[this.currentIndex];
      if (profile) {
        if (this.previousProfile && message === "❤️") {
          this.handleLike(currentUserChatid, this.previousProfile);
          this.answeredProfiles.push(this.previousProfile);
        }

        if (await this.isProfileMatch(currentUserChatid, profile)) {
          this.displayProfile(currentUserChatid, profile);
          this.previousProfile = profile;
          
        } else {
          this.currentIndex++;
          this.handle(currentUserChatid); // Рекурсивно переходимо до наступного профілю
          return;
        }

        this.currentIndex++;

        if (this.currentIndex >= this.cachedProfiles.length) {
          // Перевіряємо, чи всі анкети мають відповіді
          const allProfilesAnswered = this.cachedProfiles.every((profile) =>
            this.answeredProfiles.includes(profile)
          );

          if (allProfilesAnswered) {
            // Всі анкети переглянуті та мають відповіді
            this.handleProfilesExhausted(currentUserChatid);
          }
        }
      } else {
        if (this.previousProfile) {
          this.handleLike(currentUserChatid, this.previousProfile);
          this.handleProfilesExhausted(currentUserChatid);
        } else {
          this.handleProfilesExhausted(currentUserChatid);
        }
      }
    } else {
      // Empty profile list
      this.handleProfilesExhausted(currentUserChatid);
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
              text: "❤️",
            },
            {
              text: "👎",
            },
            {
              text: "💤",
            },
          ],
        ],
        resize_keyboard: true,
      },
    };
    this.bot.sendPhoto(currentUserChatid, profile.photoURL, options);
  }
  private async isProfileMatch(currentUserChatid: number, profile: UserProfile): Promise<boolean> {
    const currentUserProfile = await UserProfile.findByChatId(currentUserChatid);
    if (currentUserProfile) {
      // Перевіряємо, чи гендер користувача відповідає вимогам профілю
      if (
        currentUserProfile.gender === profile.interest ||
        profile.interest === "any"
      ) {
        return true;
      } else {
        return false;
      }
    }
    return false;
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
        await currentUserProfile.saveLikes(currentUserChatid, profile.chatid);
      }
      if (profile.likes.includes(currentUserChatid)) {
        if(!profile.matches.includes(currentUserChatid)) {
          currentUserProfile.matches.push(profile.chatid);
          profile.matches.push(currentUserChatid);
          await currentUserProfile.saveMatches(currentUserChatid, profile.chatid);
          await profile.saveMatches(profile.chatid, currentUserChatid);
        }
      }
    }
  }

  private handleProfilesExhausted(currentUserChatid: number): void {
    this.bot.sendMessage(currentUserChatid, "Всі анкети переглянуто!");
  }

  private async getProfilesFromDatabase(
    currentUserChatid: number
  ): Promise<UserProfile[]> {
    const profiles = await UserProfile.getAllProfiles();

    // Логіка для фільтрації або сортування анкет
    if (profiles === null) {
      return []; // Return an empty array if profiles is null
    }

    const filteredProfiles = profiles.filter(
      (profile) => profile.chatid !== currentUserChatid
    );

    return filteredProfiles;
  }
}
