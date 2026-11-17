import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SignupProfileFields } from "./signup-profile-fields";

describe("signup profile fields", () => {
  it("renders a labeled single-choice group with the selected value", () => {
    const html = renderToStaticMarkup(<SignupProfileFields displayName="상은" usageType="PARENT" onDisplayNameChange={vi.fn()} onUsageTypeChange={vi.fn()} />);
    expect(html).toContain('for="signup-display-name"');
    expect(html).toContain("가입 유형 안내");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('type="button"');
    expect(html.match(/name="usageType"/g)).toHaveLength(2);
    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).toContain('value="상은"');
  });
  it("associates errors with their corresponding controls", () => {
    const html = renderToStaticMarkup(<SignupProfileFields displayName="" usageType="" onDisplayNameChange={vi.fn()} onUsageTypeChange={vi.fn()} displayNameError="이름을 입력해 주세요." usageTypeError="가입 유형을 선택해 주세요." />);
    expect(html).toContain('aria-describedby="signup-display-name-error"');
    expect(html).toContain('aria-describedby="signup-usage-type-error"');
    expect(html).toContain("가입 유형을 선택해 주세요.");
  });
});
