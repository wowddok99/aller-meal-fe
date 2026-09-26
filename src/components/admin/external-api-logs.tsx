"use client";

import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { getAllExternalApiLogs } from "@/lib/admin-api";

export function ExternalApiLogs() {
  return <AdminOperationList title="외부 API 로그 목록" description="NEIS 등 외부 API 호출 결과와 응답 시간을 확인하세요." itemName="외부 API 로그" load={getAllExternalApiLogs}
    statusOptions={[]}
    filters={[{ key: "provider", label: "제공자", freeText: true }, { key: "method", label: "메서드", options: [{ value: "GET", label: "GET" }, { value: "POST", label: "POST" }, { value: "PUT", label: "PUT" }, { value: "PATCH", label: "PATCH" }, { value: "DELETE", label: "DELETE" }] }, { key: "outcome", label: "결과", options: [{ value: "SUCCESS", label: "성공" }, { value: "FAILURE", label: "실패" }] }]} />;
}
