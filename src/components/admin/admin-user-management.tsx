"use client";

import { ChevronLeft, ChevronRight, MoreVertical, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminSelectMenu } from "@/components/admin/admin-select-menu";
import {
  validateAdminActionReason,
  type AdminUserAction,
} from "@/components/admin/admin-user-management-utils";
import type { AdminUserAccessHistoryItemResponse } from "@/generated/api/admin/models/adminUserAccessHistoryItemResponse";
import type { AdminUserDetailResponse } from "@/generated/api/admin/models/adminUserDetailResponse";
import type { AdminUserListItemResponse } from "@/generated/api/admin/models/adminUserListItemResponse";

const PAGE_SIZES = [10, 20, 50];
const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";
const panel =
  "rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50";
const button = `inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-extrabold text-zinc-700 transition-colors hover:border-mint-500 hover:bg-mint-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200 dark:hover:bg-mint-500/10 ${focusRing}`;

type StatusFilter = "ALL" | AdminUserListItemResponse["status"];
type ReviewUser = AdminUserDetailResponse;

const statusLabels: Record<string, string> = {
  ACTIVE: "활성",
  WITHDRAWAL_PENDING: "탈퇴 예정",
  SUSPENDED: "이용 제한",
};
const roleLabels: Record<string, string> = {
  MEMBER: "일반 사용자",
  ADMIN: "관리자",
};
const verificationLabels: Record<string, string> = {
  VERIFIED: "인증 완료",
  UNVERIFIED: "미인증",
};
const historyActionLabels: Record<string, string> = {
  ACCOUNT_CREATED: "계정이 생성되었습니다.",
  PROMOTE_TO_ADMIN: "관리자 권한이 부여되었습니다.",
  SUSPEND: "이용이 제한되었습니다.",
  UNSUSPEND: "이용 제한이 해제되었습니다.",
  WITHDRAWAL_REQUESTED: "탈퇴가 예약되었습니다.",
};

const baseReviewUsers: ReviewUser[] = [
  {
    userId: "38b3f3b2-3e87-4dc7-8bce-68c7d8cbfd11",
    email: "review.member@example.com",
    role: "MEMBER",
    status: "ACTIVE",
    emailVerificationStatus: "VERIFIED",
    createdAt: "2026-08-29T10:12:00+09:00",
    withdrawalDueAt: null,
    version: 4,
    availableActions: {
      canPromoteToAdmin: true,
      canSuspend: true,
      canUnsuspend: false,
    },
  },
  {
    userId: "d1a79a3f-0746-4a99-868f-71f75715aa21",
    email: "review.admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    emailVerificationStatus: "VERIFIED",
    createdAt: "2026-07-18T09:32:00+09:00",
    withdrawalDueAt: null,
    version: 12,
    availableActions: {
      canPromoteToAdmin: false,
      canSuspend: false,
      canUnsuspend: false,
    },
  },
  {
    userId: "a4b9126a-1f52-4e28-b983-f7201b7bcb34",
    email: "review.withdrawal@example.com",
    role: "MEMBER",
    status: "WITHDRAWAL_PENDING",
    emailVerificationStatus: "VERIFIED",
    createdAt: "2026-08-02T13:45:00+09:00",
    withdrawalDueAt: "2026-09-22T00:00:00+09:00",
    version: 7,
    availableActions: {
      canPromoteToAdmin: false,
      canSuspend: false,
      canUnsuspend: false,
    },
  },
  {
    userId: "7f02a6e3-89ca-4085-9d1e-5ae6fe65286d",
    email: "review.suspended@example.com",
    role: "MEMBER",
    status: "SUSPENDED",
    emailVerificationStatus: "VERIFIED",
    createdAt: "2026-06-11T15:18:00+09:00",
    withdrawalDueAt: null,
    version: 9,
    availableActions: {
      canPromoteToAdmin: false,
      canSuspend: false,
      canUnsuspend: true,
    },
  },
  {
    userId: "cfb53d91-805d-4c38-a4e2-52b287cd2fa5",
    email: "review.unverified@example.com",
    role: "MEMBER",
    status: "ACTIVE",
    emailVerificationStatus: "UNVERIFIED",
    createdAt: "2026-09-01T11:27:00+09:00",
    withdrawalDueAt: null,
    version: 1,
    availableActions: {
      canPromoteToAdmin: false,
      canSuspend: false,
      canUnsuspend: false,
    },
  },
];

