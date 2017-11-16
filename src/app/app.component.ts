import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { WebCamComponent } from 'ack-angular-webcam';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FaceModel } from './model/faceModel';
import { IntervalObservable } from "rxjs/observable/IntervalObservable";
import { Subscription } from 'rxjs/Subscription';
import { Emotion } from './model/emotion';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptionKey: string = "<<your subscription key>>";
  url: string = "<<your face api url>>";
  
  requestParams: string = "?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,emotion";
  captureInterval: number = 3000; //time in ms to wait between requests; keep in mind that the free face api has limitations for requests/min

  stopped: boolean = true;
  options = {
    audio: false,
    video: false,
    width: 640,
    height: 480
  };

  webcam: WebCamComponent; //https://github.com/AckerApple/ack-angular-webcam
  ctx: CanvasRenderingContext2D;
  subscription: Subscription;
  @ViewChild('canvas') canvas: ElementRef;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');

    this.subscription = IntervalObservable.create(this.captureInterval).subscribe(() => this.postFormData());
  }

  ngOnDestroy() {
    this.stopped = true;
    this.subscription.unsubscribe();
  }

  onCamError(err) {
    console.log(err)
  }

  onCamSuccess() {
    
  }

  toggle() {
    this.stopped = !this.stopped;
  }

  postFormData() {
    if (!this.stopped) {
      //Get base64 representation of the webcam image, convert it to a blob and set to face api
      this.webcam.getBase64().then((base) => {
        fetch(base).then(res => {
          res.blob().then(blob => {
            
            this.http.post<FaceModel[]>(this.url + this.requestParams, blob, {
              headers: new HttpHeaders().set('Content-Type', 'application/octet-stream').set('Ocp-Apim-Subscription-Key', this.subscriptionKey)
            }).toPromise().then((data) => {
              this.drawInformation(data);
            }).catch((err) => {
              console.log(err);
            });
          });
        });
      });
    }
  }

  drawInformation(faces: FaceModel[]) {
    this.clear();

    for (let face of faces) {

      let emotions = this.processEmotions(face);

      this.ctx.strokeText("Age " + face.faceAttributes.age, face.faceRectangle.left + 10, face.faceRectangle.top + 10);
      this.ctx.strokeText(face.faceAttributes.gender, face.faceRectangle.left + 10, face.faceRectangle.top + 20);
      this.ctx.strokeText(emotions[0].emotion + " - " + Math.round(emotions[0].value * 100.0) + "%", face.faceRectangle.left + 10, face.faceRectangle.top + 30);

      this.ctx.rect(face.faceRectangle.left, face.faceRectangle.top, face.faceRectangle.width, face.faceRectangle.height);
      this.ctx.stroke();

    }
  }

  processEmotions(face: FaceModel): Emotion[] {
    let emotions: Emotion[] = [];
    emotions.push({ emotion: 'angry', value: face.faceAttributes.emotion.anger });
    emotions.push({ emotion: 'contempt', value: face.faceAttributes.emotion.contempt });
    emotions.push({ emotion: 'disgusted', value: face.faceAttributes.emotion.disgust });
    emotions.push({ emotion: 'afraid', value: face.faceAttributes.emotion.fear });
    emotions.push({ emotion: 'happy', value: face.faceAttributes.emotion.happiness });
    emotions.push({ emotion: 'neutral', value: face.faceAttributes.emotion.neutral });
    emotions.push({ emotion: 'sad', value: face.faceAttributes.emotion.sadness });
    emotions.push({ emotion: 'surprised', value: face.faceAttributes.emotion.surprise });

    emotions = emotions.sort((e1, e2) => e2.value - e1.value);

    return emotions;
  }

  clear() {
    this.ctx.beginPath();
    this.ctx.clearRect(0, 0, 800, 600);
  }
}
