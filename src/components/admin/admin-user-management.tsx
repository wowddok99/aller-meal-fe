"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildAdminUserActionPayload,
  createLatestAdminRequestTracker,
  isAdminAuthenticationError,
  isCurrentAdminUserSelection,
  isExactAdminUserQuery,
  isMissingAdminUserResource,
  normalizeAdminUserQuery,
  type AdminUserAction,
} from "@/components/admin/admin-user-management-utils";
import type { AdminUserAccessHistoryItemResponse } from "@/generated/api/admin/models/adminUserAccessHistoryItemResponse";
import type { AdminUserDetailResponse } from "@/generated/api/admin/models/adminUserDetailResponse";
import type { AdminUserListItemResponse } from "@/generated/api/admin/models/adminUserListItemResponse";
import type { ListAdminUsersStatus } from "@/generated/api/admin/models/listAdminUsersStatus";
import {
  AdminApiError,
  changeUserSuspension,
  getAdminUserDetail,
  getAdminUserHistory,
  getAdminUsers,
  promoteUserToAdmin,
} from "@/lib/admin-api";

const PAGE_SIZE = 20;
const HISTORY_PAGE_SIZE = 10;
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";
const panel = "rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50";
const button = `inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-extrabold text-zinc-700 transition-colors hover:border-mint-500 hover:bg-mint-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200 dark:hover:bg-mint-500/10 ${focusRing}`;
type StatusFilter = "ALL" | ListAdminUsersStatus;
type UserListError = { status: number; message: string };

