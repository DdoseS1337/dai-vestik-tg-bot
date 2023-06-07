import { UserProfile } from "../User-Profile/user-profile";
import { Command } from "./command.class";

export class ChangeProfileTextCommand extends Command {
  async handle(chatid: number, newText: string): Promise<void> {
    await UserProfile.updateText(chatid, newText);
    const updatedProfile = await UserProfile.findByChatId(chatid);

    if (updatedProfile) {
      const options = {
        caption: `${updatedProfile.name || "-"}, ${
          updatedProfile.age || "-"
        } - ${updatedProfile.about || "-"}\n`,
      };
      this.bot.sendMessage(chatid, "Текст профілю оновлено: ");
      this.bot.sendPhoto(chatid, updatedProfile.photoURL, options);
    } else {
      this.bot.sendMessage(chatid, "Профіль не знайдено");
    }
  }
}