const reviewActorId = "d1a79a3f-0746-4a99-868f-71f75715aa21";

function createHistoryItem(
  eventId: string,
  action: string,
  beforeRole: "MEMBER" | "ADMIN" | null,
  afterRole: "MEMBER" | "ADMIN" | null,
  beforeStatus: "ACTIVE" | "SUSPENDED" | "WITHDRAWAL_PENDING" | null,
  afterStatus: "ACTIVE" | "SUSPENDED" | "WITHDRAWAL_PENDING" | null,
  createdAt: string,
  reason: string | null = null,
  actorUserId: string | null = reviewActorId,
): AdminUserAccessHistoryItemResponse {
  return {
    eventId,
    actorUserId,
    action,
    beforeRole,
    afterRole,
    beforeStatus,
    afterStatus,
    reason,
    createdAt,
    source: actorUserId ? "ADMIN" : "SYSTEM",
  };
}

function reviewTimestamp(dayOffset: number) {
  return new Date(Date.UTC(2024, 0, 1 + dayOffset, 9, 0)).toISOString();
}

const generatedReviewUsers: ReviewUser[] = Array.from(
  { length: 65 },
  (_, index) => {
    const sequence = index + 6;
    const role: ReviewUser["role"] = sequence % 9 === 0 ? "ADMIN" : "MEMBER";
    const status: ReviewUser["status"] =
      sequence % 12 === 0
        ? "SUSPENDED"
        : sequence % 10 === 0
          ? "WITHDRAWAL_PENDING"
          : "ACTIVE";
    const emailVerificationStatus: ReviewUser["emailVerificationStatus"] =
      sequence % 7 === 0 ? "UNVERIFIED" : "VERIFIED";
    const canManageMember =
      role === "MEMBER" &&
      status === "ACTIVE" &&
      emailVerificationStatus === "VERIFIED";

    return {
      userId: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
      email: `review.account${String(sequence).padStart(2, "0")}@example.com`,
      role,
      status,
      emailVerificationStatus,
      createdAt: reviewTimestamp(sequence * 3),
      withdrawalDueAt:
        status === "WITHDRAWAL_PENDING"
          ? reviewTimestamp(sequence * 3 + 21)
          : null,
      version: (sequence % 8) + 1,
      availableActions: {
        canPromoteToAdmin: canManageMember,
        canSuspend: canManageMember,
        canUnsuspend: status === "SUSPENDED",
      },
    };
  },
);

const reviewUsers = [...baseReviewUsers, ...generatedReviewUsers];

function createAccountHistory(user: ReviewUser, index: number) {
  const events = [
    createHistoryItem(
      `review-history-${index}-created`,
      "ACCOUNT_CREATED",
      null,
      "MEMBER",
      null,
      "ACTIVE",
      reviewTimestamp(index * 3),
      null,
      null,
    ),
  ];
  let currentRole: "MEMBER" | "ADMIN" = "MEMBER";
  let eventOffset = 4;

  if (user.role === "ADMIN") {
    events.push(
      createHistoryItem(
        `review-history-${index}-promote`,
        "PROMOTE_TO_ADMIN",
        "MEMBER",
        "ADMIN",
        "ACTIVE",
        "ACTIVE",
        reviewTimestamp(index * 3 + eventOffset),
        "운영 담당자 지정",
      ),
    );
    currentRole = "ADMIN";
    eventOffset += 4;
  }

  if (user.status === "SUSPENDED") {
    events.push(
      createHistoryItem(
        `review-history-${index}-suspend`,
        "SUSPEND",
        currentRole,
        currentRole,
        "ACTIVE",
        "SUSPENDED",
        reviewTimestamp(index * 3 + eventOffset),
        "운영 정책 위반 확인",
      ),
    );
  } else if (user.status === "WITHDRAWAL_PENDING") {
    events.push(
      createHistoryItem(
        `review-history-${index}-withdrawal`,
        "WITHDRAWAL_REQUESTED",
        currentRole,
        currentRole,
        "ACTIVE",
        "WITHDRAWAL_PENDING",
        reviewTimestamp(index * 3 + eventOffset),
        "회원 탈퇴 요청",
        null,
      ),
    );
  } else if (index % 6 === 0) {
    events.push(
      createHistoryItem(
        `review-history-${index}-suspend`,
        "SUSPEND",
        currentRole,
        currentRole,
        "ACTIVE",
        "SUSPENDED",
        reviewTimestamp(index * 3 + eventOffset),
        "운영 검토를 위한 일시 제한",
      ),
      createHistoryItem(
        `review-history-${index}-unsuspend`,
        "UNSUSPEND",
        currentRole,
        currentRole,
        "SUSPENDED",
        "ACTIVE",
        reviewTimestamp(index * 3 + eventOffset + 1),
        "검토 완료 후 이용 제한 해제",
      ),
    );
  }

  return events.reverse();
}

