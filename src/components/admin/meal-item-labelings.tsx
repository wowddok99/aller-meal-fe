"use client";

import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { getMealItemLabelings } from "@/lib/admin-api";
import { AdminOperationStatus, labelingStatusOptions } from "./admin-operation-status";

export function MealItemLabelings() {
  return <AdminOperationList primaryColumnLabel="메뉴명" additionalColumns={["학교"]} title="알레르기 라벨링 작업" description="급식 메뉴별 알레르기 라벨링 처리 상태를 확인하세요." itemName="라벨링 작업" load={getMealItemLabelings}
    statusOptions={labelingStatusOptions} renderStatus={(item) => <AdminOperationStatus status={item.status} options={labelingStatusOptions} />}
    schoolSearch filters={[{ key: "schoolId", label: "학교 ID", freeText: true }, { key: "mealDate", label: "급식 날짜", freeText: true, inputType: "date" }, { key: "mealType", label: "급식 구분", options: [{ value: "BREAKFAST", label: "아침" }, { value: "LUNCH", label: "점심" }, { value: "DINNER", label: "저녁" }] }]} />;
}
