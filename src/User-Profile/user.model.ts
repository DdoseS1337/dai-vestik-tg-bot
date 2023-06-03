
import  UserProfileSchema, { UserProfileDocument }  from './user.model.interface'

export class UserProfileModel {
  public static async saveProfile(userProfileData: UserProfileDocument): Promise<void> {
    const userProfile = new UserProfileSchema(userProfileData);
    await userProfile.save();
    console.log('Профіль збережений')
  }
  

  public static async findByChatId(chatid: number): Promise<UserProfileDocument | null> {
    return UserProfileSchema.findOne({ chatid }).exec();
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

  public static async saveNewLikes(chatid: number): Promise<void> {
    try {
      const userProfile = await UserProfileSchema.findOne({ chatid: chatid });
      if (userProfile) {
        // Збережіть оновлений профіль в базі даних
        await userProfile.save();
  
        console.log('Лайки оновлені');
      } else {
        console.log('Не оновлені');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
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

}

