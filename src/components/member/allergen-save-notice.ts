// Keep save feedback within this navigation; a full reload must not replay it.
type ChildSaveKind = "allergen" | "child-info" | "notification";
type NoticeKind = ChildSaveKind | "registration";
const saveMessages: Record<ChildSaveKind, string> = {
  allergen: "알레르기 설정을 저장했습니다.",
  "child-info": "자녀 정보를 저장했습니다.",
  notification: "알림 설정을 저장했습니다.",
};
let pendingNotice: { kind: NoticeKind; childId: string; token: string } | null = null;

function createNotice(kind: NoticeKind, childId: string) {
  const token = crypto.randomUUID();
  pendingNotice = { kind, childId, token };
  return token;
}

function consumeNotice(kind: NoticeKind, childId: string | undefined, token: string) {
  const notice = pendingNotice;
  pendingNotice = null;
  return Boolean(notice && notice.kind === kind && notice.childId === childId && notice.token === token);
}

export const createAllergenSaveNotice = (childId: string) => createNotice("allergen", childId);
export const createChildRegistrationNotice = (childId: string) => createNotice("registration", childId);
export const consumeChildRegistrationNotice = (childId: string, token: string) => consumeNotice("registration", childId, token);

export const createChildSaveNotice = (kind: ChildSaveKind, childId: string) => createNotice(kind, childId);
export function consumeChildSaveNotice(childId: string | undefined, token: string) {
  const notice = pendingNotice;
  pendingNotice = null;
  if (!notice || notice.kind === "registration" || notice.childId !== childId || notice.token !== token) return;
  return saveMessages[notice.kind];
}
