// Keep save feedback within this navigation; a full reload must not replay it.
type NoticeKind = "allergen" | "registration";
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
export const consumeAllergenSaveNotice = (childId: string | undefined, token: string) => consumeNotice("allergen", childId, token);
export const createChildRegistrationNotice = (childId: string) => createNotice("registration", childId);
export const consumeChildRegistrationNotice = (childId: string, token: string) => consumeNotice("registration", childId, token);
