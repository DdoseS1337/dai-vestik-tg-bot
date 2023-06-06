import TelegramBot, { Message } from "node-telegram-bot-api";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { StartCommand } from "./command/start.command";
import { FillProfile } from "./command/fill-profile.command";
import { ChangeProfileCommand } from "./command/change-profile.command";
import { ViewProfilesCommand } from "./command/view-profiles.command";
import mongoose from "mongoose";
import { Command } from "./command/command.class";

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
  private userCommandInstances: Map<number, Command> = new Map();

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
        await mongoose.connect(this.configService.get("MONGO_DB"));
        console.log("Connected to MongoDB");
      } catch (error) {
        console.error("Error connecting to MongoDB:", error);
      }
    };
    connectDB();

    this.bot.on("message", async (msg: Message) => {
      const text = msg.text;
      const chatId = msg.chat.id;

      if (msg.from?.username) {
        const username = msg.from?.username;
        const currentState = this.getUserState(chatId);
        console.log(' BotState ')
        switch (currentState) {
          case BotState.Start:
            console.log(' BotState.Start ' + BotState.Start)
            this.handleStartCommand(text, chatId);
            break;
          case BotState.FillProfile:
            console.log(' BotState.FillProfile ' + BotState.FillProfile)
            if (msg.photo) {
              const photo = msg.photo[0];
              const fileId = photo.file_id;
              this.handleFillProfileCommand(text, chatId, username, fileId);
            } else {
              this.handleFillProfileCommand(text, chatId, username);
            }
            break;
          case BotState.ChangeProfile:
            console.log(' BotState.ChangeProfile ' + BotState.ChangeProfile)
            if (msg.photo) {
              const photo = msg.photo[0];
              const fileId = photo.file_id;
              this.handleChangeProfileCommand(chatId, fileId);
            }
            break;
          case BotState.ViewProfiles:
            console.log(' BotState.ViewProfiles ' + BotState.ViewProfiles)
            this.handleViewProfilesCommand(chatId, text);
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

  private createCommandInstance<T extends Command>(
    chatId: number,
    classType: new (bot: TelegramBot) => T
  ): T {
    let instance = this.userCommandInstances.get(chatId) as T;

    if (!instance) {
      instance = new classType(this.bot);
      this.userCommandInstances.set(chatId, instance);
    }

    return instance;
  }

  private handleViewProfilesCommand(
    chatId: number,
    text?: string | undefined
  ): void {
    if (text === "Стоп") {
      this.setUserState(chatId, BotState.Start);
      this.setCommandInstance(chatId, null);
      const startCommand = new StartCommand(this.bot);
      startCommand.handle(chatId);
    } else {
      const viewProfilesCommand = this.createCommandInstance(
        chatId,
        ViewProfilesCommand
      );
      viewProfilesCommand.handle(chatId, text);
    }



  }

  private handleChangeProfileCommand(
    chatId: number,
    text: string | undefined
  ): void {
      const changeProfileCommand = this.createCommandInstance(
        chatId,
        ChangeProfileCommand
      );
      changeProfileCommand.handle(chatId, text);
      this.setUserState(chatId, BotState.Start);
      this.setCommandInstance(chatId, null);
      const startCommand = new StartCommand(this.bot);
      startCommand.handle(chatId);
  }

  private getUserState(chatId: number): BotState {
    return this.userStates.get(chatId) || BotState.Start;
  }

  private setUserState(chatId: number, state: BotState): void {
    this.userStates.set(chatId, state);
  }

  private handleStartCommand(
    text: string | undefined,
    chatId: number
  ): void {
    if (text === "/start") {
      const startCommand = new StartCommand(this.bot);
      startCommand.handle(chatId);
    } else if (text === "1") {
      this.setUserState(chatId, BotState.FillProfile);
      const fillProfileInstance = new FillProfile(this.bot);
      this.setCommandInstance(chatId, fillProfileInstance);
      this.bot.sendMessage(chatId, "Як до тебе звертатись?");
    } else if (text === "2") {
      this.setUserState(chatId, BotState.ChangeProfile);
      this.bot.sendMessage(chatId, "Надішли нове фото");
    } else if (text === "3") {
      // Handle command 3
    } else if (text === "4") {
      this.setUserState(chatId, BotState.ViewProfiles);
      this.handleViewProfilesCommand(chatId);
      const response = `Ви вибрали перегляд анкет. Відправляю анкети...`;
      this.bot.sendMessage(chatId, response);
    } else if (text === "let`s go") {
      this.setUserState(chatId, BotState.FillProfile);
      const fillProfileInstance = new FillProfile(this.bot);
      this.setCommandInstance(chatId, fillProfileInstance);
      this.bot.sendMessage(chatId, "Як до тебе звертатись?");
    } 
    else {
      this.bot.sendMessage(chatId, "Unknown command");
    }
  }

  private handleFillProfileCommand(
    text: string | undefined,
    chatId: number,
    username: string,
    photoURL?: string
  ): void {
    const fillProfileInstance = this.getCommandInstance<FillProfile>(chatId);

    if (fillProfileInstance) {
      if (photoURL) {
        fillProfileInstance.handle(chatId, text, username, photoURL);
      } else {
        fillProfileInstance.handle(chatId, text, username);
      }

      if (fillProfileInstance.isProfileFilled()) {
        const profileResponse = fillProfileInstance.getProfileResponse();
        const options = {
          caption: profileResponse,
        };

        if (photoURL) {
          this.bot.sendMessage(chatId, "Так виглядає твоя анкета:");
          this.bot.sendPhoto(chatId, photoURL, options);
        }

        this.setUserState(chatId, BotState.Start);
        this.setCommandInstance(chatId, null);
      }
    } else {
      this.bot.sendMessage(chatId, "Invalid command");
      this.setUserState(chatId, BotState.Start);
    }
  }

  private getCommandInstance<T extends Command>(
    chatId: number
  ): T | null {
    return this.userCommandInstances.get(chatId) as T | null;
  }

  private setCommandInstance<T extends Command>(
    chatId: number,
    instance: T | null
  ): void {
    if (instance) {
      this.userCommandInstances.set(chatId, instance);
    } else {
      this.userCommandInstances.delete(chatId);
    }
  }
}

const bot = new Bot(new ConfigService());
bot.init();
