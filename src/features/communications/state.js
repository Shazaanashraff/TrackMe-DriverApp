export const resourceId = value => String(value?._id || value || '');
export const colomboToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const newRequestId = () => `comm-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export function announcementDraft(preset, rows, selected = null, date = colomboToday()) {
  const recipientIds = (selected === null ? rows.map(r => resourceId(r.riderId)) : selected).slice().sort();
  return { path: '/driver/announcements', body: { requestId: newRequestId(), templateId: preset.id, text: preset.text,
    parameters: preset.parameters, date, audience: selected === null ? 'all' : 'selected',
    riderIds: recipientIds, previewRiderIds: recipientIds, recipientCount: recipientIds.length, correctionOf: preset.correctionOf },
    preview: { text: preset.text, date, audience: selected === null ? 'All enrolled riders' : rows.filter(r => recipientIds.includes(resourceId(r.riderId))).map(r => r.riderName).join(', '), count: recipientIds.length } };
}
export function deliverySummary(announcement) {
  if (!announcement?.recipients) return 'Sending…';
  const counts = announcement.recipients.reduce((acc, r) => ({ ...acc, [r.state]: (acc[r.state] || 0) + 1 }), {});
  if (counts.pending) return `Sending · ${counts.sent || 0}/${announcement.recipients.length} sent`;
  return `Sent to ${counts.sent || 0} riders${counts.failed ? ` · ${counts.failed} failed` : ''}${counts.skipped ? ` · ${counts.skipped} no longer enrolled` : ''}`;
}

// What a rider answered at signup, as a line to show a driver. Only SCHOOL is
// asked for a grade (backend utils/enrollmentSchema.js SIGNUP_FIELDS), and the
// server already withholds the answer for any other category, so an empty value
// means "no line to draw" rather than "missing".
//
// The stored answer is free text: a parent may type "7", "Grade 7" or "Year 10".
// Prefixing a bare number is what makes all three read naturally.
export function gradeLine(category, grade) {
  const value = String(grade || '').trim();
  if (category !== 'SCHOOL' || !value) return '';
  return /^\d/.test(value) ? `Grade ${value}` : value;
}
