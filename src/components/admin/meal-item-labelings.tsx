"use client";

import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { getMealItemLabelings } from "@/lib/admin-api";

export function MealItemLabelings() {
  return <AdminOperationList title="알레르기 라벨링 작업" description="급식 메뉴별 알레르기 라벨링 처리 상태를 확인하세요." itemName="라벨링 작업" load={getMealItemLabelings}
    statusOptions={[{ value: "PENDING", label: "대기" }, { value: "LABELED", label: "완료" }, { value: "UNKNOWN", label: "확인 필요" }, { value: "LABELING_FAILED", label: "실패" }]}
    filters={[{ key: "schoolId", label: "학교 ID", freeText: true }, { key: "mealDate", label: "급식 날짜", freeText: true }, { key: "mealType", label: "식사", options: [{ value: "BREAKFAST", label: "아침" }, { value: "LUNCH", label: "점심" }, { value: "DINNER", label: "저녁" }] }]} />;
}
