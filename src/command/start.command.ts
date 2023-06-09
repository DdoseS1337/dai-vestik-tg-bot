import { UserProfile } from "../User-Profile/user-profile";
import { Command } from "./command.class";

export class StartCommand extends Command {
	async handle(chatid: number): Promise<void> {
		const existingProfile = await UserProfile.findByChatId(chatid);
		if(existingProfile) {
			console.log(existingProfile)
			const options = {
				reply_markup: {
					keyboard: [
						[{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4 🚀' }]
					],
					resize_keyboard: true,
				},
			};
			const response = `1. Заповнити анкету наново.\n` +
			`2. Змінити фото/відео.\n` +
			`3. Змінити текст анкети.\n` +
			`4. Дивитися анкети.`;
	
			this.bot.sendMessage(chatid, response, options);
		
		} else {

			const options = {
				reply_markup: {
					keyboard: [[{ text: 'let`s go' }]],
					resize_keyboard: true,
				},
			};
			const response = `Привіт.\n` +
			`Тебе вітає бот дайвестік.\n` +
			`Що ж давай заповнимо твою накету\n`; 

			this.bot.sendMessage(chatid, response, options);
		}

	}

}

