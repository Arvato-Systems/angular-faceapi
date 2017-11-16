import { FaceRect } from './faceRect';
import { FaceAttributes } from './faceAttributes';

export interface FaceModel {
    faceId: string;
    faceRectangle: FaceRect;
    faceAttributes: FaceAttributes;    
}