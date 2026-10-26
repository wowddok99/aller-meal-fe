export const adminEventTypeOptions = [
  { value: "MealCollected", label: "급식 수집 완료" },
  { value: "MealLabeled", label: "알레르기 라벨링 완료" },
  { value: "NotificationRequested", label: "알림 발송 요청" },
];

export const adminMealTypeOptions = [
  { value: "BREAKFAST", label: "아침" },
  { value: "LUNCH", label: "점심" },
  { value: "DINNER", label: "저녁" },
];

export const adminNotificationChannelOptions = [{ value: "EMAIL", label: "이메일" }];
export const adminNotificationReasonOptions = [
  { value: "RISK_DETECTED", label: "위험 감지" },
  { value: "NO_RISK", label: "위험 없음" },
  { value: "RISK_UNKNOWN", label: "위험 확인 필요" },
  { value: "RISK_LABELING_FAILED", label: "라벨링 실패" },
  { value: "RISK_PENDING", label: "라벨링 대기" },
  { value: "NO_MEAL", label: "급식 없음" },
];

export function adminOperationLabel(value: string | null | undefined, options: ReadonlyArray<{ value: string; label: string }>) {
  if (!value) return "미제공";
  return options.find((option) => option.value === value)?.label ?? value;
}

export function adminMealSummary(date?: string | null, mealType?: string | null) {
  return `${date || "날짜 미제공"}(${mealType ? adminOperationLabel(mealType, adminMealTypeOptions) : "급식 구분 미제공"})`;
}

export function adminEventTypeLabel(value?: string | null) {
  if (!value) return "이벤트 종류 미제공";
  return adminEventTypeOptions.find((option) => option.value === value)?.label ?? "알 수 없는 이벤트";
}
