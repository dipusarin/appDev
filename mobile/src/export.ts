import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { TimelineEntry } from './api/types';
import { formatTimeOfDay } from './utils/time';

const FEEDING_LABELS: Record<string, string> = { breastfeed: 'Breastfed', bottle: 'Bottle', solids: 'Solids', combo: 'Combo feed' };
const DIAPER_LABELS: Record<string, string> = { wet: 'Wet', dirty: 'Dirty', dry: 'Dry' };
const SLEEP_LABELS: Record<string, string> = { nap: 'Nap', night: 'Night sleep' };

function describeEntry(entry: TimelineEntry): { category: string; details: string } {
  if (entry.kind === 'feeding') {
    const parts = [FEEDING_LABELS[entry.type as string] ?? entry.type ?? ''];
    if (entry.amountMl) parts.push(`${entry.amountMl} ml`);
    if (entry.durationMin) parts.push(`${entry.durationMin} min`);
    return { category: 'Feeding', details: parts.filter(Boolean).join(' · ') };
  }
  if (entry.kind === 'pump') {
    return { category: 'Pump', details: entry.durationMin ? `${entry.durationMin} min` : '' };
  }
  if (entry.kind === 'sleep') {
    const parts = [SLEEP_LABELS[entry.type as string] ?? entry.type ?? ''];
    if (entry.durationMin) parts.push(`${entry.durationMin} min`);
    return { category: 'Sleep', details: parts.filter(Boolean).join(' · ') };
  }
  const parts = [DIAPER_LABELS[entry.type as string] ?? entry.type ?? ''];
  if (entry.texture) parts.push(entry.texture);
  if (entry.color) parts.push(entry.color);
  return { category: 'Diaper', details: parts.filter(Boolean).join(' · ') };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildSummaryHtml(babyName: string, entries: TimelineEntry[], periodLabel: string): string {
  const byDay = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const day = new Date(entry.timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(entry);
  }

  const sections = Array.from(byDay.entries())
    .map(([day, dayEntries]) => {
      const rows = dayEntries
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((entry) => {
          const { category, details } = describeEntry(entry);
          return `<tr>
            <td>${escapeHtml(formatTimeOfDay(entry.timestamp))}</td>
            <td>${escapeHtml(category)}</td>
            <td>${escapeHtml(details)}</td>
            <td>${escapeHtml(entry.notes || '')}</td>
            <td>${escapeHtml(entry.loggedByName)}</td>
          </tr>`;
        })
        .join('');
      return `<h2>${escapeHtml(day)}</h2>
        <table>
          <thead><tr><th>Time</th><th>Type</th><th>Details</th><th>Notes</th><th>By</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #241B3A; padding: 24px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #6F6489; margin-bottom: 24px; font-size: 13px; }
  h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #EAE2F7; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #6F6489; padding: 6px 8px; border-bottom: 1px solid #EAE2F7; }
  td { padding: 6px 8px; border-bottom: 1px solid #F5F0FC; }
</style>
</head>
<body>
  <h1>${escapeHtml(babyName)} — Care Summary</h1>
  <div class="subtitle">${escapeHtml(periodLabel)} &middot; Generated ${escapeHtml(new Date().toLocaleString())}</div>
  ${sections || '<p>No entries in this period.</p>'}
</body>
</html>`;
}

export async function shareSummaryPdf(babyName: string, entries: TimelineEntry[], periodLabel: string) {
  const html = buildSummaryHtml(babyName, entries, periodLabel);
  const { uri } = await Print.printToFileAsync({ html });
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${babyName} care summary` });
  }
  return { uri, available };
}
