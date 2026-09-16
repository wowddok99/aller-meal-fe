const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAdminUserQuery(value: string) {
  const trimmed = value.trim();
  return EMAIL_PATTERN.test(trimmed) ? trimmed.toLowerCase() : trimmed.toLowerCase();
}

export function isExactAdminUserQuery(value: string) {
  const normalized = normalizeAdminUserQuery(value);
  return UUID_PATTERN.test(normalized) || EMAIL_PATTERN.test(normalized);
}

export function validateAdminActionReason(value: string):
  | { valid: true; value: string }
  | { valid: false; message: string } {
  const normalized = value.trim();
  if (!normalized) {
    return { valid: false, message: "변경 사유를 입력해 주세요." };
  }
  if (normalized.length > 500) {
    return { valid: false, message: "변경 사유는 500자 이하로 입력해 주세요." };
  }
  return { valid: true, value: normalized };
}

export type AdminUserAction = "promote" | "suspend" | "unsuspend";

type AvailableActions = {
  canPromoteToAdmin: boolean;
  canSuspend: boolean;
  canUnsuspend: boolean;
};

export function isAdminUserActionAvailable(
  actions: AvailableActions,
  action: AdminUserAction,
) {
  return action === "promote"
    ? actions.canPromoteToAdmin
    : action === "suspend"
      ? actions.canSuspend
      : actions.canUnsuspend;
}

export function buildAdminUserActionPayload(
  action: AdminUserAction,
  actions: AvailableActions,
  version: number | undefined,
  reason: string,
):
  | { valid: true; value: { reason: string; expectedVersion: number; action?: "SUSPEND" | "UNSUSPEND" } }
  | { valid: false; field: "reason" | "action"; message: string } {
  const checkedReason = validateAdminActionReason(reason);
  if (!checkedReason.valid) {
    return { valid: false, field: "reason", message: checkedReason.message };
  }
  if (version === undefined || !isAdminUserActionAvailable(actions, action)) {
    return {
      valid: false,
      field: "action",
      message: "현재 서버 정책상 이 조치를 실행할 수 없습니다.",
    };
  }
  return {
    valid: true,
    value: {
      reason: checkedReason.value,
      expectedVersion: version,
      ...(action === "suspend" ? { action: "SUSPEND" as const } : {}),
      ...(action === "unsuspend" ? { action: "UNSUSPEND" as const } : {}),
    },
  };
}
