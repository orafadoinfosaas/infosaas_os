export function generateSlug(topic: string): string {
  const date = new Date().toISOString().split('T')[0]
  const slug = topic
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
  return `${date}_${slug}`
}
