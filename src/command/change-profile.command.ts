import { UserProfile } from "../User-Profile/user-profile";
import { Command } from "./command.class";

export class ChangeProfilePhotoCommand extends Command {
  
  async handle(chatid: number, photoURL?: string): Promise<boolean| void> {
	
    if (photoURL) {
      await UserProfile.updatePhoto(chatid, photoURL);
      const updatedProfile = await UserProfile.findByChatId(chatid);

      if (updatedProfile) {
        const options = {
          caption: `${updatedProfile.name || "-"}, ${
            updatedProfile.age || "-"
          } - ${updatedProfile.about || "-"}\n`,
        };
        this.bot.sendMessage(chatid, "Оновлений профіль");
        this.bot.sendPhoto(chatid, updatedProfile.photoURL, options);
      } else {
        // Обробка, якщо профіль не знайдено
        this.bot.sendMessage(chatid, "Профіль не знайдено");
      }
    }
  }
}
