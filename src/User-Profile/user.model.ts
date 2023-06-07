
import { Types } from 'mongoose';
import  UserProfileSchema, { UserProfileDocument }  from './user.model.interface'

export class UserProfileModel {
  public static async saveProfile(userProfileData: UserProfileDocument): Promise<void> {
    const userProfile = new UserProfileSchema(userProfileData);
    await userProfile.save();
    console.log('Профіль збережений')
  }

  public static async findMatchedProfiles(userProfileId: Types.ObjectId): Promise<UserProfileDocument[] | null> {
    return await UserProfileSchema.find({
      $or: [
        { _id: userProfileId },
        { matches: userProfileId },
      ],
    });
  }

  public static async findByChatId(chatid: number): Promise<UserProfileDocument | null> {
    return UserProfileSchema.findOne({ chatid }).exec();
  }
  public static async findById(userProfileId: object): Promise<UserProfileDocument | null> {
    return UserProfileSchema.findById({ userProfileId }).exec();
  }
  public static async updateProfile(userProfileData: UserProfileDocument): Promise<void> {
    try {
      const filter = { chatid: userProfileData.chatid }; // Фільтр для знаходження запису за chatid
      const update = { $set: userProfileData }; // Об'єкт з оновленими даними профілю
  
      await UserProfileSchema.updateOne(filter, update);
      console.log("Профіль оновлено успішно");
    } catch (error) {
      console.error("Помилка під час оновлення профілю:", error);
      // Обробка помилки
    }
  }

  public static async getAllProfiles(): Promise<UserProfileDocument[] | null> {
    try {
      const profiles = await UserProfileSchema.find().exec();
      return profiles;
    } catch (error) {
      console.error("Error retrieving profiles:", error);
      return null;
    }
  }

  public static async addLikedProfile(chatId: number, profileId: number): Promise<void> {
    try {
      const userProfile = await UserProfileSchema.findOne({ chatid: chatId });
      if (userProfile) {
        userProfile.likes.push(profileId);
        await userProfile.save();
  
        console.log('Профіль доданий до списку сподобаних');
      } else {
        console.log('Профіль користувача не знайдений');
      }
    } catch (error) {
      console.error('Помилка збереження профілю:', error);
    }
  }

  public static async addMachedProfile(chatId: number, profileId: number): Promise<void> {
    try {
      const userProfile = await UserProfileSchema.findOne({ chatid: chatId });
      if (userProfile) {
        await UserProfileSchema.updateOne({ chatid: chatId }, { $push: { matches: profileId } });
        console.log('Профіль доданий до списку сподобаних');
      } else {
        console.log('Профіль користувача не знайдений');
      }
    } catch (error) {
      console.error('Помилка збереження профілю:', error);
    }
  }
  
  
  public static async updateNewPhoto(chatid: number, photoURL: string): Promise<void> {
    // Знайдіть профіль за chatid
    const userProfile = await UserProfileSchema.findOne({ chatid });

    if (userProfile) {
      // Оновіть фото в профілі
      userProfile.photoURL = photoURL;
      
      // Збережіть оновлений профіль в базі даних
      await userProfile.save();

      console.log('Фото оновлено');
    } else {
      console.log('Профіль не знайдено');
    }

  }

  public static async updateNewText(chatid: number, text: string): Promise<void> {
    // Знайдіть профіль за chatid
    const userProfile = await UserProfileSchema.findOne({ chatid });

    if (userProfile) {
      // Оновіть фото в профілі
      userProfile.about = text;
      
      // Збережіть оновлений профіль в базі даних
      await userProfile.save();

      console.log('Фото оновлено');
    } else {
      console.log('Профіль не знайдено');
    }

  }

}

