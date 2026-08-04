export type AppRole = "DONOR" | "NGO" | "VOLUNTEER"

export function getRoleHomePath(role?: AppRole | null) {
  if (role === "DONOR") {
    return "/donor/requests"
  }

  if (role === "NGO") {
    return "/ngo/inbox"
  }

  if (role === "VOLUNTEER") {
    return "/volunteer"
  }

  return null
}
