import IUserProfile from "./user-profile.interface";
import { UserProfileModel } from "./user.model";

export class UserProfile implements IUserProfile {
  photoURL: string;
  username: string;
  chatid: number;
  name: string;
  about: string;
  age: number;
  gender: string;
  interest: string;
  likes: number[];
  matches: number[];

  constructor(
    photoURL: string,
    username: string,
    chatid: number,
    name: string,
    about: string,
    age: number,
    gender: string,
    interest: string,
    likes: number[] = [],
    matches: number[] = []
  ) {
    this.photoURL = photoURL;
    this.username = username;
    this.chatid = chatid;
    this.name = name;
    this.about = about;
    this.age = age;
    this.gender = gender;
    this.interest = interest;
    this.likes = likes;
    this.matches = matches;
  }

  public async saveProfile(): Promise<void> {
    const userProfileData = { ...this };
    await UserProfileModel.saveProfile(userProfileData);
  }

  public  async saveLikes(chatid: number): Promise<void> {
      await UserProfileModel.saveNewLikes( chatid );
  }

  public static async getAllProfiles(): Promise<UserProfile[] | null> {
    try {
      const profileDocuments = await UserProfileModel.getAllProfiles();
      if (profileDocuments) {
        return profileDocuments.map((profileDoc) => {
          return new UserProfile(
            profileDoc.photoURL,
            profileDoc.username,
            profileDoc.chatid,
            profileDoc.name,
            profileDoc.about,
            profileDoc.age,
            profileDoc.gender,
            profileDoc.interest,
            profileDoc.likes,
            profileDoc.matches
          );
        });
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving profiles:", error);
      return null;
    }
  }

  public static async updatePhoto(
    chatid: number,
    photoURL: string
  ): Promise<void> {
    await UserProfileModel.updateNewPhoto(chatid, photoURL);
  }

  public static async findByChatId(
    chatid: number
  ): Promise<UserProfile | null> {
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
        userProfileData.interest,
        userProfileData.likes,
        userProfileData.matches
      );
    }
    return null;
  }
}
