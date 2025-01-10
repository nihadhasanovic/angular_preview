import {
  Component,
  ElementRef,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Hls from 'hls.js';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SeoService } from '../seo.service';
import { ClipService } from '../clip.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css'],
  imports: [CommonModule, MatProgressBarModule],
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;
  hls!: Hls;
  isPaused: boolean = true;
  videoError: boolean = false;
  videoLoading: boolean = true;
  isMobileDevice: boolean = false;
  videoUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private deviceService: DeviceDetectorService,
    private seo: SeoService,
    private clipService: ClipService
  ) {}

  ngOnInit(): void {
    this.detectDeviceType();
    this.fetchClipAndSetMetaTags();
  }

  ngAfterViewInit(): void {
    // Ensure video player is initialized only when the video URL is available
    if (this.videoUrl) {
      this.initializeVideoPlayer();
    }
  }

  private detectDeviceType(): void {
    this.isMobileDevice = this.deviceService.isMobile();
    console.log('isMobileDevice', this.isMobileDevice);
  }

  /**
   * Fetches the clip data and sets meta tags.
   */
  private fetchClipAndSetMetaTags(): void {
    const videoId = this.route.snapshot.queryParamMap.get('id');

    if (!videoId) {
      this.setErrorState('Invalid or missing video ID in URL.');
      return;
    }

    this.videoLoading = true;

    this.clipService.getClipById(videoId).subscribe({
      next: (response) => {
        const clip = response.data?.getClip;
        if (!clip || !clip.media?.hlsPath || !clip.media?.thumbnailPath) {
          this.setErrorState('Video not found or missing required paths.');
          return;
        }


        this.videoUrl = clip.media.hlsPath;
        this.updateMetaTags(clip.media.thumbnailPath);

        if (this.videoPlayer) {
          this.initializeVideoPlayer();
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching clip:', err);
        this.setErrorState('Failed to load video data.');
      },
    });
  }

  /**
   * Initializes the video player with the stored HLS path.
   */
  private initializeVideoPlayer(): void {
    if (!this.videoUrl) {
      this.setErrorState('Video URL is not available for initialization.');
      return;
    }

    const video = this.videoPlayer.nativeElement;
    const isM3u8 = this.videoUrl.endsWith('.m3u8');
    const isMp4 = this.videoUrl.endsWith('.mp4');

    if (isM3u8 && Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(this.videoUrl);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.ERROR, () =>
        this.setErrorState('Error loading HLS stream.')
      );
    } else if (
      isMp4 ||
      (video.canPlayType('application/vnd.apple.mpegurl') && isM3u8)
    ) {
      video.src = this.videoUrl;
      video.addEventListener('error', () =>
        this.setErrorState('Error loading video file.')
      );
    } else {
      this.setErrorState('Unsupported video format.');
    }

    this.initVideoPlayer(video);
    this.initVideoPlayer(video);
  }

  private initVideoPlayer(video: HTMLVideoElement): void {
    video.muted = true;
    video
      .play()
      .then(() => {
        this.videoLoading = false;
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error attempting to play:', error);
        this.videoLoading = false;
        this.setErrorState('Failed to play video.');
      });

    video.addEventListener('play', () => {
      this.isPaused = false;
      this.cdr.detectChanges();
    });

    video.addEventListener('pause', () => {
      this.isPaused = true;
      this.cdr.detectChanges();
    });

    video.addEventListener('loadeddata', () => {
      this.videoLoading = false;
      this.cdr.detectChanges();
    });

    video.addEventListener('ended', () => {
      this.isPaused = true;
      this.cdr.detectChanges();
    });
  }

  private updateMetaTags(image: string): void {
    this.seo.generateTags({
      title: 'Football Fans',
      description: 'Join the ultimate community for football fans. Connect with other fans, share your passion, and stay updated with the latest in football.',
      image: image,
    });
  }

  private setErrorState(message: string): void {
    this.videoError = true;
    this.videoLoading = false;
    console.error(`VIDEO_PLAYER_ERROR: ${message}`);
    this.cdr.detectChanges();
  }


  toggleVideo(): void {
    const video = this.videoPlayer.nativeElement;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }

    this.isPaused = video.paused;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.hls) {
      this.hls.destroy();
    }
  }
}
