// Frame-exact MP4 export in the browser: WebCodecs H.264 + AAC, muxed with
// mp4-muxer (MIT, vendored). Chrome/Edge 94+ required.

import { ArrayBufferTarget, Muxer } from './vendor/mp4-muxer.mjs'
import { DURATION, FPS, createRenderer } from './video.js'

export const PRESETS = {
  '4k': { width: 3840, height: 2160, codec: 'avc1.640033', bitrate: 32_000_000 },
  '1080p': { width: 1920, height: 1080, codec: 'avc1.640028', bitrate: 12_000_000 },
}

/**
 * @param {{ preset: '4k'|'1080p', assets: object, audio: AudioBuffer|null, onProgress?: (p:number, label:string)=>void }} o
 * @returns {Promise<ArrayBuffer>}
 */
export async function exportMp4({ preset = '1080p', assets, audio, onProgress = () => {} }) {
  const cfg = PRESETS[preset]
  const { width, height } = cfg
  const support = await VideoEncoder.isConfigSupported({ codec: cfg.codec, width, height, bitrate: cfg.bitrate, framerate: FPS })
  if (!support.supported) throw new Error(`H.264 ${width}×${height} encoding is not supported in this browser`)

  const withAudio = !!audio && (await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: audio.sampleRate, numberOfChannels: 2, bitrate: 192_000 })).supported

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height, frameRate: FPS },
    ...(withAudio ? { audio: { codec: 'aac', sampleRate: audio.sampleRate, numberOfChannels: 2 } } : {}),
    fastStart: 'in-memory',
  })

  let failure = null
  const venc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (failure = e),
  })
  venc.configure({ codec: cfg.codec, width, height, bitrate: cfg.bitrate, framerate: FPS, latencyMode: 'quality', avc: { format: 'avc' } })

  if (withAudio) {
    onProgress(0, 'Encoding audio')
    const aenc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => (failure = e),
    })
    aenc.configure({ codec: 'mp4a.40.2', sampleRate: audio.sampleRate, numberOfChannels: 2, bitrate: 192_000 })
    const block = 1024
    const L = audio.getChannelData(0)
    const R = audio.getChannelData(1)
    for (let i = 0; i < audio.length; i += block) {
      const n = Math.min(block, audio.length - i)
      const planar = new Float32Array(n * 2)
      planar.set(L.subarray(i, i + n), 0)
      planar.set(R.subarray(i, i + n), n)
      const data = new AudioData({
        format: 'f32-planar', sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: 2,
        timestamp: Math.round((i / audio.sampleRate) * 1e6), data: planar,
      })
      aenc.encode(data)
      data.close()
    }
    await aenc.flush()
    aenc.close()
  }

  const canvas = new OffscreenCanvas(width, height)
  const renderer = createRenderer(canvas, assets)
  const frames = Math.round(DURATION * FPS)
  const frameUs = 1e6 / FPS
  for (let i = 0; i < frames; i++) {
    if (failure) throw failure
    renderer.render(i / FPS)
    const frame = new VideoFrame(canvas, { timestamp: Math.round(i * frameUs), duration: Math.round(frameUs) })
    venc.encode(frame, { keyFrame: i % (FPS * 2) === 0 })
    frame.close()
    while (venc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 2))
    if (i % 10 === 0) {
      onProgress(i / frames, `Rendering frame ${i + 1} / ${frames}`)
      await new Promise((r) => setTimeout(r, 0))
    }
  }
  await venc.flush()
  venc.close()
  if (failure) throw failure
  muxer.finalize()
  onProgress(1, 'Done')
  return target.buffer
}
