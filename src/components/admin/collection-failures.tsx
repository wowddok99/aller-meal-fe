"use client";

import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { CollectionJobDetail } from "./collection-job-detail";
import { CollectionJobStatus } from "./collection-job-status";
import { getCollectionJobs, type AdminOperationQuery } from "@/lib/admin-api";

function getCollectionFilterStatus(params: Pick<URLSearchParams, "get">) {
  const status = params.get("status") ?? "ALL";
  return status === "FAILED" && params.get("unresolvedFailure") === "false" ? "RECOLLECTED" : status;
}

function loadCollectionJobs(query: AdminOperationQuery) {
  return getCollectionJobs({
    ...query,
    status: query.status === "RECOLLECTED" ? "FAILED" : query.status,
    unresolvedFailure: query.status === "FAILED" ? true : query.status === "RECOLLECTED" ? false : undefined,
  });
}

export function CollectionFailures() {
  return <AdminOperationList title="급식 수집 작업" description="급식 수집 작업의 상태와 재수집 결과를 확인하세요." itemName="급식 수집 작업" load={loadCollectionJobs} getInitialStatus={getCollectionFilterStatus} renderDetail={(_, refreshList) => <CollectionJobDetail refreshList={refreshList} />} renderStatus={(item) => item.collection ? <CollectionJobStatus job={item.collection} /> : item.status}
    statusOptions={[{ value: "PENDING", label: "대기" }, { value: "RUNNING", label: "수집 중" }, { value: "SUCCEEDED", label: "수집 완료" }, { value: "FAILED", label: "수집 실패" }, { value: "RECOLLECTED", label: "재수집 완료" }]}
    schoolSearch filters={[{ key: "schoolId", label: "학교 ID", freeText: true }, { key: "mealDate", label: "급식 날짜", freeText: true, inputType: "date" }, { key: "mealType", label: "급식 구분", options: [{ value: "BREAKFAST", label: "아침" }, { value: "LUNCH", label: "점심" }, { value: "DINNER", label: "저녁" }] }]} />;
}
