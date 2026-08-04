function compactUnique(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
}

export function volunteerTrackingRecipients(input: {
  assignedNgoId: string | null
  volunteerId: string
}) {
  return compactUnique([input.assignedNgoId, input.volunteerId])
}

export function ngoProgressNotificationRecipients(assignedNgoId: string | null) {
  return compactUnique([assignedNgoId])
}
