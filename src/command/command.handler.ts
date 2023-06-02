import TelegramBot from "node-telegram-bot-api";
import { StartCommand } from "./start.command";
import { ChangeProfileCommand } from "./change-profile.command";
import { ViewProfilesCommand } from "./view-profiles.command";
import { FillProfile } from "./fill-profile.command";

let fillProfileInstance: FillProfile | null = null;

export function handleCommand(
  bot: TelegramBot,
  command: string | undefined,
  chatId: number,
): void {
  switch (command) {
    case "/start": {
      const startCommand = new StartCommand(bot);
      startCommand.handle(chatId);
      break;
    }
    case "1": {
        fillProfileInstance = new FillProfile(bot);
        fillProfileInstance.handle(chatId);
      break;
    }
    case "2": {
      const changeProfileCommand = new ChangeProfileCommand(bot);
      changeProfileCommand.handle(chatId);
      break;
    }
    case "3":
      break;
    case "4": {
      const viewProfilesCommand = new ViewProfilesCommand(bot);
      viewProfilesCommand.handle(chatId);
      break;
    }
    default:
      bot.sendMessage(chatId, "nihao hui sasi");
      break;
  }
}
