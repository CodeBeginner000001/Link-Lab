import { Injectable } from '@nestjs/common';

@Injectable()
export class AvatarService {
  private readonly backgroundColors = [
    '#1E40AF',
    '#7C3AED',
    '#DB2777',
    '#059669',
    '#EA580C',
    '#0F766E',
    '#B91C1C',
    '#4338CA',
  ];
  generateAvatar(name: string) {
    const cleanName = name.trim();
    const initials = this.getInitials(cleanName);
    const bgColor = this.getColorFromName(cleanName);
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="${this.escapeXml(cleanName)}">
        <rect width="256" height="256" fill="${bgColor}" />
        <text
          x="50%"
          y="50%"
          dy="0.1em"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#ffffff"
          font-family="Arial, Helvetica, sans-serif"
          font-size="100"
          font-weight="500"
        >
          ${this.escapeXml(initials)}
        </text>
      </svg>
    `.trim();
  }
  private getInitials(name: string): string {
    const parts = name
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  private getColorFromName(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.backgroundColors.length;
    return this.backgroundColors[index];
  }
  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
