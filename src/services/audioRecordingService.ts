/**
 * Audio Recording Service
 * Handles microphone access, audio capture, encoding, and upload
 */

interface AudioRecordingConfig {
  mimeType?: string;
  audioBitsPerSecond?: number;
  sampleRate?: number;
}

interface RecordingState {
  isRecording: boolean;
  hasPermission: boolean;
  error: string | null;
}

class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private state: RecordingState = {
    isRecording: false,
    hasPermission: false,
    error: null,
  };

  private config: AudioRecordingConfig = {
    mimeType: 'audio/webm;codecs=opus',
    audioBitsPerSecond: 128000,
    sampleRate: 44100,
  };

  /**
   * Request microphone permission from user
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
        },
      });
      this.audioStream = stream;
      this.state.hasPermission = true;
      this.state.error = null;
      return true;
    } catch (error: any) {
      const errorMessage = this.getPermissionErrorMessage(error);
      this.state.error = errorMessage;
      this.state.hasPermission = false;
      console.error('Microphone permission denied:', errorMessage);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<boolean> {
    try {
      // Request permission if not already granted
      if (!this.audioStream) {
        const hasPermission = await this.requestMicrophonePermission();
        if (!hasPermission) {
          return false;
        }
      }

      if (!this.audioStream) {
        throw new Error('Failed to get audio stream');
      }

      // Check if browser supports requested mime type
      const supportedMimeType = this.getSupportedMimeType();
      if (!supportedMimeType) {
        throw new Error('No supported audio mime type available');
      }

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: supportedMimeType,
        audioBitsPerSecond: this.config.audioBitsPerSecond,
      });

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: MediaRecorderErrorEvent) => {
        this.state.error = `Recording error: ${event.error}`;
        console.error('Recording error:', event.error);
      };

      this.mediaRecorder.start();
      this.state.isRecording = true;
      this.state.error = null;
      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start recording';
      this.state.error = errorMessage;
      console.error('Error starting recording:', errorMessage);
      return false;
    }
  }

  /**
   * Stop recording audio and return blob
   */
  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      try {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
          this.state.error = 'No active recording';
          resolve(null);
          return;
        }

        this.mediaRecorder.onstop = () => {
          const supportedMimeType = this.getSupportedMimeType();
          const audioBlob = new Blob(this.audioChunks, {
            type: supportedMimeType || 'audio/webm',
          });
          this.state.isRecording = false;
          this.state.error = null;
          this.audioChunks = [];
          resolve(audioBlob);
        };

        this.mediaRecorder.stop();
      } catch (error: any) {
        this.state.error = error.message || 'Failed to stop recording';
        console.error('Error stopping recording:', error);
        this.state.isRecording = false;
        resolve(null);
      }
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): boolean {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
        return true;
      }
      return false;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to pause recording';
      console.error('Error pausing recording:', error);
      return false;
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): boolean {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
        return true;
      }
      return false;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to resume recording';
      console.error('Error resuming recording:', error);
      return false;
    }
  }

  /**
   * Cancel recording and clean up
   */
  cancelRecording(): void {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.audioChunks = [];
      this.state.isRecording = false;
      this.state.error = null;
    } catch (error: any) {
      console.error('Error canceling recording:', error);
    }
  }

  /**
   * Stop all media streams and clean up resources
   */
  stopAllStreams(): void {
    try {
      // Stop recorder BEFORE killing the stream tracks so the browser can
      // flush any pending data and fully release the device indicator.
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = null; // drop pending handler
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;

      if (this.audioStream) {
        this.audioStream.getTracks().forEach((track) => track.stop());
        this.audioStream = null;
      }

      this.audioChunks = [];
      this.state.isRecording = false;
      this.state.hasPermission = false;
    } catch (error: any) {
      console.error('Error stopping streams:', error);
    }
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return { ...this.state };
  }

  /**
   * Get supported mime type for this browser
   */
  private getSupportedMimeType(): string | null {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm;codecs=vp8',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return null;
  }

  /**
   * Convert blob to base64 for upload
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get duration of recorded audio in seconds
   */
  async getRecordingDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(blob);

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to get audio duration'));
      };

      audio.src = objectUrl;
    });
  }

  /**
   * Parse error and return user-friendly message
   */
  private getPermissionErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'Microphone permission denied. Please enable microphone access in browser settings.';
    }
    if (error.name === 'NotFoundError') {
      return 'No microphone found. Please check your audio input device.';
    }
    if (error.name === 'NotReadableError') {
      return 'Microphone is in use by another application. Please close other audio apps.';
    }
    if (error.name === 'SecurityError') {
      return 'Microphone access requires a secure context (HTTPS).';
    }
    return 'Microphone access failed. Please try again.';
  }

  /**
   * Check if browser supports audio recording
   */
  isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  /**
   * Get list of available audio input devices
   */
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'audioinput');
    } catch (error: any) {
      console.error('Error getting audio devices:', error);
      return [];
    }
  }
}

// Export singleton instance
export const audioRecordingService = new AudioRecordingService();

export default audioRecordingService;
