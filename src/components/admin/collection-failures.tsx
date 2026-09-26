"use client";

import { AdminOperationList, collectionRecollectionAction } from "@/components/admin/admin-operation-list";
import { getCollectionJobs } from "@/lib/admin-api";

export function CollectionFailures() {
  return <AdminOperationList title="급식 수집 작업" description="급식 수집 작업의 상태와 재수집 결과를 확인하세요." itemName="급식 수집 작업" load={getCollectionJobs} action={collectionRecollectionAction}
    statusOptions={[{ value: "PENDING", label: "대기" }, { value: "RUNNING", label: "수집 중" }, { value: "SUCCEEDED", label: "완료" }, { value: "FAILED", label: "실패" }]}
    filters={[{ key: "schoolId", label: "학교 ID", freeText: true }, { key: "mealDate", label: "급식 날짜", freeText: true }, { key: "mealType", label: "식사", options: [{ value: "BREAKFAST", label: "아침" }, { value: "LUNCH", label: "점심" }, { value: "DINNER", label: "저녁" }] }]} />;
}
