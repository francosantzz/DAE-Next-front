const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type FourWeekCycleNumber = 1 | 2 | 3 | 4

const isFourWeekCycleNumber = (value: number): value is FourWeekCycleNumber =>
  value === 1 || value === 2 || value === 3 || value === 4

export const isIsoDate = (value: string) => {
  if (!ISO_DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(`${value}T00:00:00`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  )
}

export const getFourWeekCycleFromDate = (
  isoDate: string,
): FourWeekCycleNumber | null => {
  if (!isIsoDate(isoDate)) return null

  const date = new Date(`${isoDate}T00:00:00`)
  const dayOfMonth = date.getDate()
  const dayOfWeek = date.getDay()
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const firstOccurrenceDay = 1 + ((dayOfWeek - firstDayOfWeek + 7) % 7)
  const occurrence = Math.floor((dayOfMonth - firstOccurrenceDay) / 7) + 1

  return isFourWeekCycleNumber(occurrence) ? occurrence : null
}

export const normalizeCalendarRotativoDates = (dates: string[]) =>
  Array.from(
    new Set(dates.filter((date) => getFourWeekCycleFromDate(date) !== null)),
  ).sort((a, b) => a.localeCompare(b))
