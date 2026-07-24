import { LockKeyhole, ShieldCheck } from "lucide-react";
import { PublicPageShell } from "@/components/public/public-page-shell";

export function AuthShell({
  children,
  description = "계정을 만들고 이메일 인증을 진행하세요.",
  showSecurityNotice = true,
  showDescription = true,
  compact = false,
  showHeader = true,
  centered = false,
}: {
  children: React.ReactNode;
  description?: string;
  showSecurityNotice?: boolean;
  showDescription?: boolean;
  compact?: boolean;
  showHeader?: boolean;
  centered?: boolean;
}) {
  return (
    <PublicPageShell showHeader={showHeader}>
      <div className={`mx-auto flex w-full flex-col gap-4 px-5 ${centered ? "min-h-[100dvh] justify-start pb-12 pt-10 sm:justify-center sm:pb-[12dvh] sm:pt-0" : "pb-12 pt-5"} ${compact ? "max-w-[680px]" : "max-w-[1020px]"}`}>
        {showDescription ? <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">
          {description}
        </p> : null}

        {children}

        {showSecurityNotice ? <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] sm:flex-row sm:items-center sm:justify-between md:px-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint-500/10 text-mint-600 dark:text-mint-400">
              <ShieldCheck className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-base font-extrabold">안전하게 보호되는 회원 정보</h2>
              <p className="mt-1 text-sm font-medium leading-5 text-zinc-500 dark:text-zinc-400">
                개인정보를 안전하게 보호하며 이메일 인증으로 계정 보안을 강화합니다.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pl-16 text-sm font-semibold text-zinc-500 dark:text-zinc-400 sm:pl-0">
            <LockKeyhole className="h-4 w-4 text-mint-600 dark:text-mint-400" />
            개인정보 안전 보호
          </div>
        </section> : null}
      </div>
    </PublicPageShell>
  );
}
