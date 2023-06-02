import { Command } from "./command.class";
import TelegramBot from "node-telegram-bot-api";

export class ViewProfilesCommand extends Command {
	handle(chatid: number, message?: string): void {

		
		const response = `Ви вибрали перегляд анкет. Відправляю анкети...`;

		this.bot.sendMessage(chatid, response);
	}

}
