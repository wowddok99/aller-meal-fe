import { ArrowUpRight, CheckCircle2, CircleDashed } from "lucide-react";
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
    description: "구현 예정인 계정 생성 및 이메일 인증 안내 화면입니다.",
    href: "/auth/signup",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "04",
    title: "04_04_email_verification",
    label: "이메일 인증 결과",
    description: "구현 예정인 이메일 인증 결과 화면입니다.",
    href: "/auth/email-verification/confirm",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "05",
    title: "05_05_login",
    label: "로그인",
    description: "구현 예정인 로그인 화면입니다.",
    href: "/auth/login",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "06",
    title: "06_06_password_reset",
    label: "비밀번호 재설정",
    description: "구현 예정인 비밀번호 재설정 요청 화면입니다.",
    href: "/auth/password-reset",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "07",
    title: "07_07_children_list",
    label: "자녀 목록",
    description: "구현 예정인 등록 자녀 목록 화면입니다.",
    href: "/children",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "08",
    title: "08_08_child_registration",
    label: "자녀 등록",
    description: "구현 예정인 자녀 기본 정보와 학교 등록 화면입니다.",
    href: "/children/new",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "09",
    title: "09_09_child_detail_edit",
    label: "자녀 상세/수정",
    description: "구현 예정인 자녀 기본 정보 확인 및 수정 화면입니다.",
    href: "/children/8f3a0000-0000-4000-8000-000000000001",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "10",
    title: "10_10_child_allergens",
    label: "자녀 알레르기 설정",
    description: "구현 예정인 자녀 알레르기 코드 설정 화면입니다.",
    href: "/children/8f3a0000-0000-4000-8000-000000000001/allergens",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "11",
    title: "11_11_notification_preference",
    label: "알림 설정",
    description: "구현 예정인 자녀 이메일 알림 설정 화면입니다.",
    href: "/children/8f3a0000-0000-4000-8000-000000000001/notification-preference",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "12",
    title: "12_12_personalized_meals",
    label: "개인화 급식",
    description: "구현 예정인 자녀 기준 위험도 포함 급식 화면입니다.",
    href: "/children/8f3a0000-0000-4000-8000-000000000001/meals",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "13",
    title: "13_13_notification_history",
    label: "알림 이력",
    description: "구현 예정인 자녀별 알림 발송 기록 화면입니다.",
    href: "/children/8f3a0000-0000-4000-8000-000000000001/notifications",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "14",
    title: "14_14_account_withdrawal",
    label: "회원 탈퇴",
    description: "구현 예정인 계정 탈퇴 예약 및 취소 화면입니다.",
    href: "/account/withdrawal",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "15",
    title: "15_15_admin_dashboard",
    label: "관리자 대시보드",
    description: "구현 예정인 운영 현황 대시보드 화면입니다.",
    href: "/admin",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "16",
    title: "16_16_admin_collection_failures",
    label: "수집 실패",
    description: "구현 예정인 급식 수집 실패 조회 화면입니다.",
    href: "/admin/collection-failures",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "17",
    title: "17_17_admin_external_api_logs",
    label: "외부 API 로그",
    description: "구현 예정인 외부 API 호출 로그 화면입니다.",
    href: "/admin/external-api-logs",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "18",
    title: "18_18_admin_failed_notifications",
    label: "실패 알림",
    description: "구현 예정인 실패 알림 요청 조회 화면입니다.",
    href: "/admin/notification-failures",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "19",
    title: "19_19_admin_dlq_events",
    label: "알림 DLQ 이벤트",
    description: "구현 예정인 DLQ 이벤트 확인 및 재처리 화면입니다.",
    href: "/admin/notification-dlq-events",
    status: "진행 예정",
    icon: CircleDashed,
  },
  {
    id: "20",
    title: "20_20_admin_user_role",
    label: "사용자 권한",
    description: "구현 예정인 관리자 사용자 권한 변경 화면입니다.",
    href: "/admin/users/8f3a0000-0000-4000-8000-000000007b9c/role",
    status: "진행 예정",
    icon: CircleDashed,
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
            구현된 화면과 다음 작업 화면을 한 곳에서 이동합니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {pageLinks.map((page) => {
            const Icon = page.icon;

            return (
              <Link
                key={page.id}
                href={page.href}
                className="group flex min-h-[170px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-mint-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:border-zinc-800 dark:bg-[#101419] dark:hover:border-mint-400"
              >
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

                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 text-zinc-400 transition-colors group-hover:text-mint-600 dark:group-hover:text-mint-400"
                    strokeWidth={2.2}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    {page.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                      {page.status}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      {page.title}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
