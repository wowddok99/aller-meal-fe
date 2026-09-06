## 프론트엔드 검증 기준

- 퍼블리싱/UI 반복 작업 중에는 `npm run dev`로 실행하고 브라우저에서 화면을 확인한다.
- 시각적인 미세 조정마다 `npm run build`를 실행하지 않는다.
- 코드 변경 후에는 `npm run lint`를 실행한다.
- 최종 인계 전, PR 전, 또는 라우팅/타입 안정성/프로덕션 컴파일/Next.js 렌더링 동작에 영향을 줄 수 있는 변경일 때만 `npm run build`를 실행한다.

## UI/UX 작업 기준

- 사용자에게 보이는 화면, 컴포넌트, 반응형 레이아웃, 정보 위계, 인터랙션을 수정하거나 제안할 때는 [UI/UX 의사결정 워크플로](docs/ai-agent-guidelines/ui-ux-decision-workflow.md)를 먼저 읽고 따른다.
- 단순 문구 교체나 명확한 단일 값 수정에는 해당 워크플로의 구조 설계 단계를 생략할 수 있다.
- UI 구현·수정 전에는 `.agents/skills/frontend-ui-engineering/SKILL.md`를 읽고 따른다. API 계약, Orval DTO, 프레임워크 동작에 영향을 주는 변경은 `source-driven-development`를 추가로 사용한다.
- UI 변경 후에는 `.agents/skills/browser-testing-with-devtools/SKILL.md`를 사용한다. 해당 도구를 사용할 수 없는 환경에서는 실제 브라우저로 대체한다.
- 화면 리뷰 완료, 커밋, PR 전에는 `.agents/skills/code-review-and-quality/SKILL.md`를 읽고 따른다.
- 사용자가 화면을 확정한 뒤에만 Page Index와 계획 문서의 상태를 `완료`로 변경한다.

## 커밋 메시지 기준

- 커밋 메시지는 `<type>: 짧은 제목`과 빈 줄 뒤 핵심 변경 사항 목록으로 작성한다.
- 제목은 변경 대상과 의도를 구체적으로 표현하고, 본문은 사용자가 확인할 수 있는 핵심 변경만 2~3개 항목으로 남긴다.
- 본문 목록은 ASCII 하이픈과 공백(`- `)만 사용한다. `•`, `·`, `*` 등 다른 bullet 기호는 사용하지 않는다.
- 화면 리뷰 완료, 리뷰 상태 변경 등 작업 관리 상태는 커밋 제목과 본문에 포함하지 않는다.
- 리뷰 상태 변경은 관련 화면의 실제 변경사항과 같은 커밋에 포함할 수 있지만, 커밋 메시지에는 작성하지 않는다.
- 머지가 필요한 경우에도 Git 기본 메시지를 그대로 사용하지 않고 동일한 커밋 메시지 형식을 적용한다.

## FE-BE 계약 명세 참조

- `.codex/docs/design-review/final-selected/`의 이미지를 기준으로 화면을 구현하기 전, `.codex/docs/specs/aller-meal-fe-be-screen-api-contract.md`에서 해당 화면의 라우트, API, DTO, 상태, 제약사항을 먼저 확인한다.
- UI는 선택된 이미지에 최대한 가깝게 구현하되, 화면에 표시되는 데이터와 상호작용은 FE-BE 계약 명세 및 Swagger DTO와 호환되게 유지한다.
- 선택된 이미지에 FE-BE 계약상 제공할 수 없는 데이터가 포함되어 있으면 백엔드 데이터처럼 조용히 mock하지 않는다. 명확한 정적 UI 관례로 처리하거나 계약에 맞게 UI를 조정한다.

## 공개 급식 상세 화면 디자인 기준

- `/schools/[schoolId]/meals` 변경, 특히 “급식 조회” 영역을 수정할 때는 먼저 `.codex/docs/design-review/final-selected/01_01_public_school_meals.png`와 비교한다.
- 구현 화면은 기존 `/schools` 디자인 컨벤션과 맞추되, 섹션 구조, 컨트롤 그룹, 간격 의도, 상호작용 상태는 선택된 기준 이미지를 따른다.
- 사용자가 특정 부분 수정을 요청하더라도 “급식 조회” 컨트롤을 처음부터 재설계하지 않는다. 사용자가 명시적으로 다른 방향을 요구하지 않는 한 기준 이미지의 레이아웃을 보존한다.
