import { FaceEmotion } from './faceEmotion';

export interface FaceAttributes{
    gender: string;
    age: number;
    emotion: FaceEmotion;
}