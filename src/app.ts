import TelegramBot, { Message } from "node-telegram-bot-api";
import { StartCommand } from "./command/start.command";
import { FillProfile } from "./command/fill-profile.command";
import { ChangeProfilePhotoCommand } from "./command/change-profile.command";
import { ViewProfilesCommand } from "./command/view-profiles.command";
import mongoose from "mongoose";
import { Command } from "./command/command.class";
import { ChangeProfileTextCommand } from "./command/change-profile-text.command";
import { MatchTracker } from "./command/match-tracker.command";
import * as dotenv from 'dotenv';

enum BotState {
  Start,
  FillProfile,
  ChangeProfilePhoto,
  ChangeProfileText,
  ViewProfiles,
}

class Bot {
  private bot: TelegramBot;
  private userStates: Map<number, BotState> = new Map();
  private userCommandInstances: Map<number, Command> = new Map();
  matchTracker: MatchTracker;
  
  constructor() {
    
    dotenv.config();

    const token = process.env.TOKEN as string;
    
    
      this.bot = new TelegramBot(token, {
        polling: true,
      });
    
    this.matchTracker = new MatchTracker(this.bot);
  }
  
  public init(): void {
    console.log("Bot start");

    const mongo = process.env.MONGO_DB as string;
    
    const connectDB = async (): Promise<void> => {
      let isConnected = false;
      
      while (!isConnected) {
        try {
          await mongoose.connect(mongo);
          console.log("Connected to MongoDB");
          isConnected = true;
          this.matchTracker.watchChanges();
        } catch (error) {
          const errorMessage = (error as Error).message.slice(0, 100); // Обмеження до 50 символів
          console.error("Error connecting to MongoDB:", errorMessage);
          // Очікувати певний час перед наступною спробою підключення
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    };
    connectDB();
    
    this.bot.on("message", async (msg: Message) => {
      const text = msg.text;
      const chatId = msg.chat.id;

      if (msg.from?.username) {
        const username = msg.from?.username;
        const currentState = this.getUserState(chatId);
        console.log(" BotState ");
        switch (currentState) {
          case BotState.Start:
            console.log(" BotState.Start " + BotState.Start);
            this.handleStartCommand(text, chatId);
            break;
          case BotState.FillProfile:
            console.log(" BotState.FillProfile " + BotState.FillProfile);
            if (msg.photo) {
              const photo = msg.photo[0];
              const fileId = photo.file_id;
              this.handleFillProfileCommand(text, chatId, username, fileId);
            } else {
              this.handleFillProfileCommand(text, chatId, username);
            }
            break;
          case BotState.ChangeProfilePhoto:
            console.log(
              " BotState.ChangeProfile " + BotState.ChangeProfilePhoto
            );
            if (msg.photo) {
              const photo = msg.photo[0];
              const fileId = photo.file_id;
              this.handleChangeProfilePhotoCommand(chatId, fileId);
            }
            break;
          case BotState.ChangeProfileText:
            this.handleChangeProfileTextCommand(chatId, text);
            break;
          case BotState.ViewProfiles:
            console.log(" BotState.ViewProfiles " + BotState.ViewProfiles);
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
    if (text === "💤") {
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

  private handleChangeProfilePhotoCommand(
    chatId: number,
    text: string | undefined
  ): void {
    const changeProfilePhotoCommand = this.createCommandInstance(
      chatId,
      ChangeProfilePhotoCommand
    );
    changeProfilePhotoCommand
      .handle(chatId, text)
      .then(() => {
        this.setUserState(chatId, BotState.Start);
        const startCommand = new StartCommand(this.bot);
        startCommand.handle(chatId);
      })
      .catch((e) => {
        console.error("Помилка", e);
      });
    this.setUserState(chatId, BotState.Start);
    this.setCommandInstance(chatId, null);
  }

  private handleChangeProfileTextCommand(
    chatId: number,
    text: string | undefined,
  ): void {
    const changeProfileTextCommand = this.createCommandInstance(
      chatId,
      ChangeProfileTextCommand
    );
    if(text) {
      changeProfileTextCommand
      .handle(chatId, text)
      .then(() => {
        this.setUserState(chatId, BotState.Start);
        const startCommand = new StartCommand(this.bot);
        startCommand.handle(chatId);
      })
      .catch((e) => {
        console.error("Помилка", e);
      });
    this.setUserState(chatId, BotState.Start);
    this.setCommandInstance(chatId, null);
    }

  }

  private getUserState(chatId: number): BotState {
    return this.userStates.get(chatId) || BotState.Start;
  }

  private setUserState(chatId: number, state: BotState): void {
    this.userStates.set(chatId, state);
  }

  private handleStartCommand(text: string | undefined, chatId: number): void {
    if (text === "/start") {
      const startCommand = new StartCommand(this.bot);
      startCommand.handle(chatId);
    } else if (text === "1") {
      this.setUserState(chatId, BotState.FillProfile);
      const fillProfileInstance = new FillProfile(this.bot);
      this.setCommandInstance(chatId, fillProfileInstance);
      this.bot.sendMessage(chatId, "Як до тебе звертатись?");
    } else if (text === "2") {
      this.setUserState(chatId, BotState.ChangeProfilePhoto);
      this.bot.sendMessage(chatId, "Надішли нове фото");
    } else if (text === "3") {
      this.setUserState(chatId, BotState.ChangeProfileText);
      this.bot.sendMessage(chatId, "Надішли новий текст");
    } else if (text === "4 🚀") {
      this.setUserState(chatId, BotState.ViewProfiles);
      this.handleViewProfilesCommand(chatId);
      const response = `Ви вибрали перегляд анкет. Відправляю анкети...`;
      this.bot.sendMessage(chatId, response);
    } else if (text === "let`s go") {
      this.setUserState(chatId, BotState.FillProfile);
      const fillProfileInstance = new FillProfile(this.bot);
      this.setCommandInstance(chatId, fillProfileInstance);
      this.bot.sendMessage(chatId, "Як до тебе звертатись?");
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
        const startCommand = new StartCommand(this.bot);
        startCommand.handle(chatId);
        this.setCommandInstance(chatId, null);
      }
    } else {
      this.bot.sendMessage(chatId, "Invalid command");
      this.setUserState(chatId, BotState.Start);
      const startCommand = new StartCommand(this.bot);
      startCommand.handle(chatId);
    }
  }

  private getCommandInstance<T extends Command>(chatId: number): T | null {
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

const bot = new Bot();
bot.init();