const statusLabels: Record<string, string> = { ACTIVE: "활성", WITHDRAWAL_PENDING: "탈퇴 예정", SUSPENDED: "이용 제한" };
const roleLabels: Record<string, string> = { MEMBER: "일반 사용자", ADMIN: "관리자" };
const verificationLabels: Record<string, string> = { VERIFIED: "인증 완료", UNVERIFIED: "미인증" };

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(date);
}
function errorText(cause: unknown, fallback: string) { return cause instanceof Error && cause.message.trim() ? cause.message : fallback; }
function StatusBadge({ status }: { status: string }) {
  const color = status === "SUSPENDED" ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300" : status === "WITHDRAWAL_PENDING" ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" : "border-mint-300 bg-mint-50 text-mint-800 dark:border-mint-800 dark:bg-mint-500/10 dark:text-mint-300";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${color}`}>{statusLabels[status] ?? status}</span>;
}
function RoleBadge({ role }: { role: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${role === "ADMIN" ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200" : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>{roleLabels[role] ?? role}</span>;
}
function ErrorPanel({ error, retry }: { error: string; retry: () => void }) {
  return <div role="alert" className="border-t border-red-200 bg-red-50 px-5 py-4 text-sm dark:border-red-900 dark:bg-red-950/30"><p className="font-bold text-red-700 dark:text-red-300">{error}</p><button type="button" onClick={retry} className={`${button} mt-3`}>다시 시도</button></div>;
}

function ActionDialog({ action, target, pending, onClose, onSubmit }: { action: AdminUserAction; target: AdminUserDetailResponse; pending: boolean; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const title = action === "promote" ? "관리자 권한 부여" : action === "suspend" ? "이용 제한" : "이용 제한 해제";
  useEffect(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("textarea:not([disabled]),button:not([disabled])"));
      if (!elements.length) return;
      const first = elements[0]; const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); returnFocus.current?.focus(); };
  }, [onClose, pending]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-5"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="admin-user-action-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-[#101419]"><h2 id="admin-user-action-title" className="text-xl font-extrabold">{title}</h2><p className="mt-2 break-all text-sm text-zinc-600 dark:text-zinc-300"><strong>{target.email}</strong><br />{target.userId}</p><label htmlFor="admin-user-action-reason" className="mt-5 block text-sm font-bold">변경 사유</label><textarea id="admin-user-action-reason" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} maxLength={500} aria-invalid={Boolean(error)} aria-describedby="admin-user-action-reason-help" className={`mt-2 min-h-24 w-full rounded-[10px] border px-3 py-2 dark:bg-zinc-900 ${error ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"} ${focusRing}`} /><p id="admin-user-action-reason-help" className={`mt-2 text-right text-xs ${error ? "text-red-600" : "text-zinc-500"}`}>{error || `${reason.length}/500`}</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={pending} onClick={onClose} className={button}>취소</button><button type="button" disabled={pending} onClick={() => { const result = buildAdminUserActionPayload(action, target.availableActions, target.version, reason); if (!result.valid) { setError(result.message); return; } onSubmit(result.value.reason); }} className={`inline-flex h-11 items-center justify-center rounded-[10px] px-4 text-sm font-extrabold text-white disabled:opacity-50 ${action === "suspend" ? "bg-red-600" : "bg-mint-500"} ${focusRing}`}>{pending ? "처리 중" : "확인"}</button></div></div></div>;
}

function History({ items, totalCount, page, loading, error, onPage, retry }: { items: AdminUserAccessHistoryItemResponse[]; totalCount: number; page: number; loading: boolean; error: string; onPage: (page: number) => void; retry: () => void }) {
  const maxPage = Math.max(1, Math.ceil(totalCount / HISTORY_PAGE_SIZE));
  return <section aria-labelledby="admin-user-history-title" className={panel} aria-busy={loading}><div className="flex items-center justify-between gap-3 px-5 py-5 md:px-6"><div><h3 id="admin-user-history-title" className="text-lg font-extrabold">계정 변경 이력</h3><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">서버에 기록된 접근 및 상태 변경 이력입니다.</p></div><span className="text-sm font-bold text-zinc-500">총 {totalCount}건</span></div>{error ? <ErrorPanel error={error} retry={retry} /> : loading ? <p className="border-t border-zinc-100 px-5 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800">이력을 불러오는 중입니다.</p> : !items.length ? <p className="border-t border-zinc-100 px-5 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800">표시할 계정 변경 이력이 없습니다.</p> : <><ul className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">{items.map((item) => <li key={item.eventId} className="px-5 py-4 text-sm md:px-6"><p className="font-extrabold">{item.action}</p><dl className="mt-2 grid gap-2 text-zinc-600 dark:text-zinc-300 sm:grid-cols-2"><div><dt className="sr-only">변경 시각</dt><dd>{formatDateTime(item.createdAt)}</dd></div><div><dt className="sr-only">변경 사유</dt><dd>사유: {item.reason ?? "-"}</dd></div><div><dt className="sr-only">권한 변경</dt><dd>권한: {item.beforeRole ?? "-"} → {item.afterRole ?? "-"}</dd></div><div><dt className="sr-only">상태 변경</dt><dd>상태: {item.beforeStatus ?? "-"} → {item.afterStatus ?? "-"}</dd></div></dl></li>)}</ul><div className="flex items-center justify-center gap-3 border-t border-zinc-100 p-4 dark:border-zinc-800"><button type="button" aria-label="이전 이력 페이지" disabled={page <= 1} onClick={() => onPage(page - 1)} className={button}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-16 text-center text-sm font-bold">{page} / {maxPage}</span><button type="button" aria-label="다음 이력 페이지" disabled={page >= maxPage} onClick={() => onPage(page + 1)} className={button}><ChevronRight className="h-4 w-4" /></button></div></>}</section>;
}

export function AdminUserManagement() {
  const [input, setInput] = useState(""); const [query, setQuery] = useState(""); const [status, setStatus] = useState<StatusFilter>("ALL"); const [page, setPage] = useState(1);
  const [list, setList] = useState<{ items: AdminUserListItemResponse[]; totalCount: number; page: number; pageSize: number }>(); const [listLoading, setListLoading] = useState(true); const [listError, setListError] = useState<UserListError | null>(null);
  const [selectedUserId, setSelectedUserId] = useState(""); const [detail, setDetail] = useState<AdminUserDetailResponse>(); const [detailLoading, setDetailLoading] = useState(false); const [detailError, setDetailError] = useState("");
  const [history, setHistory] = useState<{ items: AdminUserAccessHistoryItemResponse[]; totalCount: number }>(); const [historyPage, setHistoryPage] = useState(1); const [historyLoading, setHistoryLoading] = useState(false); const [historyError, setHistoryError] = useState("");
  const [action, setAction] = useState<AdminUserAction>(); const [mutationPending, setMutationPending] = useState(false); const [notice, setNotice] = useState(""); const listRequestId = useRef(0); const selectionRequests = useRef(createLatestAdminRequestTracker()); const selectedUserIdRef = useRef("");
  const promoteListAuthError = useCallback((apiError: AdminApiError) => { selectionRequests.current.invalidate(); selectedUserIdRef.current = ""; setList(undefined); setListError({ status: apiError.status, message: apiError.message }); setSelectedUserId(""); setDetail(undefined); setHistory(undefined); setDetailError(""); setHistoryError(""); setDetailLoading(false); setHistoryLoading(false); setAction(undefined); }, []);
  const loadList = useCallback(async (preserveSelection = false) => { const requestId = ++listRequestId.current; setListLoading(true); setListError(null); setList(undefined); if (!preserveSelection) { selectionRequests.current.invalidate(); selectedUserIdRef.current = ""; setSelectedUserId(""); setDetail(undefined); setHistory(undefined); setDetailLoading(false); setHistoryLoading(false); } try { const result = await getAdminUsers({ query: query || undefined, status: status === "ALL" ? undefined : status, page, pageSize: PAGE_SIZE }); if (requestId !== listRequestId.current) return false; setList(result); return true; } catch (cause) { if (requestId !== listRequestId.current) return false; const apiError = cause instanceof AdminApiError ? cause : new AdminApiError(0, errorText(cause, "사용자 목록을 불러오지 못했습니다.")); if (isAdminAuthenticationError(apiError.status)) promoteListAuthError(apiError); else setListError({ status: apiError.status, message: apiError.message }); return false; } finally { if (requestId === listRequestId.current) setListLoading(false); } }, [page, promoteListAuthError, query, status]);
  useEffect(() => { void loadList(); }, [loadList]);
  const loadSelected = useCallback(async (userId: string, nextHistoryPage: number) => {
    if (!isCurrentAdminUserSelection(selectedUserIdRef.current, userId)) return false;
    const requestId = selectionRequests.current.begin();
    setDetailLoading(true); setHistoryLoading(true); setDetailError(""); setHistoryError(""); setDetail(undefined); setHistory(undefined);
    const [detailResult, historyResult] = await Promise.allSettled([
      getAdminUserDetail(userId),
      getAdminUserHistory(userId, nextHistoryPage, HISTORY_PAGE_SIZE),
    ]);
    if (!selectionRequests.current.isCurrent(requestId) || !isCurrentAdminUserSelection(selectedUserIdRef.current, userId)) return false;
    const detailStatus = detailResult.status === "rejected" && detailResult.reason instanceof AdminApiError ? detailResult.reason.status : undefined;
    const historyStatus = historyResult.status === "rejected" && historyResult.reason instanceof AdminApiError ? historyResult.reason.status : undefined;
    const authError = [detailResult, historyResult].find((result) => result.status === "rejected" && result.reason instanceof AdminApiError && isAdminAuthenticationError(result.reason.status));
    if (authError?.status === "rejected" && authError.reason instanceof AdminApiError) { promoteListAuthError(authError.reason); return false; }
    const userMissing = isMissingAdminUserResource(detailStatus, historyStatus);
    if (userMissing) { selectionRequests.current.invalidate(); selectedUserIdRef.current = ""; setNotice("선택한 사용자가 더 이상 존재하지 않습니다."); setSelectedUserId(""); setDetail(undefined); setHistory(undefined); setDetailError(""); setHistoryError(""); setDetailLoading(false); setHistoryLoading(false); return false; }
    if (detailResult.status === "fulfilled") setDetail(detailResult.value);
    else setDetailError(errorText(detailResult.reason, "사용자 정보를 불러오지 못했습니다."));
    if (historyResult.status === "fulfilled") { setHistory({ items: historyResult.value.items, totalCount: historyResult.value.totalCount }); setHistoryPage(historyResult.value.page); }
    else setHistoryError(errorText(historyResult.reason, "사용자 접근 이력을 불러오지 못했습니다."));
    setDetailLoading(false); setHistoryLoading(false);
    return detailResult.status === "fulfilled" && historyResult.status === "fulfilled";
  }, [promoteListAuthError]);
  useEffect(() => { if (selectedUserId) void loadSelected(selectedUserId, 1); }, [selectedUserId, loadSelected]);
  const chooseUser = (userId: string) => { selectionRequests.current.invalidate(); selectedUserIdRef.current = userId; setHistoryPage(1); setSelectedUserId(userId); setDetail(undefined); setHistory(undefined); setDetailError(""); setHistoryError(""); setDetailLoading(true); setHistoryLoading(true); setNotice(""); };
  const search = () => { const normalized = normalizeAdminUserQuery(input); if (normalized && !isExactAdminUserQuery(normalized)) { setListError({ status: 400, message: "검색어는 전체 UUID 또는 정확한 이메일 주소여야 합니다." }); return; } setQuery(normalized); setPage(1); };
  const refreshSelected = useCallback(async () => { const targetUserId = selectedUserIdRef.current; if (!targetUserId) return false; const selectionEpoch = selectionRequests.current.begin(); const listLoaded = await loadList(true); if (!listLoaded || !selectionRequests.current.isCurrent(selectionEpoch) || !isCurrentAdminUserSelection(selectedUserIdRef.current, targetUserId)) return false; return loadSelected(targetUserId, historyPage); }, [historyPage, loadList, loadSelected]);
  const submitAction = async (reason: string) => { if (!detail || !action) return; setMutationPending(true); try { if (action === "promote") await promoteUserToAdmin(detail.userId, { reason, expectedVersion: detail.version }); else await changeUserSuspension(detail.userId, { reason, expectedVersion: detail.version, action: action === "suspend" ? "SUSPEND" : "UNSUSPEND" }); setAction(undefined); setNotice(await refreshSelected() ? "변경 결과를 최신 서버 정보로 갱신했습니다." : "변경은 완료됐지만 최신 상태를 불러오지 못했습니다. 다시 시도해 주세요."); } catch (cause) { if (cause instanceof AdminApiError && isAdminAuthenticationError(cause.status)) { promoteListAuthError(cause); } else if (cause instanceof AdminApiError && cause.status === 409) { setAction(undefined); setNotice(await refreshSelected() ? "다른 변경으로 최신 상태를 다시 확인했습니다." : "다른 변경이 감지됐지만 최신 상태를 불러오지 못했습니다. 다시 시도해 주세요."); } else { setNotice(errorText(cause, "사용자 상태를 변경하지 못했습니다.")); } } finally { setMutationPending(false); } };
  const maxPage = Math.max(1, Math.ceil((list?.totalCount ?? 0) / (list?.pageSize ?? PAGE_SIZE)));
  const listUnauthenticated = listError?.status === 401;
  const listForbidden = listError?.status === 403;
  return <><div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5"><header><p className="text-base font-medium text-zinc-500 dark:text-zinc-400">사용자 계정 상태와 관리자 권한을 실제 서버 정보로 관리합니다.</p><h1 className="mt-3 text-2xl font-extrabold">사용자 관리</h1></header>{notice ? <p role="status" className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-800 dark:border-mint-900 dark:bg-mint-500/10 dark:text-mint-300">{notice}</p> : null}<section aria-label="사용자 목록" aria-busy={listLoading} className={panel}><form onSubmit={(event) => { event.preventDefault(); search(); }} className="grid gap-3 border-b border-zinc-100 p-5 md:grid-cols-[180px_minmax(0,1fr)_auto] dark:border-zinc-800"><label className="text-sm font-bold">계정 상태<select value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }} className={`mt-2 h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-[#101419] ${focusRing}`}><option value="ALL">전체</option><option value="ACTIVE">활성</option><option value="WITHDRAWAL_PENDING">탈퇴 예정</option><option value="SUSPENDED">이용 제한</option></select></label><label htmlFor="admin-user-search" className="text-sm font-bold">사용자 검색<span className="mt-1 block text-xs font-medium text-zinc-500">전체 UUID 또는 정확한 이메일 주소</span><input id="admin-user-search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="user@example.com 또는 UUID" className={`mt-2 h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-[#101419] ${focusRing}`} /></label><button type="submit" className={`mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white ${focusRing}`}><Search className="h-4 w-4" />검색</button></form><div className="flex items-center justify-between px-5 py-4"><p className="text-sm font-bold text-zinc-500">총 {list?.totalCount ?? "-"}명</p></div>{listError ? listUnauthenticated ? <div role="alert" className="border-t border-zinc-200 px-5 py-6 dark:border-zinc-800"><h2 className="font-extrabold">로그인이 필요합니다</h2><p className="mt-2 text-sm text-zinc-500">로그인한 후 사용자 목록을 확인해 주세요.</p><Link href="/auth/login?next=/admin/users" className={`${button} mt-4`}>로그인</Link></div> : listForbidden ? <div role="alert" className="border-t border-zinc-200 px-5 py-6 dark:border-zinc-800"><h2 className="font-extrabold">관리자 권한이 필요합니다</h2><p className="mt-2 text-sm text-zinc-500">관리자만 사용자 목록을 확인할 수 있습니다.</p></div> : <ErrorPanel error={listError.message} retry={() => void loadList()} /> : listLoading ? <p className="px-5 py-12 text-center text-sm text-zinc-500">사용자 목록을 불러오는 중입니다.</p> : !list?.items.length ? <div className="px-5 py-12 text-center"><h2 className="font-extrabold">조건에 맞는 사용자가 없습니다</h2><p className="mt-2 text-sm text-zinc-500">검색 조건을 초기화하거나 정확한 UUID·이메일을 확인해 주세요.</p><button type="button" onClick={() => { setInput(""); setQuery(""); setStatus("ALL"); setPage(1); }} className={`${button} mt-4`}>조건 초기화</button></div> : <><div className="hidden overflow-x-auto border-t border-zinc-100 md:block dark:border-zinc-800"><table className="w-full min-w-[760px]"><thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900/50"><tr><th className="px-5 py-3">이메일</th><th className="px-3 py-3">역할</th><th className="px-3 py-3">상태</th><th className="px-3 py-3">인증</th><th className="px-5 py-3">가입 시각</th></tr></thead><tbody>{list.items.map((item) => <tr key={item.userId} className="border-t border-zinc-100 dark:border-zinc-800"><td className="px-5 py-4"><button type="button" onClick={() => chooseUser(item.userId)} className={`text-left font-bold hover:text-mint-700 ${focusRing}`}>{item.email}</button></td><td className="px-3 py-4"><RoleBadge role={item.role} /></td><td className="px-3 py-4"><StatusBadge status={item.status} /></td><td className="px-3 py-4 text-sm">{verificationLabels[item.emailVerificationStatus] ?? item.emailVerificationStatus}</td><td className="px-5 py-4 text-sm">{formatDateTime(item.createdAt)}</td></tr>)}</tbody></table></div><div className="divide-y divide-zinc-100 border-t border-zinc-100 md:hidden dark:divide-zinc-800 dark:border-zinc-800">{list.items.map((item) => <button key={item.userId} type="button" onClick={() => chooseUser(item.userId)} className={`w-full p-5 text-left ${focusRing}`}><p className="truncate font-extrabold">{item.email}</p><div className="mt-3 flex gap-2"><RoleBadge role={item.role} /><StatusBadge status={item.status} /></div></button>)}</div><div className="flex items-center justify-center gap-3 border-t border-zinc-100 p-4 dark:border-zinc-800"><button type="button" aria-label="이전 사용자 페이지" disabled={page <= 1} onClick={() => setPage(page - 1)} className={button}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-16 text-center text-sm font-bold">{list.page} / {maxPage}</span><button type="button" aria-label="다음 사용자 페이지" disabled={page >= maxPage} onClick={() => setPage(page + 1)} className={button}><ChevronRight className="h-4 w-4" /></button></div></>}</section>{!selectedUserId ? <section className={`${panel} px-5 py-10 text-center text-sm text-zinc-500`}>사용자 행을 선택하면 상세 정보와 접근 이력을 표시합니다.</section> : detailError ? <section className={panel}><ErrorPanel error={detailError} retry={() => void loadSelected(selectedUserId, historyPage)} /></section> : detailLoading || !detail ? <section aria-busy="true" className={`${panel} px-5 py-10 text-center text-sm text-zinc-500`}>사용자 상세 정보를 불러오는 중입니다.</section> : <><section aria-labelledby="admin-user-detail-title" className={panel}><div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5"><div><p className="text-sm text-zinc-500">선택한 계정</p><h2 id="admin-user-detail-title" className="mt-1 break-all text-xl font-extrabold">{detail.email}</h2></div><div className="flex flex-wrap gap-2">{detail.availableActions.canPromoteToAdmin ? <button type="button" onClick={() => setAction("promote")} className={button}>관리자 권한 부여</button> : null}{detail.availableActions.canSuspend ? <button type="button" onClick={() => setAction("suspend")} className={`${button} border-red-300 text-red-700`}>이용 제한</button> : null}{detail.availableActions.canUnsuspend ? <button type="button" onClick={() => setAction("unsuspend")} className={button}>이용 제한 해제</button> : null}</div></div><dl className="grid gap-5 border-t border-zinc-100 px-5 py-5 text-sm md:grid-cols-2 dark:border-zinc-800"><div><dt className="text-zinc-500">역할</dt><dd className="mt-2"><RoleBadge role={detail.role} /></dd></div><div><dt className="text-zinc-500">상태</dt><dd className="mt-2"><StatusBadge status={detail.status} /></dd></div><div><dt className="text-zinc-500">이메일 인증</dt><dd className="mt-1 font-bold">{verificationLabels[detail.emailVerificationStatus] ?? detail.emailVerificationStatus}</dd></div><div><dt className="text-zinc-500">사용자 ID</dt><dd className="mt-1 break-all font-mono text-xs font-bold">{detail.userId}</dd></div><div><dt className="text-zinc-500">가입 시각</dt><dd className="mt-1 font-bold">{formatDateTime(detail.createdAt)}</dd></div><div><dt className="text-zinc-500">탈퇴 예정 시각</dt><dd className="mt-1 font-bold">{formatDateTime(detail.withdrawalDueAt)}</dd></div></dl></section><History items={history?.items ?? []} totalCount={history?.totalCount ?? 0} page={historyPage} loading={historyLoading} error={historyError} onPage={(next) => { setHistoryPage(next); void loadSelected(selectedUserId, next); }} retry={() => void loadSelected(selectedUserId, historyPage)} /></>}</div>{action && detail ? <ActionDialog action={action} target={detail} pending={mutationPending} onClose={() => setAction(undefined)} onSubmit={(reason) => void submitAction(reason)} /> : null}</>;
}
