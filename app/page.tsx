import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isAdminEmail, isTeacherEmail } from "@/lib/auth";
import LoginButton from "@/components/LoginButton";
import HomeAuthActions from "@/components/HomeAuthActions";
import AppFooter from "@/components/AppFooter";
import { FiBarChart2, FiCalendar, FiTarget } from "react-icons/fi";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const isAdmin = isAdminEmail(email);
  const isTeacher = isTeacherEmail(email);

  if (session && !isAdmin) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: FiCalendar,
      title: "Haftalık Plan",
      desc: "Konu seçimi ve yazdırılabilir çizelge",
    },
    {
      icon: FiBarChart2,
      title: "Deneme Analizi",
      desc: "Net takibi ve ders bazlı performans",
    },
    {
      icon: FiTarget,
      title: "İlerleme Takibi",
      desc: "TYT/AYT konu tamamlama oranları",
    },
  ];

  return (
    <div className="min-h-screen login-bg flex flex-col relative overflow-hidden">
      <main className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="max-w-lg w-full relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 mb-6 animate-float">
              <FiTarget className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
              YKS Takip
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm mx-auto">
              Öğrencilerinizin haftalık programını ve deneme netlerini profesyonelce
              yönetin.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="text-center p-3 rounded-xl bg-slate-50/80 border border-slate-100"
                >
                  <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="text-blue-600 text-lg" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {session ? (
              <HomeAuthActions
                userName={session.user?.name}
                isAdmin={isAdmin}
                isTeacher={isTeacher}
              />
            ) : (
              <>
                <LoginButton />
                <p className="text-xs text-slate-400 text-center">
                  Sadece yetkilendirilmiş hesaplar giriş yapabilir.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <div className="relative z-10">
        <AppFooter variant="dark" />
      </div>
    </div>
  );
}
