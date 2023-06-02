import TelegramBot from "node-telegram-bot-api";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { StartCommand } from "./command/start.command";
import { FillProfile } from "./command/fill-profile.command";
import { ChangeProfileCommand } from "./command/change-profile.command";
import { ViewProfilesCommand } from "./command/view-profiles.command";
import mongoose from "mongoose";
enum BotState {
  Start,
  FillProfile,
  ChangeProfile,
  ViewProfiles,
}

class Bot {
  private readonly configService: IConfigService;
  private bot: TelegramBot;
  private userStates: Map<number, BotState> = new Map();
  private userFillProfileInstances: Map<number, FillProfile> = new Map();

  constructor(configService: IConfigService) {
    this.configService = configService;
    this.bot = new TelegramBot(this.configService.get("TOKEN"), {
      polling: true,
    });
  }

  public init(): void {
    console.log("Bot start");
    const connectDB = async (): Promise<void> => {
      try {
        await mongoose.connect(
          this.configService.get("MONGO_DB")
        );
        console.log("Connected to MongoDB");
      } catch (error) {
        console.error("Error connecting to MongoDB:", error);
      }
    };
    connectDB();

    this.bot.on("message", async (msg) => {
      const text = msg.text;
      const chatId = msg.chat.id;

      if (msg.from?.username) {
        const username = msg.from?.username;
        const currentState = this.getUserState(chatId);
        switch (currentState) {
          case BotState.Start:
            this.handleStartCommand(text, chatId);
            break;
          case BotState.FillProfile:
            if (msg.photo) {
              const photo = msg.photo[0];
              const fileId = photo.file_id;
              // Створення URL-адреси фото
              this.handleFillProfileCommand(text, chatId, username, fileId);
            } else {
              this.handleFillProfileCommand(text, chatId, username);
            }
            break;
          case BotState.ChangeProfile:
            if (msg.photo) {
              const photo = msg.photo[0];
              const fileId = photo.file_id;
              console.log('BotState.ChangeProfile')
            this.handleChangeProfileCommand(chatId, fileId);
            }
            break;
          case BotState.ViewProfiles:
            this.handleViewProfilesCommand(text, chatId);
            break;
          default:
            this.bot.sendMessage(chatId, "Unknown command");
            break;
        }
      } else {
        this.bot.sendMessage(chatId, "Set username please");
      }
    });
  }

  private getUserState(chatId: number): BotState {
    return this.userStates.get(chatId) || BotState.Start;
  }

  private setUserState(chatId: number, state: BotState): void {
    this.userStates.set(chatId, state);
  }

  private getUserFillProfileInstance(chatId: number): FillProfile | null {
    return this.userFillProfileInstances.get(chatId) || null;
  }

  private setUserFillProfileInstance(
    chatId: number,
    instance: FillProfile | null
  ): void {
    if (instance) {
      this.userFillProfileInstances.set(chatId, instance);
    } else {
      this.userFillProfileInstances.delete(chatId);
    }
  }

  private handleStartCommand(text: string | undefined, chatId: number): void {
    if (text === "/start") {
      const startCommand = new StartCommand(this.bot);
      startCommand.handle(chatId);
    } else if (text === "1") {
      this.setUserState(chatId, BotState.FillProfile);
      const fillProfileInstance = new FillProfile(this.bot);
      this.setUserFillProfileInstance(chatId, fillProfileInstance);
      this.bot.sendMessage(chatId, "Як до тебе звертатись?");
    } else if (text === "2") {
      this.setUserState(chatId, BotState.ChangeProfile);
      this.bot.sendMessage(chatId, "Надішли нове фото");
    } else if (text === "3") {
      // Handle command 3
    } else if (text === "4") {
      const viewProfilesCommand = new ViewProfilesCommand(this.bot);
      viewProfilesCommand.handle(chatId);
    } else {
      this.bot.sendMessage(chatId, "Unknown command");
    }
  }

  private handleFillProfileCommand(
    text: string | undefined,
    chatId: number,
    username: string,
    photoURL?: string
  ): void {
    const fillProfileInstance = this.getUserFillProfileInstance(chatId);

    if (fillProfileInstance) {
      if(photoURL) {
        fillProfileInstance.handle(chatId, text, username, photoURL);
      } else {
        fillProfileInstance.handle(chatId, text, username);
      }
      if (fillProfileInstance.isProfileFilled()) {
        const profileResponse = fillProfileInstance.getProfileResponse();
        const options = {
          caption: profileResponse,
        };
        if(photoURL) {
          console.log(photoURL)
          this.bot.sendMessage(chatId, 'Так виглядає твоя анкета:');
          this.bot.sendPhoto(chatId, photoURL, options);
        }

        // Reset state to Start
        this.setUserState(chatId, BotState.Start);
        this.setUserFillProfileInstance(chatId, null);
      }
    } else {
      this.bot.sendMessage(chatId, "Invalid command");
      this.setUserState(chatId, BotState.Start);
    }
  }

  private handleChangeProfileCommand(
    chatId: number,
    photoURL: string
  ): void {
    const changeProfileCommand = new ChangeProfileCommand(this.bot);
    changeProfileCommand.handle(chatId, photoURL);

    // Reset state to Start
    this.setUserState(chatId, BotState.Start);
  }

  private handleViewProfilesCommand(
    text: string | undefined,
    chatId: number
  ): void {
    const viewProfilesCommand = new ViewProfilesCommand(this.bot);
    viewProfilesCommand.handle(chatId);

    // Reset state to Start
    this.setUserState(chatId, BotState.Start);
  }
}

const bot = new Bot(new ConfigService());
bot.init();