const initialHistory: Record<string, AdminUserAccessHistoryItemResponse[]> =
  Object.fromEntries(
    reviewUsers.map((user, index) => [
      user.userId,
      createAccountHistory(user, index),
    ]),
  );

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const field = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${field("year")}-${field("month")}-${field("day")} ${field("hour")}:${field("minute")}`;
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "SUSPENDED"
      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
      : status === "WITHDRAWAL_PENDING"
        ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        : "border-mint-300 bg-mint-50 text-mint-800 dark:border-mint-800 dark:bg-mint-500/10 dark:text-mint-300";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${className}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const className =
    role === "ADMIN"
      ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200"
      : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${className}`}
    >
      {roleLabels[role] ?? role}
    </span>
  );
}

function getHistoryChanges(item: AdminUserAccessHistoryItemResponse) {
  if (item.action === "ACCOUNT_CREATED") {
    return item.afterRole
      ? [{ label: "권한", value: roleLabels[item.afterRole] ?? item.afterRole }]
      : [];
  }

  return item.afterStatus
    ? [
        {
          label: "상태",
          value: statusLabels[item.afterStatus] ?? item.afterStatus,
        },
      ]
    : [];
}

function HistoryEventDetails({
  item,
}: {
  item: AdminUserAccessHistoryItemResponse;
}) {
  const changes = getHistoryChanges(item);

  return (
    <dl className="mt-3 space-y-4 text-sm">
      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-1">
        <dt className="font-semibold text-zinc-500 dark:text-zinc-400">일시</dt>
        <dd className="font-extrabold">
          <time>{formatDateTime(item.createdAt)}</time>
        </dd>
      </div>
      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-1">
        <dt className="font-semibold text-zinc-500 dark:text-zinc-400">사유</dt>
        <dd className="min-w-0 font-extrabold">{item.reason ?? "-"}</dd>
      </div>
      {changes.map((change) => (
        <div
          key={change.label}
          className="grid grid-cols-[36px_minmax(0,1fr)] gap-1"
        >
          <dt className="font-semibold text-zinc-500 dark:text-zinc-400">
            {change.label}
          </dt>
          <dd>
            {change.label === "권한" && item.afterRole ? (
              <span className="flex flex-wrap items-center gap-2">
                {item.beforeRole && item.beforeRole !== item.afterRole ? (
                  <RoleBadge role={item.beforeRole} />
                ) : null}
                {item.beforeRole && item.beforeRole !== item.afterRole ? (
                  <span className="text-zinc-400">→</span>
                ) : null}
                <RoleBadge role={item.afterRole} />
              </span>
            ) : change.label === "상태" && item.afterStatus ? (
              <span className="flex flex-wrap items-center gap-2">
                {item.beforeStatus && item.beforeStatus !== item.afterStatus ? (
                  <>
                    <StatusBadge status={item.beforeStatus} />
                    <span className="text-zinc-400">→</span>
                  </>
                ) : null}
                <StatusBadge status={item.afterStatus} />
              </span>
            ) : (
              <span className="font-extrabold">{change.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function History({ items }: { items: AdminUserAccessHistoryItemResponse[] }) {
  return (
    <section aria-labelledby="admin-user-history-title" className={panel}>
      <div className="flex items-center justify-between gap-3 px-5 py-5 md:px-6">
        <div>
          <h3 id="admin-user-history-title" className="text-lg font-extrabold">
            계정 변경 이력
          </h3>
          <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            계정 생성, 권한 및 이용 상태 변경 이력입니다.
          </p>
        </div>
        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          총 {items.length}건
        </span>
      </div>
      {!items.length ? (
        <p className="border-t border-zinc-100 px-5 py-10 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          표시할 계정 변경 이력이 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((item) => (
            <li key={item.eventId} className="px-5 py-5 md:px-6">
              <p className="font-extrabold">
                {historyActionLabels[item.action] ??
                  "계정 정보가 변경되었습니다"}
              </p>
              <HistoryEventDetails item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AccountActionMenu({
  actions,
  onChoose,
}: {
  actions: ReviewUser["availableActions"];
  onChoose: (action: AdminUserAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const options = [
    actions.canPromoteToAdmin
      ? { action: "promote" as const, label: "관리자 권한 부여" }
      : null,
    actions.canSuspend
      ? { action: "suspend" as const, label: "이용 제한" }
      : null,
    actions.canUnsuspend
      ? { action: "unsuspend" as const, label: "이용 제한 해제" }
      : null,
  ].filter((option): option is NonNullable<typeof option> => option !== null);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  if (options.length === 0) return null;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${focusRing}`}
        aria-label="계정 조치 메뉴"
      >
        <MoreVertical aria-hidden="true" className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="계정 조치"
          className="absolute right-0 z-20 mt-2 min-w-40 overflow-hidden rounded-[10px] border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-950/8 dark:border-zinc-700 dark:bg-[#101419] dark:shadow-black/30"
        >
          {options.map((option) => (
            <button
              key={option.action}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onChoose(option.action);
              }}
              className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 ${option.action === "suspend" ? "text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10" : "text-zinc-700 hover:bg-mint-50 hover:text-mint-800 dark:text-zinc-200 dark:hover:bg-mint-500/10 dark:hover:text-mint-300"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Confirmation({
  action,
  target,
  onCancel,
  onConfirm,
}: {
  action: AdminUserAction;
  target: ReviewUser;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const title =
    action === "promote"
      ? "관리자 권한을 부여할까요?"
      : action === "suspend"
        ? "이용을 제한할까요?"
        : "이용 제한을 해제할까요?";
  const impact =
    action === "suspend"
      ? "이용이 제한되면 로그아웃 처리되며, 대기 및 재시도 알림은 취소됩니다."
      : action === "unsuspend"
        ? "기존 세션은 복구되지 않으며 새 로그인이 필요합니다."
        : "관리자 기능을 즉시 사용할 수 있게 됩니다.";

  const confirm = () => {
    const checked = validateAdminActionReason(reason);
    if (!checked.valid) {
      setReasonError(checked.message);
      reasonRef.current?.focus();
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-5 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-action-title"
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-[#101419] dark:text-zinc-50"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="admin-user-action-title" className="text-lg font-extrabold">
              {title}
            </h2>
            <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {impact}
            </p>
            <dl className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
              <div>
                <dt className="text-xs font-semibold text-zinc-500">대상</dt>
                <dd className="mt-1 break-all font-extrabold">
                  {target.email}
                </dd>
              </div>
            </dl>
            <label
              htmlFor="admin-user-action-reason"
              className="mt-4 block text-sm font-bold"
            >
              변경 사유
            </label>
            <textarea
              ref={reasonRef}
              id="admin-user-action-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setReasonError("");
              }}
              maxLength={500}
              aria-invalid={Boolean(reasonError)}
              aria-describedby="admin-user-action-reason-help"
              className={`mt-2 min-h-24 w-full resize-y rounded-[10px] border bg-white px-3 py-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 dark:bg-[#101419] dark:text-zinc-50 ${reasonError ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"} ${focusRing}`}
              placeholder="조치가 필요한 사유를 입력해 주세요."
            />
            <p
              id="admin-user-action-reason-help"
              className={`mt-2 text-right text-xs font-medium ${reasonError ? "text-red-600" : "text-zinc-500"}`}
            >
              {reasonError || `${reason.length}/500`}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`${button} min-w-16 px-4`}
          >
            취소
          </button>
          <button
            type="button"
            onClick={confirm}
            className={`inline-flex h-11 min-w-16 items-center justify-center rounded-[10px] px-4 text-sm font-extrabold text-white ${action === "suspend" ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500" : "bg-mint-500 hover:bg-mint-600"} ${focusRing}`}
          >
            확인
          </button>
        </div>
      </section>
    </div>
  );
}

function UserDetail({
  target,
  history,
  onApply,
}: {
  target: ReviewUser;
  history: AdminUserAccessHistoryItemResponse[];
  onApply: (action: AdminUserAction, reason: string) => void;
}) {
  const [pending, setPending] = useState<AdminUserAction>();
  return (
    <>
      <section aria-labelledby="admin-user-detail-title" className={panel}>
        <div className="flex items-start justify-between gap-3 px-5 py-5 md:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              선택한 계정
            </p>
            <h2
              id="admin-user-detail-title"
              className="mt-1 break-all text-xl font-extrabold"
            >
              {target.email}
            </h2>
          </div>
          <AccountActionMenu
            actions={target.availableActions}
            onChoose={setPending}
          />
        </div>
        <dl className="grid gap-x-6 gap-y-5 border-t border-zinc-100 px-5 py-5 text-sm dark:border-zinc-800 md:grid-cols-2 md:px-6">
          <div>
            <dt className="font-semibold text-zinc-500">역할</dt>
            <dd className="mt-2">
              <RoleBadge role={target.role} />
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-500">계정 상태</dt>
            <dd className="mt-2">
              <StatusBadge status={target.status} />
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-500">이메일 인증</dt>
            <dd className="mt-1 font-extrabold">
              {verificationLabels[target.emailVerificationStatus]}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-500">사용자 ID</dt>
            <dd className="mt-1 break-all font-mono text-xs font-extrabold">
              {target.userId}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-500">가입 시각</dt>
            <dd className="mt-1 font-extrabold">
              {formatDateTime(target.createdAt)}
            </dd>
          </div>
          {target.withdrawalDueAt ? (
            <div>
              <dt className="font-semibold text-zinc-500">탈퇴 예정 시각</dt>
              <dd className="mt-1 font-extrabold">
                {formatDateTime(target.withdrawalDueAt)}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
      <History items={history} />
      {pending ? (
        <Confirmation
          action={pending}
          target={target}
          onCancel={() => setPending(undefined)}
          onConfirm={(reason) => {
            onApply(pending, reason);
            setPending(undefined);
          }}
        />
      ) : null}
    </>
  );
}

export function AdminUserManagement() {
  const [users, setUsers] = useState(reviewUsers);
  const [histories, setHistories] = useState(initialHistory);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [notice, setNotice] = useState("");
  const filtered = useMemo(
    () =>
      users.filter(
        (item) =>
          (status === "ALL" || item.status === status) &&
          (!query ||
            item.userId.toLowerCase().includes(query.toLowerCase()) ||
            item.email.toLowerCase().includes(query.toLowerCase())),
      ),
    [users, status, query],
  );
  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = users.find((item) => item.userId === selectedUserId);
  const submitSearch = () => {
    setQuery(input.trim());
    setPage(1);
    setSelectedUserId("");
  };
  const applyAction = (action: AdminUserAction, reason: string) => {
    if (!selected) return;
    const next = {
      ...selected,
      version: selected.version + 1,
      role: action === "promote" ? ("ADMIN" as const) : selected.role,
      status:
        action === "suspend"
          ? ("SUSPENDED" as const)
          : action === "unsuspend"
            ? ("ACTIVE" as const)
            : selected.status,
      availableActions:
        action === "suspend"
          ? { canPromoteToAdmin: false, canSuspend: false, canUnsuspend: true }
          : action === "unsuspend"
            ? {
                canPromoteToAdmin:
                  selected.role === "MEMBER" &&
                  selected.emailVerificationStatus === "VERIFIED",
                canSuspend: selected.role !== "ADMIN",
                canUnsuspend: false,
              }
            : {
                canPromoteToAdmin: false,
                canSuspend: false,
                canUnsuspend: false,
              },
    };
    setUsers((current) =>
      current.map((item) => (item.userId === next.userId ? next : item)),
    );
    setHistories((current) => ({
      ...current,
      [next.userId]: [
        {
          eventId: crypto.randomUUID(),
          actorUserId: "d1a79a3f-0746-4a99-868f-71f75715aa21",
          action:
            action === "promote" ? "PROMOTE_TO_ADMIN" : action.toUpperCase(),
          beforeRole: selected.role,
          afterRole: next.role,
          beforeStatus: selected.status,
          afterStatus: next.status,
          reason,
          createdAt: new Date().toISOString(),
          source: "REVIEW_FIXTURE",
        },
        ...(current[next.userId] ?? []),
      ],
    }));
    setNotice(
      `${action === "promote" ? "관리자 권한을 부여" : action === "suspend" ? "이용을 제한" : "이용 제한을 해제"}했습니다.`,
    );
  };
  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <header>
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          사용자 계정 상태와 관리자 권한을 확인하고 관리하세요.
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
          사용자 관리
        </h1>
      </header>
      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-800 dark:border-mint-900 dark:bg-mint-500/10 dark:text-mint-300"
        >
          {notice}
        </p>
      ) : null}
      <section aria-label="사용자 목록" className={`${panel} overflow-visible`}>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-6">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            총 {filtered.length}명
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">목록 표시 수</span>
            <AdminSelectMenu
              label="목록 표시 수"
              value={String(pageSize)}
              options={PAGE_SIZES.map((size) => ({
                value: String(size),
                label: `${size}명`,
              }))}
              onChange={(value) => {
                setPage(1);
                setPageSize(Number(value));
              }}
              compact
            />
          </div>
        </div>
        <div className="border-y border-zinc-100 px-5 py-5 dark:border-zinc-800 md:px-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
            className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto]"
          >
            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-500">
                계정 상태
              </label>
              <AdminSelectMenu
                label="계정 상태"
                value={status}
                onChange={(value) => {
                  setStatus(value as StatusFilter);
                  setPage(1);
                  setSelectedUserId("");
                }}
                options={[
                  { value: "ALL", label: "전체" },
                  { value: "ACTIVE", label: "활성" },
                  { value: "WITHDRAWAL_PENDING", label: "탈퇴 예정" },
                  { value: "SUSPENDED", label: "이용 제한" },
                ]}
              />
            </div>
            <div>
              <label
                htmlFor="admin-user-search"
                className="mb-2 block text-xs font-semibold text-zinc-500"
              >
                계정명
              </label>
              <input
                id="admin-user-search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="계정명을 입력해 주세요."
                className={`h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50 ${focusRing}`}
              />
            </div>
            <button
              type="submit"
              className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white hover:bg-mint-600 ${focusRing}`}
            >
              <Search className="h-4 w-4" />
              검색
            </button>
          </form>
        </div>
        {!visible.length ? (
          <div className="border-t border-zinc-100 px-5 py-12 text-center dark:border-zinc-800">
            <Search className="mx-auto h-8 w-8 text-zinc-400" />
            <h3 className="mt-3 font-extrabold">
              조건에 맞는 사용자가 없습니다
            </h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              상태 필터 또는 UUID·전체 이메일 주소를 다시 확인해 주세요.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto border-t border-zinc-100 dark:border-zinc-800 md:block">
              <table className="w-full min-w-[800px] border-collapse">
                <thead className="bg-zinc-50 text-left text-xs font-bold text-zinc-500 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-5 py-3">계정명</th>
                    <th className="px-3 py-3">역할</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">이메일 인증</th>
                    <th className="px-5 py-3">가입 시각</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr
                      key={item.userId}
                      onClick={() => setSelectedUserId(item.userId)}
                      className={`cursor-pointer border-b border-zinc-100 last:border-b-0 dark:border-zinc-800 ${selectedUserId === item.userId ? "bg-mint-500/[0.07]" : "hover:bg-mint-500/[0.035]"}`}
                    >
                      <td className="max-w-72 px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(item.userId)}
                          className={`block max-w-full text-left font-semibold hover:text-mint-800 dark:hover:text-mint-300 ${focusRing}`}
                        >
                          <p className="truncate">{item.email}</p>
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <RoleBadge role={item.role} />
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-4 text-sm font-semibold">
                        {verificationLabels[item.emailVerificationStatus]}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold">
                        {formatDateTime(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800 md:hidden">
              {visible.map((item) => (
                <button
                  key={item.userId}
                  type="button"
                  onClick={() => setSelectedUserId(item.userId)}
                  className={`w-full p-5 text-left ${selectedUserId === item.userId ? "bg-mint-500/[0.07]" : "hover:bg-mint-500/[0.035]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-extrabold">{item.email}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <RoleBadge role={item.role} />
                    <span className="text-xs font-semibold text-zinc-500">
                      {verificationLabels[item.emailVerificationStatus]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-center border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="이전 사용자 페이지"
                  className={`flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="min-w-20 text-center text-sm font-bold text-zinc-950 dark:text-white">
                  {page} / {maxPage}
                </p>
                <button
                  type="button"
                  disabled={page >= maxPage}
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="다음 사용자 페이지"
                  className={`flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {selected ? (
        <UserDetail
          key={selected.userId}
          target={selected}
          history={histories[selected.userId] ?? []}
          onApply={applyAction}
        />
      ) : (
        <section className={`${panel} px-5 py-10 text-center`}>
          <p className="text-sm font-medium text-zinc-500">
            사용자 행을 선택하면 상세 정보와 접근 이력을 표시합니다.
          </p>
        </section>
      )}
    </div>
  );
}
