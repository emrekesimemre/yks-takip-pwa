import connectMongo from "@/lib/mongo";
import Staff from "@/models/Staff";

export const STAFF_ROLES = ["admin", "teacher"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffRecord = {
  email: string;
  roles: StaffRole[];
};

export type StaffListItem = StaffRecord & {
  lockedAdmin: boolean;
};

const CACHE_TTL_MS = 30_000;

type RoleMapCache = {
  at: number;
  version: number;
  map: Map<string, StaffRecord>;
};

let cache: RoleMapCache | null = null;
let cacheVersion = 0;
let loading: Promise<Map<string, StaffRecord>> | null = null;
let seeded = false;

export class StaffError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StaffError";
    this.status = status;
  }
}

function isValidEmail(email: string) {
  if (email.length > 254 || /\s/.test(email)) return false;
  const [local, domain, extra] = email.split("@");
  if (!local || !domain || extra !== undefined) return false;
  const parts = domain.split(".");
  return parts.length >= 2 && parts.every((part) => part.length > 0);
}

function parseEmailList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(isValidEmail);
}

export function getBootstrapAdminEmails(): string[] {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

function getSeedTeacherEmails(): string[] {
  return parseEmailList(process.env.ALLOWED_EMAILS);
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!isValidEmail(email)) return null;
  return email;
}

export function normalizeRoles(value: unknown): StaffRole[] | null {
  if (!Array.isArray(value)) return null;
  const roles = new Set<StaffRole>();
  for (const role of value) {
    if (role !== "admin" && role !== "teacher") return null;
    roles.add(role);
  }
  return STAFF_ROLES.filter((role) => roles.has(role));
}

export function invalidateStaffCache() {
  cacheVersion += 1;
  cache = null;
}

function isBootstrapAdmin(email: string, bootstrapAdmins = getBootstrapAdminEmails()) {
  return bootstrapAdmins.includes(email);
}

export function isBootstrapAdminEmail(email: string | null | undefined) {
  const normalized = normalizeEmail(email ?? "");
  if (!normalized) return false;
  return isBootstrapAdmin(normalized);
}

function assertBootstrapActor(email: string) {
  if (!isBootstrapAdmin(email)) {
    throw new StaffError(
      "Personel ekleme, silme ve yetki değişikliği yalnızca ortam ayarındaki yöneticiye açıktır.",
      403,
    );
  }
}

export function countOtherAdmins(
  email: string,
  records: StaffRecord[],
  bootstrapAdmins: string[],
) {
  const admins = new Set(bootstrapAdmins);
  for (const record of records) {
    if (record.roles.includes("admin")) admins.add(record.email);
  }
  admins.delete(email);
  return admins.size;
}

export function assertCanUpdateRoles(input: {
  actorEmail: string;
  email: string;
  nextRoles: StaffRole[];
  records: StaffRecord[];
  bootstrapAdmins: string[];
}): string | null {
  const current = input.records.find((record) => record.email === input.email);
  const locked = isBootstrapAdmin(input.email, input.bootstrapAdmins);
  if (!current && !locked) return "Personel bulunamadı.";
  if (input.nextRoles.length === 0) return "En az bir rol seçin.";

  const currentlyAdmin =
    locked || Boolean(current?.roles.includes("admin"));
  const willBeAdmin = locked || input.nextRoles.includes("admin");

  if (currentlyAdmin && !willBeAdmin && input.actorEmail === input.email) {
    return "Kendi yönetici yetkinizi kaldıramazsınız.";
  }

  if (
    currentlyAdmin &&
    !willBeAdmin &&
    countOtherAdmins(input.email, input.records, input.bootstrapAdmins) === 0
  ) {
    return "Son yönetici kaldırılamaz.";
  }

  return null;
}

export function assertCanDelete(input: {
  actorEmail: string;
  email: string;
  records: StaffRecord[];
  bootstrapAdmins: string[];
}): string | null {
  if (input.actorEmail === input.email) {
    return "Kendi hesabınızı silemezsiniz.";
  }
  if (isBootstrapAdmin(input.email, input.bootstrapAdmins)) {
    return "Ortam ayarındaki yönetici panelden silinemez.";
  }

  const current = input.records.find((record) => record.email === input.email);
  if (!current) return "Personel bulunamadı.";

  if (
    current.roles.includes("admin") &&
    countOtherAdmins(input.email, input.records, input.bootstrapAdmins) === 0
  ) {
    return "Son yönetici kaldırılamaz.";
  }

  return null;
}

function withLockedAdmin(email: string, roles: StaffRole[], bootstrapAdmins: string[]) {
  if (!isBootstrapAdmin(email, bootstrapAdmins) || roles.includes("admin")) {
    return roles;
  }
  return normalizeRoles(["admin", ...roles]) ?? ["admin"];
}

async function readRecords(): Promise<StaffRecord[]> {
  const docs = await Staff.find().select("email roles").lean();
  return docs.map((doc) => ({
    email: doc.email,
    roles: normalizeRoles(doc.roles) ?? [],
  }));
}

async function ensureStaffSeeded() {
  if (seeded) return;

  await connectMongo();
  const count = await Staff.countDocuments();
  if (count === 0) {
    const teacherEmails = getSeedTeacherEmails();
    const adminEmails = getBootstrapAdminEmails();
    const emails = [...new Set([...teacherEmails, ...adminEmails])];
    if (emails.length > 0) {
      try {
        await Staff.insertMany(
          emails.map((email) => ({
            email,
            roles: withLockedAdmin(
              email,
              [
                ...(adminEmails.includes(email) ? (["admin"] as const) : []),
                ...(teacherEmails.includes(email) ? (["teacher"] as const) : []),
              ],
              adminEmails,
            ),
          })),
          { ordered: false },
        );
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
      }
    }
  }

  seeded = true;
}

