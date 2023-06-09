import { Schema, model } from 'mongoose';

export interface IUserProfileDocument  {
  photoURL: string,
  username: string,
  chatid: number;
  name: string;
  about: string;
  age: number;
  gender: string;
  interest: string;
  likes: number[]; 
  matches: number[];
}



const userProfileSchema = new Schema({
  chatid: { type: Number, required: true, unique: true },
  username: { type: String, required: true},
  photoURL: { type: String, required: true},
  name: { type: String, required: true },
  about: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  interest: { type: String, required: true },
  likes: { type: [Number], default: [] },
  matches: { type: [Number], default: [] },
});

export default model<IUserProfileDocument>('UserProfile', userProfileSchema);
