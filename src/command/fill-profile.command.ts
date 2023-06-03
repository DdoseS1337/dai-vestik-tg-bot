import TelegramBot from "node-telegram-bot-api";
import { Step } from "../Types/step-interface";
import { Command } from "./command.class";
import { UserProfile } from "../User-Profile/user-profile";

export class FillProfile extends Command {
  private steps: Step[] = [
    {
      message: "Як тебе звати?",
      property: "name",
    },
    {
      message:
        "Розкажи про себе, кого хочеш знайти, чим пропонуєш зайнятись. Це допоможе краще підібрати тобі компанію.",
      property: "about",
    },
    {
      message: "Скільки тобі років?",
      property: "age",
    },
    {
      message: "Тепер оберемо стать",
      property: "gender",
    },
    {
      message: "Хто тебе цікавить?",
      property: "interest",
    },
    {
      message: "Тепер відправ фото",
      property: "photo",
    },
  ];

  private currentStepIndex = 0;
  private userProfileData: { [key: string]: string | number } = {};

  constructor(bot: TelegramBot) {
    super(bot);
  }

  async handle(
    chatid: number,
    message?: string,
    username?: string,
    photoURL?: string
  ): Promise<void> {
    const currentStep = this.steps[this.currentStepIndex];

    if (currentStep) {
      if (message) {
        if (currentStep.property === "age") {
          const age = parseInt(message);
          if (isNaN(age) || age < 1 || age > 100) {
            this.bot.sendMessage(
              chatid,
              "Будь ласка, введіть коректне значення для віку (від 1 до 100)."
            );
            return;
          }
          this.userProfileData[currentStep.property] = age;
        } else {
          this.userProfileData[currentStep.property] = message;
        }
      } else if (photoURL) {
        this.userProfileData[currentStep.property] = photoURL;
      }

      this.currentStepIndex++;

      if (this.currentStepIndex < this.steps.length) {
        const nextStep = this.steps[this.currentStepIndex];
        const options = this.getOptionsForStep(nextStep.property);
        const response = nextStep.message;
        this.bot.sendMessage(chatid, response, options);
      } else {
        if (username && photoURL) {
          const userProfile = new UserProfile(
            this.userProfileData.photo as string,
            username,
            chatid,
            this.userProfileData.name as string,
            this.userProfileData.about as string,
            this.userProfileData.age as number,
            this.userProfileData.gender as string,
            this.userProfileData.interest as string,
            [],
            []
          );

          userProfile.saveProfile();
          console.log(userProfile);
          this.bot.sendMessage(chatid, "Форма заповнена");
        }
      }
    }
  }

  getOptionsForStep(property: string): any {
    if (property === "gender") {
      return {
        reply_markup: {
          keyboard: [
            [
              { text: "Я Дівчина", callback_data: "female" },
              { text: "Я Хлопець", callback_data: "male" },
            ],
          ],
        },
      };
    } else if (property === "interest") {
      return {
        reply_markup: {
          keyboard: [
            [
              { text: "Дівчата", callback_data: "female" },
              { text: "Хлопці", callback_data: "male" },
              { text: "Все одно", callback_data: "any" },
            ],
          ],
        },
      };
    }
    return {};
  }

  isProfileFilled(): boolean {
    return this.currentStepIndex >= this.steps.length;
  }

  getProfileResponse(): string {
    return `${this.userProfileData.name || "-"}, ${
      this.userProfileData.age || "-"
    } - ${this.userProfileData.about || "-"}\n`;
  }
}
