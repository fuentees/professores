import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TEACHER_NAV_ITEMS, TEACHER_NAV_BOTTOM_ITEMS } from "@/lib/nav/teacher-nav";
import { QuestionSelectionProvider } from "@/components/questions/question-selection";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/entrar?redirect=/painel");
  }

  if (profile.status === "blocked") {
    redirect("/?bloqueado=1");
  }

  return (
    <DashboardShell
      profile={profile}
      navItems={TEACHER_NAV_ITEMS}
      bottomNavItems={TEACHER_NAV_BOTTOM_ITEMS}
      homeHref="/painel"
    >
      <QuestionSelectionProvider>{children}</QuestionSelectionProvider>
    </DashboardShell>
  );
}
