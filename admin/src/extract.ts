import {Mp3Encoder} from '@breezystack/lamejs';

const MONO_AUDIO_CHANNELS = 1;
const STEREO_AUDIO_CHANNELS = 2;
const HZ = 44100; // CD Quality
const BIT_RATE = 128; // Standard bit rate.
const LOWER_BIT_RATE = 96; // Lower bit rate.
const OUTPUT_FORMAT = 'audio/mpeg';
const MAX_SAMPLES_PER_FRAME = 1152;

interface ExtractionOptions {
  readonly start: number;
  readonly end: number;
  readonly channel: 'mono' | 'stereo';
};

export async function extractAudio(url: string, {start, end, channel}: ExtractionOptions): Promise<Blob> {
  const onlineContext = new AudioContext();
  const response = await fetch(url);
  const rawBuffer = await response.arrayBuffer();
  const decodedBuffer = await onlineContext.decodeAudioData(rawBuffer);
  const duration = end - start;
  const offlineContext = new OfflineAudioContext(
    channel == 'mono' ? MONO_AUDIO_CHANNELS : STEREO_AUDIO_CHANNELS, HZ * duration, HZ);
  const soundSource = offlineContext.createBufferSource();
  soundSource.buffer = decodedBuffer;
  soundSource.connect(offlineContext.destination);
  soundSource.start(onlineContext.currentTime, start, duration);
  const renderedBuffer = await offlineContext.startRendering();
  const encoder = new Mp3Encoder(
    renderedBuffer.numberOfChannels,
    renderedBuffer.sampleRate,
    channel === 'stereo' ? BIT_RATE : LOWER_BIT_RATE);
  const mp3Buffers: Uint8Array[] = [];
  if (renderedBuffer.numberOfChannels == 2) {
    const leftSamples = convertBuffer(renderedBuffer.getChannelData(0));
    const rightSamples = convertBuffer(renderedBuffer.getChannelData(1));
    for (let i = 0; i < leftSamples.length; i += MAX_SAMPLES_PER_FRAME) {
      const left = leftSamples.subarray(i, i + MAX_SAMPLES_PER_FRAME);
      const right = rightSamples.subarray(i, i + MAX_SAMPLES_PER_FRAME);
      mp3Buffers.push(encoder.encodeBuffer(left, right));
    }
  } else if (renderedBuffer.numberOfChannels == 1) {
    const monoSamples = convertBuffer(renderedBuffer.getChannelData(0));
    for (let i = 0; i < monoSamples.length; i += MAX_SAMPLES_PER_FRAME) {
      const mono = monoSamples.subarray(i, i + MAX_SAMPLES_PER_FRAME);
      mp3Buffers.push(encoder.encodeBuffer(mono));
    }
  } else {
    throw new Error(`unknown number of channels: ${renderedBuffer.numberOfChannels}`);
  }
  mp3Buffers.push(encoder.flush());
  return new Blob(mp3Buffers, {type: OUTPUT_FORMAT});
}

function convertBuffer(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
  }
  return output;
};
