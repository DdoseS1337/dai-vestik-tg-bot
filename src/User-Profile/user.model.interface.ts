import { Schema, model } from 'mongoose';

export interface UserProfileDocument  {
  photoURL: string,
  username: string,
  chatid: number;
  name: string;
  about: string;
  age: number;
  gender: string;
  interest: string;
}

const userProfileSchema = new Schema<UserProfileDocument>({
  chatid: { type: Number, required: true, unique: true },
  username: { type: String, required: true},
  photoURL: { type: String, required: true},
  name: { type: String, required: true },
  about: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  interest: { type: String, required: true },
});

export default model<UserProfileDocument>('UserProfile', userProfileSchema);
