const APP_LOCALE = "en-IN"
const APP_TIME_ZONE = "Asia/Kolkata"

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: APP_TIME_ZONE,
})

const timeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
})

export function formatAppDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatAppTime(value: Date | string) {
  return timeFormatter.format(new Date(value))
}
