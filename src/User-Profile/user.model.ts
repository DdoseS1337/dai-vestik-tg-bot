
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

  public static async updatePhoto(chatid: number, photoURL: string): Promise<void> {
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

