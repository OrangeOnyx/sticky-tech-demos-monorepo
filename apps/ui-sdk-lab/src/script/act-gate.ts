type WriteDetails = {
  source?: string
}

function createActGate() {
  let inFlight = 0
  let suppress = false

  return {
    start() {
      inFlight += 1
    },
    finish() {
      inFlight = Math.max(0, inFlight - 1)
      if (inFlight === 0) suppress = false
    },
    noteReset() {
      if (inFlight > 0) suppress = true
      return inFlight > 0
    },
    get pending() {
      return inFlight > 0 || suppress
    },
    accepts(details?: WriteDetails) {
      return !(suppress && details?.source === "agent")
    },
  }
}

type ActGate = ReturnType<typeof createActGate>

export { createActGate, type ActGate, type WriteDetails }
