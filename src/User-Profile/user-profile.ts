import {UserProfileModel} from "./user.model";

export class UserProfile {
  photoURL: string;
  username: string;
  chatid: number;
  name: string;
  about: string;
  age: number;
  gender: string;
  interest: string;

  constructor(
    photoURL: string,
    username: string,
    chatid: number,
    name: string,
    about: string,
    age: number,
    gender: string,
    interest: string
  ) {
    this.photoURL = photoURL;
    this.username = username;
    this.chatid = chatid;
    this.name = name;
    this.about = about;
    this.age = age;
    this.gender = gender;
    this.interest = interest;
  }

  

  public async saveProfile(): Promise<void> {
    const userProfileData = { ...this };
    await UserProfileModel.saveProfile(userProfileData);
  }

  public static async updatePhoto(chatid: number ,photoURL: string): Promise<void> {
    await UserProfileModel.updatePhoto(chatid, photoURL)
  }
  
  public static async findByChatId(chatid: number): Promise<UserProfile | null> {
    const userProfileData = await UserProfileModel.findByChatId(chatid);
    if (userProfileData) {
      return new UserProfile(
        userProfileData.photoURL,
        userProfileData.username,
        userProfileData.chatid,
        userProfileData.name,
        userProfileData.about,
        userProfileData.age,
        userProfileData.gender,
        userProfileData.interest
      );
    }
    return null;
  }


}


