/**
 * Audio recording utility
 * 
 * Handles browser audio recording using MediaRecorder API.
 * Records audio and provides it as a Blob for transcription.
 */

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      this.stream = stream
      this.audioChunks = []

      // Use WebM format for better browser support
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
      }

      // Fallback to default if WebM not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        delete options.mimeType
      }

      this.mediaRecorder = new MediaRecorder(stream, options)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`)
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recording not started'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        this.cleanup()
        reject(new Error('Recording error'))
      }

      this.mediaRecorder.stop()
    })
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }
}