async function syncBootstrapAdmins() {
  const bootstrapAdmins = getBootstrapAdminEmails();
  if (bootstrapAdmins.length === 0) return;

  await Staff.bulkWrite(
    bootstrapAdmins.map((email) => ({
      updateOne: {
        filter: { email },
        update: {
          $setOnInsert: { email },
          $addToSet: { roles: "admin" },
        },
        upsert: true,
      },
    })),
  );
}

async function loadRoleMap(): Promise<Map<string, StaffRecord>> {
  const version = cacheVersion;
  await ensureStaffSeeded();
  const records = await readRecords();
  if (version !== cacheVersion) return loadRoleMap();

  const map = new Map(records.map((record) => [record.email, record]));
  cache = { at: Date.now(), version, map };
  return map;
}

async function getRoleMap() {
  if (cache?.version === cacheVersion && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.map;
  }

  if (!loading) {
    loading = loadRoleMap().finally(() => {
      loading = null;
    });
  }

  return loading;
}

export async function resolveStaffAccess(email: string | null | undefined) {
  const normalized = normalizeEmail(email ?? "");
  if (!normalized) return { isAdmin: false, isTeacher: false };

  const map = await getRoleMap();
  const record = map.get(normalized);
  return {
    isAdmin:
      isBootstrapAdmin(normalized) || Boolean(record?.roles.includes("admin")),
    isTeacher: Boolean(record?.roles.includes("teacher")),
  };
}

export async function safeResolveStaffAccess(
  email: string | null | undefined,
) {
  try {
    const access = await resolveStaffAccess(email);
    return { ...access, error: false as const };
  } catch (error) {
    console.error("Yetki bilgisi alınamadı:", error);
    return { isAdmin: false, isTeacher: false, error: true as const };
  }
}

export async function listTeacherEmails(): Promise<string[]> {
  const map = await getRoleMap();
  return [...map.values()]
    .filter((record) => record.roles.includes("teacher"))
    .map((record) => record.email)
    .sort((a, b) => a.localeCompare(b, "tr"));
}

export async function listStaff(): Promise<StaffListItem[]> {
  await ensureStaffSeeded();
  await connectMongo();
  await syncBootstrapAdmins();
  invalidateStaffCache();

  const bootstrapAdmins = getBootstrapAdminEmails();
  const records = await readRecords();
  return records
    .map((record) => ({
      ...record,
      roles: withLockedAdmin(record.email, record.roles, bootstrapAdmins),
      lockedAdmin: isBootstrapAdmin(record.email, bootstrapAdmins),
    }))
    .sort((a, b) => a.email.localeCompare(b.email, "tr"));
}

export async function createStaff(
  actorEmailInput: string,
  emailInput: unknown,
  rolesInput: unknown,
) {
  const actorEmail = normalizeEmail(actorEmailInput);
  const email = normalizeEmail(emailInput);
  const roles = normalizeRoles(rolesInput);
  if (!actorEmail) throw new StaffError("Oturum geçersiz.", 401);
  assertBootstrapActor(actorEmail);
  if (!email) throw new StaffError("Geçerli bir e-posta girin.", 400);
  if (!roles || roles.length === 0) {
    throw new StaffError("En az bir rol seçin.", 400);
  }

  await ensureStaffSeeded();
  await connectMongo();

  const existing = await Staff.findOne({ email }).select("email").lean();
  if (existing) {
    throw new StaffError("Bu e-posta zaten kayıtlı.", 409);
  }

  const bootstrapAdmins = getBootstrapAdminEmails();
  await Staff.create({
    email,
    roles: withLockedAdmin(email, roles, bootstrapAdmins),
  });
  invalidateStaffCache();
}

export async function updateStaffRoles(
  actorEmailInput: string,
  emailInput: unknown,
  rolesInput: unknown,
) {
  const actorEmail = normalizeEmail(actorEmailInput);
  const email = normalizeEmail(emailInput);
  const roles = normalizeRoles(rolesInput);
  if (!actorEmail) throw new StaffError("Oturum geçersiz.", 401);
  assertBootstrapActor(actorEmail);
  if (!email) throw new StaffError("Geçerli bir e-posta girin.", 400);
  if (!roles) throw new StaffError("Geçersiz rol seçimi.", 400);

  await ensureStaffSeeded();
  await connectMongo();
  await syncBootstrapAdmins();

  const bootstrapAdmins = getBootstrapAdminEmails();
  const records = await readRecords();
  const message = assertCanUpdateRoles({
    actorEmail,
    email,
    nextRoles: roles,
    records,
    bootstrapAdmins,
  });
  if (message) {
    throw new StaffError(message, message === "Personel bulunamadı." ? 404 : 400);
  }

  await Staff.updateOne(
    { email },
    { $set: { roles: withLockedAdmin(email, roles, bootstrapAdmins) } },
  );
  invalidateStaffCache();
}

export async function deleteStaff(actorEmailInput: string, emailInput: unknown) {
  const actorEmail = normalizeEmail(actorEmailInput);
  const email = normalizeEmail(emailInput);
  if (!actorEmail) throw new StaffError("Oturum geçersiz.", 401);
  assertBootstrapActor(actorEmail);
  if (!email) throw new StaffError("Geçerli bir e-posta girin.", 400);

  await ensureStaffSeeded();
  await connectMongo();

  const bootstrapAdmins = getBootstrapAdminEmails();
  const records = await readRecords();
  const message = assertCanDelete({
    actorEmail,
    email,
    records,
    bootstrapAdmins,
  });
  if (message) {
    const status = message === "Personel bulunamadı." ? 404 : 400;
    throw new StaffError(message, status);
  }

  await Staff.deleteOne({ email });
  invalidateStaffCache();
}

function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}
