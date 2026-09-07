export type ChatTurn = {
  role: "user" | "assistant"
  content: string
}

const GREETING =
  "Fixture mode is on. Hold the mic or type a line — I'll stub the Speech Engine turn."

export function greetingReply() {
  return GREETING
}

export function stubReply(userText: string, _history: ChatTurn[] = []): string {
  const text = userText.trim()
  const lower = text.toLowerCase()

  if (!text) {
    return "I didn't catch that. Try again, or type a line below."
  }

  if (/\b(hello|hi|hey|good morning|good afternoon)\b/.test(lower)) {
    return "Hey. I'm the stub assistant behind this Speech Engine demo. Ask about voice, barge-in, or how the two modes work."
  }

  if (/\b(barge|interrupt|cut me off|interruption)\b/.test(lower)) {
    return "Barge-in cancels the spoken reply as soon as you start talking again. In live mode, Speech Engine fires an abort signal so the in-flight turn stops."
  }

  if (/\b(speech engine|elevenlabs|eleven labs|stt|tts)\b/.test(lower)) {
    return "Speech Engine handles speech-to-text, text-to-speech, and turn-taking. This page keeps the LLM as a tiny local stub so the voice layer is the demo."
  }

  if (/\b(who are you|what are you|what is this)\b/.test(lower)) {
    return "A one-user voice chat. ElevenLabs is the voice layer. I return short fixture text instead of a real RAG stack."
  }

  if (/\b(fixture|demo mode|no api key)\b/.test(lower)) {
    return "Without ELEVENLABS_API_KEY the UI still runs. Transcripts and audio are stubbed locally so bun run dev is enough."
  }

  if (text.length > 180) {
    return "That's a long turn. I'll keep this short: Speech Engine would stream a reply while you can barge in."
  }

  return `Got it: ${text} In live mode, Speech Engine would speak this after the same stub turn.`
}

export const FIXTURE_UTTERANCES = [
  "What does Speech Engine actually do?",
  "How does barge-in work while you're talking?",
  "Is this fixture mode or a live ElevenLabs key?",
] as const
