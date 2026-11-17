import type { AccountProfileResponse } from "@/generated/api/member/models";

export const WITHDRAWAL_PATH = "/account/withdrawal";
export type ConfirmedAccountAccess = Pick<AccountProfileResponse, "userStatus" | "role">;

export function getConfirmedAccountAccess(profile: AccountProfileResponse): ConfirmedAccountAccess {
  if (!["ACTIVE", "WITHDRAWAL_PENDING"].includes(profile.userStatus) || !["MEMBER", "ADMIN"].includes(profile.role)) {
    throw new Error("Invalid account access response.");
  }
  return { userStatus: profile.userStatus, role: profile.role };
}

export function isWithdrawalOnly(access: ConfirmedAccountAccess | undefined) {
  return access?.userStatus === "WITHDRAWAL_PENDING";
}

export function canShowServiceManagement(authenticated: boolean | undefined, profile: AccountProfileResponse | undefined) {
  return authenticated === true && profile?.userStatus === "ACTIVE" && profile.role === "ADMIN";
}

export function getAccountPageDecision(pathname: string, access: ConfirmedAccountAccess | undefined, authenticated: boolean | undefined, checking: boolean, profileLoading: boolean) {
  if (isWithdrawalOnly(access)) return pathname === WITHDRAWAL_PATH ? "show" : "redirect-withdrawal";
  // A same-session status recheck must not remount the withdrawal page: its GET
  // reconciliation itself notifies account status observers.
  if (access) return "show";
  if (checking || (authenticated === true && profileLoading)) return "checking";
  return "show";
}
