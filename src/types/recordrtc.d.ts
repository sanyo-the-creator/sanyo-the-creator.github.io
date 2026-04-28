declare module 'recordrtc' {
  export default class RecordRTC {
    constructor(stream: MediaStream | HTMLCanvasElement | HTMLVideoElement, options: any);
    startRecording(): void;
    stopRecording(callback: () => void): void;
    getBlob(): Blob;
    destroy(): void;
    static CanvasRecorder: any;
  }
}
