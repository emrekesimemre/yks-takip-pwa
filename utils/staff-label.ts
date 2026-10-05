export const STAFF_NAME_MAX = 80;

export function parseStaffName(
  value: unknown,
): { ok: true; name: string } | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "Ad soyad gerekli." };
  }

  const name = value.replace(/[\r\n\0]+/g, " ").replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, message: "Ad soyad gerekli." };
  if (name.length > STAFF_NAME_MAX) {
    return { ok: false, message: "Ad soyad en fazla 80 karakter olabilir." };
  }

  return { ok: true, name };
}

export function formatTeacherLabel(email: string, name?: string | null): string {
  const parsed = typeof name === "string" ? parseStaffName(name) : null;
  if (parsed?.ok) return parsed.name;
  if (!email) return "";
  const localPart = email.split("@")[0] ?? email;
  return localPart.replaceAll(".", " ");
}
