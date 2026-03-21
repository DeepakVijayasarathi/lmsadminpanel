import {
  Component, Input, OnInit, OnDestroy,
  AfterViewInit, ElementRef, ViewChild
} from '@angular/core';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';

@Component({
  selector: 'app-video-player',
  standalone: false,
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() videoUrl = '';

  @ViewChild('target', { static: true }) target!: ElementRef;

  private player!: Player;

  ngAfterViewInit(): void {
    this.player = videojs(this.target.nativeElement, {
      autoplay: false,
      controls: true,
      fluid: true,
      preload: 'metadata',
      playbackRates: [0.5, 1, 1.5, 2],
      sources: [
        {
          src: this.videoUrl,
          type: this.videoUrl?.endsWith('.webm') ? 'video/webm' : 'video/mp4'
        }
      ]
    });
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }
}
