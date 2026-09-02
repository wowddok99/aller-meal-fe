import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { AllerMealLogo } from "@/components/allermeal-logo";

const pageLinks = [
  {
    id: "00",
    title: "00_public_school_search_approved",
    label: "학교 검색",
    description: "구현 완료된 학교 검색 화면입니다.",
    href: "/schools",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "01",
    title: "01_01_public_school_meals",
    label: "급식 확인",
    description: "구현 완료된 급식 상세 화면입니다.",
    href: "/schools/1/meals",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "02",
    title: "02_02_allergen_guide",
    label: "알레르기 안내",
    description: "구현 완료된 알레르기 코드 안내 화면입니다.",
    href: "/allergens",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "03",
    title: "03_03_signup",
    label: "회원가입",
    description: "상세 리뷰를 마치고 확정된 회원가입 화면입니다.",
    href: "/auth/signup",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "04-1",
    title: "04_01_email_verification_success",
    label: "이메일 인증 완료",
    description: "상세 리뷰를 마치고 확정된 이메일 인증 완료 화면입니다.",
    href: "/auth/email-verification/confirm?preview=success",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "04-2",
    title: "04_02_email_verification_failure",
    label: "이메일 인증 실패",
    description: "상세 리뷰를 마치고 확정된 이메일 인증 실패 화면입니다.",
    href: "/auth/email-verification/confirm?preview=error",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "05",
    title: "05_05_login",
    label: "로그인",
    description: "상세 리뷰를 마치고 확정된 로그인 화면입니다.",
    href: "/auth/login",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "06",
    title: "06_06_password_reset",
    label: "비밀번호 재설정",
    description: "상세 리뷰를 마치고 확정된 비밀번호 재설정 화면입니다.",
    href: "/auth/password-reset",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "07",
    title: "07_07_children_list",
    label: "자녀 목록",
    description: "상세 리뷰를 마치고 확정된 자녀 목록 화면입니다.",
    href: "/children",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "08",
    title: "08_08_child_registration",
    label: "자녀 등록",
    description: "상세 리뷰를 마치고 확정된 자녀 등록 화면입니다.",
    href: "/children/new",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "09",
    title: "09_09_child_detail_edit",
    label: "자녀 상세/수정",
    description: "상세 리뷰를 마치고 확정된 자녀 상세·수정 화면입니다.",
    href: "/children/preview",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "10",
    title: "10_10_child_allergens",
    label: "자녀 알레르기 설정",
    description: "자녀별 알레르기 유발 성분을 선택하는 화면입니다.",
    href: "/children/preview/allergens",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "11",
    title: "11_11_notification_preference",
    label: "알림 설정",
    description: "상세 리뷰를 마치고 확정된 알림 설정 화면입니다.",
    href: "/children/preview/notification-preference",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "12",
    title: "12_12_personalized_meals",
    label: "개인화 급식",
    description: "상세 리뷰를 마치고 확정된 개인화 급식 화면입니다.",
    href: "/children/preview/meals",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "13",
    title: "13_13_notification_history",
    label: "알림 이력",
    description: "자녀별 알림 발송 기록과 상태를 확인하는 화면입니다.",
    href: "/children/preview/notifications",
    status: "리뷰 필요",
    icon: ClipboardCheck,
  },
  {
    id: "14",
    title: "14_14_account_withdrawal",
    label: "회원 탈퇴",
    description: "계정 탈퇴를 예약하거나 예약을 취소하는 화면입니다.",
    href: "/account/withdrawal",
    status: "리뷰 필요",
    icon: ClipboardCheck,
  },
  {
    id: "15",
    title: "15_15_admin_dashboard",
    label: "관리자 대시보드",
    description: "수집·라벨링·알림 작업의 운영 현황을 확인하는 화면입니다.",
    href: "/admin/preview",
    status: "리뷰 필요",
    icon: ClipboardCheck,
  },
  {
    id: "16",
    title: "16_16_admin_collection_failures",
    label: "수집 실패",
    description: "급식 수집 실패 내역과 재수집 상태를 확인하는 화면입니다.",
    href: "/admin/preview/collection-failures",
    status: "리뷰 필요",
    icon: ClipboardCheck,
  },
  {
    id: "17",
    title: "17_17_admin_external_api_logs",
    label: "외부 API 로그",
    description: "외부 연계 호출 기록과 응답 상태를 확인하는 화면입니다.",
    href: "/admin/preview/external-api-logs",
    status: "리뷰 필요",
    icon: ClipboardCheck,
  },
  {
    id: "18",
    title: "18_18_admin_failed_notifications",
    label: "실패 알림",
    description: "발송에 실패한 알림과 실패 사유를 확인하는 화면입니다.",
    href: "/admin/preview/notification-failures",
    status: "리뷰 필요",
    icon: ClipboardCheck,
  },
  {
    id: "19",
    title: "19_19_admin_dlq_events",
    label: "알림 DLQ 이벤트",
    description: "1차 구현을 마치고 현재 상세 리뷰를 진행 중인 알림 DLQ 이벤트 화면입니다.",
    href: "/admin/preview/notification-dlq-events",
    status: "리뷰 중",
    icon: ClipboardCheck,
  },
  {
    id: "20",
    title: "20_20_admin_user_role",
    label: "사용자 권한",
    description: "사용자 ID를 입력해 관리자 권한을 부여하는 화면입니다.",
    href: "/admin/preview/users/preview/role",
    status: "리뷰 필요",
    icon: ClipboardCheck,
  },
] as const;

export function PublicPageIndex() {
  return (
    <main className="min-h-[100dvh] bg-zinc-50 text-zinc-950 dark:bg-canvas dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-6 px-5 py-8">
        <div className="flex items-center">
          <AllerMealLogo variant="full" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-mint-600 dark:text-mint-400">
            Page Index
          </p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50">
            화면 바로가기
          </h1>
          <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
            구현된 화면과 현재 상태를 한 곳에서 확인합니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {pageLinks.map((page) => {
            const Icon = page.icon;
            const isAvailable = true;

            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-mint-600 dark:bg-zinc-900 dark:text-mint-400">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-zinc-500 dark:text-zinc-400">
                        {page.id}
                      </p>
                      <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
                        {page.label}
                      </h2>
                    </div>
                  </div>

                  {isAvailable ? (
                    <ArrowUpRight
                      className="h-5 w-5 shrink-0 text-zinc-400 transition-colors group-hover:text-mint-600 dark:group-hover:text-mint-400"
                      strokeWidth={2.2}
                    />
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      {page.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        page.status === "리뷰 중"
                          ? "border-blue-500 bg-blue-100 text-blue-800 dark:border-blue-600 dark:bg-blue-950/50 dark:text-blue-200"
                          : page.status === "리뷰 필요"
                          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                          : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {page.status}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      {page.title}
                    </span>
                  </div>
                </div>
              </>
            );

            const className = `flex min-h-[170px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] ${
              isAvailable
                ? "group transition-colors hover:border-mint-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:border-mint-400"
                : "cursor-not-allowed opacity-65"
            }`;

            return isAvailable ? (
              <Link
                key={page.id}
                href={page.href}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <article key={page.id} className={className}>
                {content}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
