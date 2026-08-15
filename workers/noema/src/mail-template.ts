/** Shared CTA substitution for docs/email bodies. */

const MAGIC_HREF_HTML =
  "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type={{ .Type }}";
const MAGIC_HREF_TEXT =
  "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type={{ .Type }}";
const ENROLL_HREF = "{{ .EnrollmentUrl }}";

export function escapeHref(href: string): string {
  return href.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

export function applyMagicLinkHref(template: string, href: string): string {
  return template.split(MAGIC_HREF_HTML).join(escapeHref(href)).split(MAGIC_HREF_TEXT).join(href);
}

export function applyEnrollmentHref(template: string, href: string, asHtml = false): string {
  return template.split(ENROLL_HREF).join(asHtml ? escapeHref(href) : href);
}

export function stripSubjectHeader(body: string): string {
  return body.replace(/^Subject:[^\n]*\n+/, "");
}
