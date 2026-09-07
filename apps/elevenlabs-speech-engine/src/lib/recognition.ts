export function createSpeechRecognition(): SpeechRecognitionLike | null {
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!Ctor) {
    return null
  }

  const recognition = new Ctor()
  recognition.lang = "en-US"
  recognition.interimResults = true
  recognition.continuous = false
  return recognition
}
