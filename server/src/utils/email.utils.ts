export function renderTemplate(
  template: string,
  context: Record<string, string | number>,
): string {
  let html = template;

  for (const [key, value] of Object.entries(context)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, String(value));
  }

  return html;
}
