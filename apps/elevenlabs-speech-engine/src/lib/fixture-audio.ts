function speakWithSynthesis(text: string, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      reject(new Error("speechSynthesis unavailable"))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1
    utterance.lang = "en-US"

    const cleanup = () => {
      utterance.onend = null
      utterance.onerror = null
      window.speechSynthesis.cancel()
    }

    utterance.onend = () => {
      cleanup()
      resolve()
    }
    utterance.onerror = () => {
      cleanup()
      resolve()
    }

    signal.addEventListener(
      "abort",
      () => {
        cleanup()
        resolve()
      },
      { once: true },
    )

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

function speakWithTone(text: string, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) {
      resolve()
      return
    }

    const context = new AudioContextCtor()
    const duration = Math.min(4.5, 0.7 + text.split(/\s+/).length * 0.12)
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = "sine"
    oscillator.frequency.value = 196
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.04, context.currentTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration)

    const finish = () => {
      oscillator.disconnect()
      gain.disconnect()
      void context.close()
      resolve()
    }

    oscillator.onended = finish
    signal.addEventListener(
      "abort",
      () => {
        try {
          oscillator.stop()
        } catch {
          // already stopped
        }
        finish()
      },
      { once: true },
    )
  })
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

export async function speakFixtureReply(
  text: string,
  signal: AbortSignal,
) {
  try {
    await speakWithSynthesis(text, signal)
  } catch {
    await speakWithTone(text, signal)
  }
}

export function cancelFixtureSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
}
