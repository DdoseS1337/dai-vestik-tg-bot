import { UserProfile } from "../User-Profile/user-profile";
import { Command } from "./command.class";

export class StartCommand extends Command {
	async handle(chatid: number): Promise<void> {
		const existingProfile = await UserProfile.findByChatId(chatid);

		if(existingProfile) {
			const options = {
				reply_markup: {
					keyboard: [[{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }]],
				},
			};
			const response = `1. Заповнити анкету наново.\n` +
			`2. Змінити фото/відео.\n` +
			`3. Змінити текст анкети.\n` +
			`4. Дивитися анкети.`;
	
			this.bot.sendMessage(chatid, response, options);
		} else {
			this.bot.sendMessage(chatid, 'no sex');
		}

	}

}
