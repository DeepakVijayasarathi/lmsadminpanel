import {
  Component, ElementRef, OnDestroy, ViewChild
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const PLAYER_ID = 'a3e4e732-151e-4fb8-8c3a-94995156a71d';
const UPLOAD_URL = `${environment.apiUrl}/player/${PLAYER_ID}`;

@Component({
  selector: 'app-record-video',
  standalone: false,
  templateUrl: './record-video.component.html',
  styleUrls: ['./record-video.component.css']
})
export class RecordVideoComponent implements OnDestroy {
  @ViewChild('preview') previewRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('playback') playbackRef!: ElementRef<HTMLVideoElement>;

  isRecording = false;
  isPreviewing = false;
  isUploading = false;
  uploadSuccess = false;
  uploadError = '';
  recordedBlob: Blob | null = null;
  recordedUrl = '';
  recordingTime = 0;

  private mediaRecorder!: MediaRecorder;
  private chunks: Blob[] = [];
  private stream!: MediaStream;
  private timerInterval: any;

  constructor(private http: HttpClient) {}

  get formattedTime(): string {
    const m = Math.floor(this.recordingTime / 60).toString().padStart(2, '0');
    const s = (this.recordingTime % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  async startRecording(): Promise<void> {
    this.uploadSuccess = false;
    this.uploadError = '';
    this.recordedBlob = null;
    this.recordedUrl = '';
    this.isPreviewing = false;
    this.chunks = [];
    this.recordingTime = 0;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.previewRef.nativeElement.srcObject = this.stream;
      this.previewRef.nativeElement.play();

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => this.onRecordingStop();
      this.mediaRecorder.start(200);
      this.isRecording = true;

      this.timerInterval = setInterval(() => this.recordingTime++, 1000);
    } catch (err: any) {
      this.uploadError = 'Camera/microphone access denied. Please allow permissions.';
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(t => t.stop());
      this.isRecording = false;
      clearInterval(this.timerInterval);
    }
  }

  private onRecordingStop(): void {
    const mimeType = this.mediaRecorder.mimeType || 'video/webm';
    this.recordedBlob = new Blob(this.chunks, { type: mimeType });
    this.recordedUrl = URL.createObjectURL(this.recordedBlob);
    this.isPreviewing = true;
    setTimeout(() => {
      this.playbackRef.nativeElement.src = this.recordedUrl;
    });
  }

  uploadVideo(): void {
    if (!this.recordedBlob) return;

    this.isUploading = true;
    this.uploadError = '';
    this.uploadSuccess = false;

    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });

    const formData = new FormData();
    const ext = this.recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('video', this.recordedBlob, `recording.${ext}`);

    this.http.post(UPLOAD_URL, formData, { headers }).subscribe({
      next: () => {
        this.isUploading = false;
        this.uploadSuccess = true;
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadError = err?.error?.message || 'Upload failed. Please try again.';
      }
    });
  }

  discardRecording(): void {
    if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
    this.recordedBlob = null;
    this.recordedUrl = '';
    this.isPreviewing = false;
    this.uploadSuccess = false;
    this.uploadError = '';
    this.recordingTime = 0;
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
  }
}
