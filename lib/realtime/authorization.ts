export function userChannel(userId: string) {
  return `user:${userId}`
}

export function rescueChannel(assignmentId: string) {
  return `rescue:${assignmentId}`
}

export function buildRealtimeCapability(
  userId: string,
  assignmentIds: string[],
  role?: string,
) {
  const capability: Record<string, Array<"subscribe" | "presence">> = {
    [userChannel(userId)]: ["subscribe"],
  }

  for (const assignmentId of new Set(assignmentIds)) {
    capability[rescueChannel(assignmentId)] =
      role === "VOLUNTEER" ? ["subscribe", "presence"] : ["subscribe"]
  }

  return capability
}

export function canSubscribeToRescueChannels(role: string) {
  return role === "NGO" || role === "VOLUNTEER"
}
