const SAMPLE_RATE = 16000;

export class MicRecorder {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;

  async start(onChunk: (pcm: ArrayBuffer) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });

    this.context = new AudioContext({ sampleRate: SAMPLE_RATE });
    await this.context.audioWorklet.addModule("/audio-worklet.js");

    const source = this.context.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.context, "audio-chunk-processor");
    this.node.port.onmessage = (event) => onChunk(event.data as ArrayBuffer);

    source.connect(this.node);
  }

  stop(): void {
    this.node?.port.close();
    this.node?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close();
    this.node = null;
    this.stream = null;
    this.context = null;
  }
}

export class PcmPlayer {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStart = 0;
  private readonly bins = new Uint8Array(64);

  private ensure(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.connect(this.context.destination);
      this.nextStart = this.context.currentTime;
    }
    return this.context;
  }

  async resume(): Promise<void> {
    await this.ensure().resume();
  }

  enqueue(pcm: ArrayBuffer): void {
    const context = this.ensure();
    const samples = new Int16Array(pcm);
    if (!samples.length) return;

    const buffer = context.createBuffer(1, samples.length, SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) channel[i] = samples[i] / 0x8000;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser!);

    const startAt = Math.max(context.currentTime, this.nextStart);
    source.start(startAt);
    this.nextStart = startAt + buffer.duration;
  }

  level(): number {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.bins);
    let sum = 0;
    for (const value of this.bins) sum += value;
    return Math.min(1, sum / this.bins.length / 140);
  }

  get speaking(): boolean {
    return !!this.context && this.nextStart > this.context.currentTime + 0.05;
  }

  stop(): void {
    void this.context?.close();
    this.context = null;
    this.analyser = null;
    this.nextStart = 0;
  }
}
