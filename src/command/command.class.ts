import TelegramBot from "node-telegram-bot-api";

export abstract class Command {
	constructor(public bot: TelegramBot) {}

	abstract handle(chatid: number, message?: string, username?: string, photoURL?: string): void;
}