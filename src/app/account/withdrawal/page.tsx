import { AccountWithdrawalPage } from "@/components/member/account-withdrawal";
import { MemberShell } from "@/components/member/member-shell";

export default function WithdrawalPage() {
  return <MemberShell><AccountWithdrawalPage /></MemberShell>;
}
