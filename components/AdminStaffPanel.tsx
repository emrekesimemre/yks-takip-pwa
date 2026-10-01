"use client";

import { useEffect, useRef, useState } from "react";
import { FiShield, FiTrash2, FiUserPlus } from "react-icons/fi";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type StaffRole = "admin" | "teacher";

type StaffMember = {
  email: string;
  roles: StaffRole[];
  lockedAdmin: boolean;
};

type StaffResponse = {
  staff: StaffMember[];
  currentEmail: string;
};

const roleLabels: Record<StaffRole, string> = {
  teacher: "Öğretmen",
  admin: "Yönetici",
};

export default function AdminStaffPanel() {
  const [data, setData] = useState<StaffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [teacherRole, setTeacherRole] = useState(true);
  const [adminRole, setAdminRole] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const roleUpdateGen = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStaff = async () => {
      try {
        const res = await fetch("/api/admin/staff", { signal: controller.signal });
        const body = (await res.json()) as StaffResponse & { error?: string };
        if (!res.ok) {
          throw new Error(body.error || "Personel listesi alınamadı.");
        }
        setData(body);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Personel listesi alınamadı.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchStaff();
    return () => controller.abort();
  }, []);

  const applyResponse = (body: StaffResponse) => {
    setData(body);
    setError("");
  };

  const addStaff = async () => {
    const roles: StaffRole[] = [
      ...(adminRole ? (["admin"] as const) : []),
      ...(teacherRole ? (["teacher"] as const) : []),
    ];
    if (roles.length === 0) {
      setError("En az bir rol seçin.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, roles }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Personel eklenemedi.");
      applyResponse(body);
      setEmail("");
      setTeacherRole(true);
      setAdminRole(false);
      if (body.emailSent) {
        toast.success("Personel eklendi. Davet maili gönderildi.");
      } else {
        toast.warning("Personel eklendi, mail gönderilemedi.");
      }
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Personel eklenemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateRoles = async (member: StaffMember, roles: StaffRole[]) => {
    if (roles.length === 0) {
      setError("En az bir rol seçin.");
      return;
    }

    const gen = ++roleUpdateGen.current;
    setPendingEmail(member.email);
    setError("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, roles }),
      });
      const body = await res.json();
      if (gen !== roleUpdateGen.current) return;
      if (!res.ok) throw new Error(body.error || "Roller güncellenemedi.");
      applyResponse(body);
      if (body.emailSent) {
        toast.success("Yetkiler güncellendi. Bilgi maili gönderildi.");
      } else {
        toast.warning("Yetkiler güncellendi, mail gönderilemedi.");
      }
    } catch (saveError: unknown) {
      if (gen !== roleUpdateGen.current) return;
      setError(saveError instanceof Error ? saveError.message : "Roller güncellenemedi.");
    } finally {
      if (gen === roleUpdateGen.current) {
        setPendingEmail(null);
      }
    }
  };

  const removeStaff = async () => {
    if (!deleteTarget) return;
    setPendingEmail(deleteTarget.email);
    setError("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deleteTarget.email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Personel silinemedi.");
      applyResponse(body);
      setDeleteTarget(null);
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Personel silinemedi.");
    } finally {
      setPendingEmail(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Personel listesi yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <div className="card-premium p-4 sm:p-5 border border-slate-100 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <FiUserPlus className="text-xl text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Yeni personel</h2>
            <p className="text-sm text-slate-500 mt-1">
              Giriş Google hesabıyla yapılır. E-posta, kullanıcının Google adresinin aynısı olmalıdır.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label htmlFor="staff-email" className="block text-sm font-semibold text-slate-700 mb-2">
              E-posta
            </label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@gmail.com"
              className="w-full min-h-13 px-4 py-3 rounded-xl border border-slate-200 text-base bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 lg:pb-3">
            <RoleCheck
              label="Öğretmen"
              checked={teacherRole}
              onChange={setTeacherRole}
            />
            <RoleCheck
              label="Yönetici"
              checked={adminRole}
              onChange={setAdminRole}
            />
            <button
              type="button"
              onClick={addStaff}
              disabled={isSaving || email.trim().length === 0}
              className="btn-primary disabled:opacity-60"
            >
              {isSaving ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!data || data.staff.length === 0 ? (
        <div className="card-premium p-12 text-center border border-slate-100">
          <p className="text-slate-600">Henüz personel yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.staff.map((member) => {
            const isSelf = member.email === data.currentEmail;
            const busy = pendingEmail === member.email;
            const adminLocked = member.lockedAdmin || isSelf;

            return (
              <article
                key={member.email}
                className="card-premium border border-slate-100 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FiShield className="text-violet-500 shrink-0" />
                      <p className="font-semibold text-slate-900 truncate">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {member.roles.map((role) => (
                        <span
                          key={role}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            role === "admin"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {roleLabels[role]}
                        </span>
                      ))}
                      {member.lockedAdmin && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                          Ortam ayarı
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                          Siz
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <RoleCheck
                      label="Öğretmen"
                      checked={member.roles.includes("teacher")}
                      disabled={busy}
                      onChange={(checked) => {
                        const roles = checked
                          ? [...member.roles, "teacher" as const]
                          : member.roles.filter((role) => role !== "teacher");
                        void updateRoles(member, roles);
                      }}
                    />
                    <RoleCheck
                      label="Yönetici"
                      checked={member.roles.includes("admin")}
                      disabled={busy || adminLocked}
                      title={adminCheckboxTitle(member.lockedAdmin, isSelf)}
                      onChange={(checked) => {
                        const roles = checked
                          ? [...member.roles, "admin" as const]
                          : member.roles.filter((role) => role !== "admin");
                        void updateRoles(member, roles);
                      }}
                    />
                    <button
                      type="button"
                      disabled={busy || member.lockedAdmin || isSelf}
                      title={deleteButtonTitle(member.lockedAdmin, isSelf)}
                      onClick={() => setDeleteTarget(member)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 />
                      Sil
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Personeli kaldır"
        message={
          deleteTarget
            ? `${deleteTarget.email} hesabının panele girişi kapanacak. Öğrenci kayıtları silinmez.`
            : ""
        }
        confirmLabel="Kaldır"
        variant="danger"
        isLoading={pendingEmail === deleteTarget?.email}
        onConfirm={() => void removeStaff()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function adminCheckboxTitle(lockedAdmin: boolean, isSelf: boolean) {
  if (lockedAdmin) return "Ortam ayarındaki yönetici kalır";
  if (isSelf) return "Kendi yönetici yetkinizi kaldıramazsınız";
  return undefined;
}

function deleteButtonTitle(lockedAdmin: boolean, isSelf: boolean) {
  if (lockedAdmin) return "Ortam ayarındaki yönetici silinemez";
  if (isSelf) return "Kendi hesabınızı silemezsiniz";
  return "Personeli kaldır";
}

type RoleCheckProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  title?: string;
  onChange: (checked: boolean) => void;
};

function RoleCheck({ label, checked, disabled, title, onChange }: Readonly<RoleCheckProps>) {
  return (
    <label
      title={title}
      className={`inline-flex items-center gap-2 text-sm font-medium text-slate-700 ${disabled ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />
      {label}
    </label>
  );
}
