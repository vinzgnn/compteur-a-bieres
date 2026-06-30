export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  // Lundi de la semaine courante
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

export function getPreviousWeekRange(): { start: Date; end: Date } {
  const { start } = getWeekRange()
  const prevMonday = new Date(start)
  prevMonday.setDate(start.getDate() - 7)
  const prevSunday = new Date(start)
  prevSunday.setDate(start.getDate() - 1)
  prevSunday.setHours(23, 59, 59, 999)
  return { start: prevMonday, end: prevSunday }
}
