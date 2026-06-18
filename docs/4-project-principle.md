# 프로젝트 구조 설계 원칙 — 공동 가계부 서비스

> 버전: 1.1
> 작성일: 2026-06-18
> 관련 문서: 1-domain-definition.md · 2-prd.md · 3-user-scenario.md · 5-arch-diagram.md

---

## 목차

1. [공통 최상위 원칙](#1-공통-최상위-원칙)
2. [의존성 / 레이어 원칙](#2-의존성--레이어-원칙)
3. [코드 / 네이밍 원칙](#3-코드--네이밍-원칙)
4. [테스트 / 품질 원칙](#4-테스트--품질-원칙)
5. [설정 / 보안 / 운영 원칙](#5-설정--보안--운영-원칙)
6. [프론트엔드 디렉토리 구조](#6-프론트엔드-디렉토리-구조)
7. [백엔드 디렉토리 구조](#7-백엔드-디렉토리-구조)
8. [변경 이력](#8-변경-이력)

---

## 1. 공통 최상위 원칙

모든 스택(FE/BE)에 동일하게 적용되는 원칙이다. 원칙 간 충돌이 발생할 경우 이 순서를 우선순위 기준으로 삼는다.

---

### P-01. 서버사이드 권한 검증 필수 (Server-Side Authority)

**한 줄 설명**: 모든 권한 판단은 서버에서 수행하며, 프론트엔드의 UI 은닉은 UX 보조 수단일 뿐 보안 수단이 아니다.

**왜**: MANAGER/MEMBER 역할 구분에 따라 정산 실행·카테고리 삭제·멤버 제거 같은 민감한 쓰기 작업이 분리되어 있다. 클라이언트 코드는 사용자가 직접 조작할 수 있으므로 UI 레벨의 버튼 숨김만으로는 공격을 막을 수 없다.

**적용 맥락**:
- `POST /groups/:id/settlements` 호출 시, 헤더의 JWT를 서버가 직접 검증하여 호출자의 그룹 내 role이 `MANAGER`인지 확인한다.
- `DELETE /groups/:id/categories/:categoryId` 역시 동일하게 role을 서버에서 확인한다.
- 프론트엔드에서 MEMBER의 화면에 정산 버튼을 보여주지 않는 것은 UX 개선이지, 보안 조치가 아님을 팀 전체가 인지해야 한다.

---

### P-02. 정산 결과 불변 (Settlement Immutability)

**한 줄 설명**: 생성된 `Settlement` 및 `SettlementDetail` 레코드는 절대 수정하지 않는다. 재정산은 새 레코드를 생성한다.

**왜**: 정산 완료 후 지출이 수정·삭제되더라도 기존 정산 결과가 변경되면 이미 공유된 정산 내역과 실제 데이터 간 불일치가 생겨 신뢰를 잃는다. 불변 레코드 방식은 각 정산 시점의 스냅샷을 보장한다(BR-15).

**적용 맥락**:
- 서비스 레이어에서 정산 관련 UPDATE/DELETE 쿼리를 작성하는 것을 금지한다.
- 재정산 요청은 항상 `INSERT`로 처리하고, 이전 정산 레코드는 그대로 둔다.
- 코드 리뷰 체크리스트에 "Settlement/SettlementDetail 테이블에 UPDATE/DELETE 쿼리가 없는가"를 포함한다.

---

### P-03. 단일 책임 원칙 (Single Responsibility)

**한 줄 설명**: 하나의 파일·함수·컴포넌트는 하나의 이유로만 변경된다.

**왜**: 금액 계산, 권한 검증, DB 저장이 한 함수에 섞이면 어느 한 로직이 바뀔 때 전체를 다시 테스트해야 한다. 책임을 분리하면 변경 범위가 명확해지고 테스트 단위가 작아진다.

**적용 맥락**:
- BE: 균등 분배 나머지 귀속 로직(`ExpenseSplit` 계산)은 별도 유틸 함수로 분리하여 단독 테스트한다.
- FE: 정산 금액 포맷팅(KRW 표시)은 컴포넌트가 아닌 유틸 함수에 위치한다.
- 하나의 Express 컨트롤러 메서드가 비즈니스 로직과 DB 쿼리를 직접 포함하면 PR에서 반려한다.

---

### P-04. 명시적 의존성 (Explicit Dependencies)

**한 줄 설명**: 함수·모듈이 필요로 하는 외부 의존성(DB 클라이언트, 설정 값 등)은 내부에서 직접 import하지 않고 인자 또는 생성자로 주입받는다.

**왜**: 암묵적 전역 의존성은 테스트 시 모킹이 어렵고, 의존 관계를 파악하려면 구현 내부를 읽어야 한다. 명시적 주입은 의존성을 인터페이스 수준에서 노출한다.

**적용 맥락**:
- Supabase 클라이언트는 `src/lib/supabase.ts`에서 초기화 후 Repository 생성자에 주입한다.
- FE의 API 호출 함수는 `axios` 인스턴스를 직접 import하지 않고 `apiClient` 파라미터로 받는 형태를 권장한다.

---

### P-05. YAGNI — 현재 필요한 것만 구현 (You Aren't Gonna Need It)

**한 줄 설명**: v1 MVP 기준으로 실제 요구사항에 없는 추상화·확장 포인트는 미리 만들지 않는다.

**왜**: 이 프로젝트는 단일 통화(KRW), 한국어 단독, 웹/모바일 웹으로 범위가 명확하게 확정되어 있다(도메인 정의 섹션 2.2, 7). 다중 통화·다국어를 고려한 추상화를 지금 넣으면 코드 복잡도만 높인다.

**적용 맥락**:
- 금액은 `integer(KRW)`로 직접 처리한다. `Money` 클래스나 통화 코드 컬럼을 지금 추가하지 않는다.
- 메시지 발송은 DB 저장 방식으로만 구현한다. 이메일·푸시 알림 인프라를 미리 추상화하지 않는다.
- i18n 라이브러리 설정은 v1에서 도입하지 않는다.

---

### P-06. 소프트 삭제 우선 (Soft Delete First)

**한 줄 설명**: 사용자 탈퇴 및 데이터 보존이 요구되는 엔티티는 물리 삭제 대신 `status` 컬럼 전환을 사용한다.

**왜**: 탈퇴한 사용자가 작성한 지출 기록은 그룹 내 다른 멤버의 정산 결과에 연결되어 있다. 물리 삭제 시 FK 참조 오류 또는 데이터 유실이 발생한다(BR-12).

**적용 맥락**:
- `User` 탈퇴 → `User.status = inactive` 처리. `DELETE FROM users` 쿼리를 사용하지 않는다.
- `GroupMember` 탈퇴 → 레코드 삭제(단, 연결된 `Expense`·`ExpenseSplit`는 보존).
- Repository 메서드명: `deactivateUser()`, `removeGroupMember()`처럼 의도를 명확히 표현한다.

---

### P-07. 관심사 분리 (Separation of Concerns)

**한 줄 설명**: 입력 검증, 비즈니스 로직, 데이터 접근, 응답 직렬화는 각기 다른 계층에서 처리한다.

**왜**: 계층이 섞이면 입력 형식이 바뀔 때 비즈니스 로직까지 수정해야 하거나, DB 스키마 변경이 API 응답 형식에 직접 영향을 준다. 계층 분리는 변경 파급 범위를 제한한다.

**적용 맥락**:
- 요청 바디 유효성 검사(금액 범위, 날짜 형식)는 미들웨어(validator)에서 처리하고, 컨트롤러에는 검증된 데이터만 도달한다.
- DB 레코드를 그대로 API 응답으로 반환하지 않는다. 컨트롤러에서 응답 DTO로 변환한다.
- FE: API 응답 타입 변환은 API Client 레이어에서 처리하고, 컴포넌트는 도메인 타입만 다룬다.

---

### P-08. 시간대 일관성 (Timezone Consistency)

**한 줄 설명**: 서버는 항상 UTC로 저장하고, KST 변환은 UI 렌더링 시점에만 수행한다.

**왜**: 서버·DB·로그가 서로 다른 시간대를 혼용하면 정산 기간 경계 계산 오류가 생긴다. `period_start` 00:00:00 KST를 UTC로 잘못 저장하면 1시간치 지출이 누락 또는 중복 집계된다(도메인 정의 섹션 2.3).

**적용 맥락**:
- BE: 모든 `timestamp` 컬럼은 `timestamptz`(PostgreSQL)로 선언하고 UTC 값을 저장한다.
- BE: 정산 기간 조회 쿼리에서 KST 기준 `period_start` 00:00:00을 UTC로 변환 후 `WHERE expense.date >= ?`에 사용한다.
- FE: 날짜 표시 시 `date-fns-tz` 등 라이브러리로 UTC → KST 변환하며, API 전송 시에는 KST 날짜 문자열(`YYYY-MM-DD`)을 그대로 보낸다. 서버가 KST 기준으로 해석한다.

---

## 2. 의존성 / 레이어 원칙

### 2.1 기본 원칙

- **단방향 의존**: 상위 레이어만 하위 레이어를 알고, 하위 레이어는 상위 레이어를 참조하지 않는다.
- **역방향 의존 금지**: Repository가 Service를 import하거나, API Client가 React 컴포넌트를 import하는 것은 허용하지 않는다.
- **외부 의존성 주입 위치**: Supabase 클라이언트, JWT 라이브러리, 환경변수 기반 설정은 각 스택의 최하위 인프라 레이어(`lib/` 또는 `config/`)에서만 초기화한다.

---

### 2.2 백엔드 레이어 구조

```
┌─────────────────────────────────────────────────┐
│  Client (HTTP Request)                          │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│  Middleware Layer                               │
│  - 인증 검증 (JWT 파싱·서명 확인)               │
│  - 권한 검증 (MANAGER/MEMBER role 확인)         │
│  - 요청 유효성 검사 (스키마 검증)               │
│  - 에러 핸들링 (전역 오류 포착)                 │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│  Controller Layer  (routes/ + controllers/)     │
│  - HTTP 요청 파싱, 응답 직렬화                  │
│  - DTO 변환 (DB 모델 → 응답 객체)               │
│  - HTTP 상태 코드 결정                          │
│  의존: Service Layer만 호출                     │
└───────────────────┬─────────────────────────────┘
                    │ (단방향)
┌───────────────────▼─────────────────────────────┐
│  Service Layer  (services/)                     │
│  - 비즈니스 규칙 처리 (정산 집계, 분담 계산 등) │
│  - 트랜잭션 조율 (여러 Repository 호출 묶음)    │
│  - 도메인 이벤트 처리 (메시지 발송 트리거)      │
│  의존: Repository Layer만 호출                  │
└───────────────────┬─────────────────────────────┘
                    │ (단방향)
┌───────────────────▼─────────────────────────────┐
│  Repository Layer  (repositories/)              │
│  - SQL/Supabase 쿼리 작성                       │
│  - 데이터 매핑 (DB row → 도메인 모델)           │
│  의존: lib/supabase.ts (외부 주입)              │
└───────────────────┬─────────────────────────────┘
                    │ (단방향)
┌───────────────────▼─────────────────────────────┐
│  Infrastructure  (lib/ + config/)               │
│  - Supabase 클라이언트 초기화                   │
│  - 환경변수 로딩 및 검증                        │
│  - JWT 서명·검증 유틸                           │
└─────────────────────────────────────────────────┘
```

**레이어 간 역방향 의존 금지 예시**:

```typescript
// Bad: Repository가 Service를 import
import { SettlementService } from '../services/settlement.service';

// Good: Repository는 Supabase 클라이언트만 의존
import { supabase } from '../lib/supabase';
```

**외부 의존성 주입 위치**:

| 의존성 | 초기화 위치 | 주입 방식 |
|--------|------------|----------|
| DB 연결 풀 (postgres.js) | `src/lib/db.ts` | Repository에서 import |
| JWT 서명·검증 | `src/lib/jwt.ts` | 미들웨어에서 import |
| 환경변수 설정 | `src/config/env.ts` | 각 레이어에서 import |
| bcrypt | `src/lib/crypto.ts` | UserService에서 import |

---

### 2.3 프론트엔드 레이어 구조

```
┌─────────────────────────────────────────────────┐
│  Page  (pages/)                                 │
│  - 라우트 단위 진입점                            │
│  - 레이아웃 조합, 페이지 수준 상태 관리          │
│  의존: Component, Hook                          │
└───────────────────┬─────────────────────────────┘
                    │ (단방향)
┌───────────────────▼─────────────────────────────┐
│  Component  (components/)                       │
│  - UI 렌더링, 사용자 이벤트 처리                 │
│  - 도메인 데이터를 표시 형식으로 변환 (KRW 포맷) │
│  의존: Hook (데이터 요청), 유틸 함수             │
└───────────────────┬─────────────────────────────┘
                    │ (단방향)
┌───────────────────▼─────────────────────────────┐
│  Hook  (hooks/)                                 │
│  - 서버 상태 관리 (React Query / SWR)           │
│  - 비즈니스 로직 캡슐화 (폼 유효성, 계산)       │
│  의존: API Client                               │
└───────────────────┬─────────────────────────────┘
                    │ (단방향)
┌───────────────────▼─────────────────────────────┐
│  API Client  (api/)                             │
│  - HTTP 요청 전송 및 응답 파싱                   │
│  - 서버 응답 타입 → 프론트엔드 도메인 타입 변환  │
│  - 에러 응답 파싱 및 표준화                     │
│  의존: axios 인스턴스 (lib/axios.ts)            │
└───────────────────┬─────────────────────────────┘
                    │ (단방향)
┌───────────────────▼─────────────────────────────┐
│  Server (Backend API)                           │
└─────────────────────────────────────────────────┘
```

**레이어 간 역방향 의존 금지 예시**:

```typescript
// Bad: API Client가 React Hook을 import
import { useAuthStore } from '../hooks/useAuthStore';

// Good: API Client는 토큰을 axios 인터셉터에서 주입받음
axiosInstance.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getAccessToken()}`;
  return config;
});
```

---

## 3. 코드 / 네이밍 원칙

### 3.1 파일 / 디렉토리 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| FE 컴포넌트 파일 | PascalCase | `ExpenseList.tsx`, `SettlementCard.tsx` |
| FE 훅 파일 | camelCase, `use` 접두사 | `useExpenseList.ts`, `useSettlement.ts` |
| FE 페이지 파일 | PascalCase | `GroupDetailPage.tsx` |
| FE 유틸 파일 | camelCase | `formatCurrency.ts`, `dateUtils.ts` |
| FE API 클라이언트 파일 | camelCase | `expenseApi.ts`, `settlementApi.ts` |
| BE 컨트롤러 파일 | camelCase, `.controller.ts` | `expense.controller.ts` |
| BE 서비스 파일 | camelCase, `.service.ts` | `settlement.service.ts` |
| BE 리포지토리 파일 | camelCase, `.repository.ts` | `expense.repository.ts` |
| BE 미들웨어 파일 | camelCase, `.middleware.ts` | `auth.middleware.ts`, `role.middleware.ts` |
| BE 라우터 파일 | camelCase, `.routes.ts` | `expense.routes.ts` |
| 디렉토리 | kebab-case (복수형) | `components/`, `expense-splits/` |

---

### 3.2 변수 / 함수 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수, 함수 | camelCase | `totalAmount`, `calculateEqualSplit()` |
| 클래스, 인터페이스, 타입 | PascalCase | `ExpenseService`, `SettlementDetail` |
| 상수 (불변 값) | UPPER_SNAKE_CASE | `MAX_AMOUNT`, `ACCESS_TOKEN_TTL_MS` |
| Boolean 변수/함수 | `is`/`has`/`can` 접두사 | `isManager`, `hasExpired`, `canSettle` |
| 이벤트 핸들러 (FE) | `handle` 접두사 | `handleExpenseSubmit`, `handleDeleteClick` |
| 비동기 함수 | 동사 + 명사 | `fetchExpenses()`, `createSettlement()` |

```typescript
// Bad
const d = new Date();
const amt = 10000;
function settlement() { ... }

// Good
const createdAt = new Date();
const totalAmount = 10000;
function createSettlement() { ... }
```

---

### 3.3 TypeScript 타입 정의 원칙

- **`any` 사용 금지**: `tsconfig.json`에서 `"noImplicitAny": true` 설정을 강제한다. 불가피한 경우 `unknown`을 사용하고 타입 가드를 적용한다.
- **도메인 타입 정의 위치**:
  - BE: `src/types/domain.ts`에 공유 도메인 타입 정의
  - FE: `src/types/domain.ts`에 동일한 도메인 타입 정의 (백엔드 응답 스키마 기반)
- **API 응답 타입**: `src/types/api.ts`에 요청/응답 DTO 타입 별도 정의
- **열거형**: TypeScript `enum` 대신 `as const` 객체를 사용하여 트리쉐이킹 이점을 활용한다.

```typescript
// Bad
const role: any = memberData.role;

// Good
const ROLE = { MANAGER: 'MANAGER', MEMBER: 'MEMBER' } as const;
type Role = typeof ROLE[keyof typeof ROLE];
const role: Role = memberData.role;
```

- **금액 타입**: `number`를 사용하되, 소수점이 절대 없음을 보장하기 위해 `Math.floor()` 처리를 금액 계산 함수 내부에서만 수행한다. 외부에서 `parseFloat` 결과를 금액으로 사용하지 않는다.

---

### 3.4 API 엔드포인트 네이밍

- RESTful 리소스 중심 설계, 복수 명사 사용
- 계층 관계는 URL 경로로 표현 (최대 3단계)
- 동사는 HTTP 메서드로 표현

| HTTP 메서드 | 엔드포인트 | 설명 |
|-------------|-----------|------|
| POST | `/api/v1/auth/signup` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 |
| GET | `/api/v1/groups` | 내 그룹 목록 |
| POST | `/api/v1/groups` | 그룹 생성 |
| GET | `/api/v1/groups/:groupId` | 그룹 상세 |
| GET | `/api/v1/groups/:groupId/expenses` | 지출 목록 |
| POST | `/api/v1/groups/:groupId/expenses` | 지출 등록 |
| PATCH | `/api/v1/groups/:groupId/expenses/:expenseId` | 지출 수정 |
| DELETE | `/api/v1/groups/:groupId/expenses/:expenseId` | 지출 삭제 |
| POST | `/api/v1/groups/:groupId/settlements` | 정산 실행 |
| GET | `/api/v1/groups/:groupId/settlements` | 정산 목록 |
| GET | `/api/v1/groups/:groupId/reports/expenses/export` | 지출 내역 엑셀 내보내기 |
| GET | `/api/v1/groups/:groupId/reports/settlements/:settlementId/export` | 정산 금액 엑셀 내보내기 |
| POST | `/api/v1/groups/:groupId/invitations` | 멤버 초대 |
| PATCH | `/api/v1/invitations/:invitationId` | 초대 응답 (수락/거절) |
| GET | `/api/v1/messages` | 내 메시지 목록 |

```
// Bad
POST /api/v1/doSettlement
GET  /api/v1/getGroupExpenses?group=abc

// Good
POST /api/v1/groups/:groupId/settlements
GET  /api/v1/groups/:groupId/expenses
```

---

### 3.5 DB 컬럼 / 테이블 네이밍

- 테이블명: snake_case 복수형 (`users`, `group_members`, `expense_splits`)
- 컬럼명: snake_case (`total_amount`, `paid_by`, `created_at`)
- PK: `id` (UUID)
- FK: `참조_테이블_단수형_id` 형식 (`group_id`, `user_id`, `settlement_id`)
- 타임스탬프: `created_at`, `updated_at`, `deleted_at` (UTC, `timestamptz`)
- Boolean: `is_` 접두사 금지, 의미 있는 명사/형용사 사용 (`status` enum 선호)

```sql
-- Bad
CREATE TABLE GroupMember (groupID uuid, userId uuid, Role varchar);

-- Good
CREATE TABLE group_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id),
  user_id     uuid NOT NULL REFERENCES users(id),
  role        varchar(10) NOT NULL CHECK (role IN ('MANAGER', 'MEMBER')),
  joined_at   timestamptz NOT NULL DEFAULT now()
);
```

---

### 3.6 상수 / 환경변수 네이밍

- 환경변수: UPPER_SNAKE_CASE, 목적을 명확히 표현
- 코드 내 상수: UPPER_SNAKE_CASE, `src/constants/` 디렉토리에 도메인별 파일로 분리

```
// .env 환경변수 네이밍
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=2592000
BCRYPT_COST=12
PORT=3000
NODE_ENV=development

// src/constants/expense.ts
export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 999_999_999;
export const SPLIT_TYPE = { EQUAL: 'EQUAL', CUSTOM: 'CUSTOM' } as const;

// src/constants/auth.ts
export const ROLE = { MANAGER: 'MANAGER', MEMBER: 'MEMBER' } as const;
export const INVITATION_EXPIRE_DAYS = 7;
```

---

## 4. 테스트 / 품질 원칙

### 4.1 테스트 피라미드

```
        /\
       /E2E\          5% — 핵심 사용자 시나리오 (정산 플로우 전체)
      /──────\
     /통합 테스트\    25% — API 엔드포인트, DB 연동 확인
    /────────────\
   /  단위 테스트  \  70% — 비즈니스 로직, 유틸 함수, 권한 검증
  /────────────────\
```

---

### 4.2 필수 테스트 대상

다음 항목은 PR 병합 전 테스트 커버리지 확인이 필수다.

**비즈니스 규칙 (단위 테스트)**:

| 대상 | 검증 항목 |
|------|----------|
| 균등 분배 계산 | 나머지 금액이 `paid_by`에게 귀속되는지 (AC-ES1) |
| CUSTOM 분담 검증 | 멤버별 합산이 `total_amount`와 불일치 시 오류 (AC-ES3) |
| 금액 범위 검증 | 1원 미만, 999,999,999원 초과 입력 거부 |
| 정산 기간 검증 | `period_start > period_end` 거부 (AC-S1) |
| KST-UTC 변환 | 정산 기간 경계가 KST 00:00:00 기준으로 정확히 계산되는지 |

**권한 검증 (통합 테스트)**:

| 시나리오 | 기대 결과 |
|---------|----------|
| MEMBER가 `POST /settlements` 호출 | 403 반환 |
| 다른 그룹 멤버가 지출 삭제 시도 | 403 반환 |
| 미인증 요청 (토큰 없음) | 401 반환 |
| 만료된 Access Token으로 요청 | 401 반환 |
| MANAGER가 SYSTEM 카테고리 삭제 시도 | 403 반환 |

**정산 결과 불변 (통합 테스트)**:

| 시나리오 | 기대 결과 |
|---------|----------|
| 정산 완료 후 해당 기간 지출 금액 수정 | Settlement/SettlementDetail 레코드 불변 |
| 정산 완료 후 해당 기간 지출 삭제 | Settlement/SettlementDetail 레코드 불변 |

---

### 4.3 커버리지 목표

| 대상 | 목표 커버리지 |
|------|-------------|
| BE `services/` (비즈니스 로직) | 라인 커버리지 80% 이상 |
| BE `repositories/` (DB 접근) | 통합 테스트로 주요 쿼리 확인 (별도 라인 목표 없음) |
| FE `utils/` (유틸 함수) | 라인 커버리지 90% 이상 |
| FE `hooks/` (커스텀 훅) | 핵심 데이터 훅 단위 테스트 작성 |
| 전체 BE | 라인 커버리지 70% 이상 |

---

### 4.4 코드 리뷰 기준

**PR 규모**:
- 하나의 PR은 단일 기능 또는 단일 버그 수정 범위로 제한한다.
- 변경 파일 수 20개 초과 또는 변경 라인 500줄 초과 시 PR 분리를 권장한다.

**리뷰 체크리스트**:

```
[ ] 서버사이드 권한 검증이 모든 쓰기 엔드포인트에 적용되어 있는가?
[ ] Settlement/SettlementDetail 테이블에 UPDATE/DELETE 쿼리가 없는가?
[ ] 금액 처리 시 소수점 연산 없이 정수만 사용하는가?
[ ] 민감 정보(비밀번호, 토큰)가 로그에 출력되지 않는가?
[ ] 환경변수 하드코딩이 없는가?
[ ] any 타입 사용이 없는가?
[ ] 새로운 비즈니스 규칙에 대한 테스트가 포함되어 있는가?
[ ] API 에러 응답이 표준 형식(errorCode, message)을 따르는가?
[ ] DB 쿼리에 사용자 입력값이 직접 문자열 결합되지 않는가?
```

---

### 4.5 린팅 / 포매팅 도구

| 도구 | 대상 | 설정 |
|------|------|------|
| ESLint | FE/BE TypeScript | `@typescript-eslint` 권장 규칙, `no-explicit-any` 활성화 |
| Prettier | FE/BE 전체 | 단일 `.prettierrc` (탭 너비 2, 세미콜론 있음, 작은따옴표) |
| `tsc --noEmit` | FE/BE TypeScript | 타입 오류 0건 유지 |

---

### 4.6 CI 파이프라인 자동 실행 항목

Pull Request 생성 및 커밋 푸시 시 다음 항목이 자동 실행된다. 하나라도 실패하면 병합을 차단한다.

```
1. TypeScript 타입 검사 (tsc --noEmit)
2. ESLint 검사 (0 errors)
3. Prettier 포맷 검사
4. 단위 테스트 전체 실행
5. 통합 테스트 전체 실행 (테스트 DB 사용)
6. 커버리지 리포트 생성 (목표 미달 시 경고)
```

---

## 5. 설정 / 보안 / 운영 원칙

### 5.1 환경변수 관리

- 모든 환경별 설정값은 환경변수로 관리하며, 코드에 하드코딩하지 않는다.
- `.env.example` 파일을 항상 최신 상태로 유지한다. 새 환경변수 추가 시 반드시 `.env.example`에도 키와 설명 주석을 추가한다.
- `.env` 파일은 `.gitignore`에 포함하여 절대 커밋하지 않는다.
- 서버 시작 시 필수 환경변수 존재 여부를 검증하고, 누락 시 즉시 프로세스를 종료한다.

```typescript
// src/config/env.ts — 시작 시 필수값 검증
const required = ['SUPABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing required env: ${key}`);
});
```

**환경 분리**:

| 환경 | 용도 | DB |
|------|------|-----|
| `development` | 로컬 개발 | 로컬 Supabase 또는 개발용 프로젝트 |
| `test` | CI/CD 자동 테스트 | 테스트 전용 격리 DB |
| `production` | 실서비스 | 프로덕션 Supabase 프로젝트 |

---

### 5.2 보안 원칙

**JWT 저장 및 전송**:
- Access Token: 메모리(React 상태) 또는 `sessionStorage`에 저장. `localStorage` 저장 금지(XSS 취약).
- Refresh Token: `httpOnly` + `Secure` + `SameSite=Strict` 쿠키로 전송. JavaScript 접근 불가.
- 토큰 갱신: Refresh Token 쿠키를 서버에 전송하여 새 Access Token 발급.

**HTTPS 강제**:
- 프로덕션 환경에서 HTTP 요청은 HTTPS로 리다이렉트한다.
- Supabase 클라이언트 URL은 항상 `https://` 스킴을 사용한다.

**CORS 설정**:
- `Access-Control-Allow-Origin`에 허용 도메인을 명시적으로 지정한다. 와일드카드(`*`) 사용 금지.
- 개발 환경에서만 `localhost` 허용.

```typescript
// src/config/cors.ts
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://budget-book.example.com']
    : ['http://localhost:5173'];
```

**SQL Injection 방지**:
- Supabase 클라이언트 라이브러리의 파라미터 바인딩을 사용하고, 사용자 입력값을 SQL 문자열에 직접 결합하지 않는다.
- Raw SQL이 필요한 경우 Supabase의 `rpc()` 함수 또는 준비된 구문을 사용한다.

**비밀번호 해싱**:
- bcrypt를 사용하며 cost factor는 12 이상으로 설정한다(`BCRYPT_COST=12`).
- 비밀번호 평문은 해싱 즉시 메모리에서 해제하며, 로그에 절대 출력하지 않는다.

---

### 5.3 로깅 원칙

**로그 레벨 정의**:

| 레벨 | 사용 시점 | 예시 |
|------|----------|------|
| `error` | 서비스에 영향을 주는 오류 | DB 연결 실패, 처리되지 않은 예외 |
| `warn` | 주의가 필요하나 서비스는 계속 동작 | 만료된 토큰 갱신 시도, 권한 거부 |
| `info` | 정상 동작의 주요 이벤트 기록 | 정산 실행 완료, 사용자 가입 |
| `debug` | 개발 환경에서만 출력 | 쿼리 파라미터, 함수 진입/종료 |

---

### 5.6 Swagger API 문서

- API 문서는 OpenAPI 3.0 명세로 작성하고, Swagger UI에서 자동 생성된다.
- 엔드포인트: `GET /api-docs` — Swagger UI
- 명세 파일 위치: `swagger/swagger.json` (자동 생성 또는 수동 관리)
- 모든 API 엔드포인트는 요청/응답 예시와 에러 코드를 명세에 포함한다.

**민감 정보 마스킹 (필수)**:
- 로그에 절대 포함하지 않는 값: 비밀번호(`password`), JWT 토큰 전체 값, Supabase Service Role Key
- 사용자 식별 시 로그에는 `userId`(UUID)만 사용하고, 이메일·username은 해시 처리 후 기록한다.

```typescript
// Bad
logger.info(`User login: email=${req.body.email}, password=${req.body.password}`);

// Good
logger.info(`User login attempt`, { userId: user.id, ip: req.ip });
```

**필수 로깅 이벤트**:

| 이벤트 | 레벨 | 포함 정보 |
|--------|------|----------|
| 사용자 가입 | info | userId, 가입 시각 |
| 로그인 성공/실패 | info/warn | userId 또는 시도 IP, 결과 |
| 정산 실행 | info | groupId, settlementId, executorUserId, 기간 |
| 권한 거부 (403) | warn | userId, 요청 URL, 필요 role |
| 서버 에러 (5xx) | error | 스택 트레이스, 요청 ID |
| 토큰 만료·갱신 | warn/info | userId, 토큰 종류 |

---

### 5.4 에러 처리 원칙

**클라이언트 노출 에러 vs 서버 내부 에러**:

- 4xx 에러: 클라이언트가 수정할 수 있는 오류. 명확한 에러 코드와 메시지를 응답에 포함한다.
- 5xx 에러: 서버 내부 오류. 클라이언트에는 일반적인 오류 메시지만 반환하고, 상세 내용은 서버 로그에만 기록한다. 스택 트레이스를 API 응답에 절대 포함하지 않는다.

**표준 에러 응답 형식**:

```json
{
  "success": false,
  "errorCode": "INSUFFICIENT_ROLE",
  "message": "이 작업을 수행할 권한이 없습니다.",
  "details": {}
}
```

**에러 코드 체계**:

| errorCode | HTTP | 설명 |
|-----------|------|------|
| `INVALID_INPUT` | 400 | 요청 형식 오류, 필드 누락 |
| `UNAUTHENTICATED` | 401 | 토큰 없음 또는 만료 |
| `INSUFFICIENT_ROLE` | 403 | 역할 권한 부족 |
| `RESOURCE_NOT_FOUND` | 404 | 리소스 없음 |
| `DUPLICATE_RESOURCE` | 409 | 중복 (username, 초대 등) |
| `VALIDATION_FAILED` | 422 | 비즈니스 규칙 위반 (금액 범위, 날짜 역전 등) |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

**전역 에러 핸들러**: Express의 4-파라미터 미들웨어 `(err, req, res, next)`를 `src/middlewares/errorHandler.middleware.ts`에 단일 구현하고, 모든 라우터 뒤에 등록한다.

---

### 5.5 배포 원칙

- **무중단 배포**: 새 버전 배포 시 기존 요청이 처리 완료된 후 프로세스가 종료되도록 `SIGTERM` 시그널 핸들링을 구현한다(Graceful Shutdown).
- **DB 마이그레이션**: 배포 전 마이그레이션을 먼저 적용한다. 마이그레이션은 항상 하위 호환성을 유지한다(기존 컬럼 즉시 삭제 금지, `NOT NULL` 컬럼 추가 시 기본값 필수).
- **환경 분리**: `development` → `test(CI)` → `production` 순서로 검증 후 배포한다. 프로덕션 DB에 직접 쿼리를 실행하지 않는다.

---

## 6. 프론트엔드 디렉토리 구조

**선택 근거**: 도메인별 구조(feature-based)를 채택한다. v1에서 도메인이 10개로 명확하게 정의되어 있고, 기능별로 묶으면 같은 도메인의 컴포넌트·훅·타입이 분산되지 않아 응집도가 높다.

**공통 vs 도메인 컴포넌트 분리 기준**:
- `components/common/`: 도메인에 의존하지 않는 재사용 UI (Button, Modal, Table, Input 등)
- `components/[domain]/`: 특정 도메인 데이터를 직접 다루는 컴포넌트 (ExpenseCard, SettlementSummary 등)
- 컴포넌트가 도메인 타입 import 없이 props만으로 동작하면 `common/`에 위치한다.

```
frontend/
├── public/                        # 정적 파일 (favicon, index.html)
├── src/
│   ├── pages/                     # 라우트 단위 페이지 컴포넌트 (React Router 기준)
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── groups/
│   │   │   ├── GroupListPage.tsx
│   │   │   ├── GroupDetailPage.tsx
│   │   │   └── GroupCreatePage.tsx
│   │   ├── expenses/
│   │   │   ├── ExpenseListPage.tsx
│   │   │   └── ExpenseFormPage.tsx
│   │   ├── settlements/
│   │   │   └── SettlementPage.tsx
│   │   └── messages/
│   │       └── MessageListPage.tsx
│   │
│   ├── components/                # UI 컴포넌트 (렌더링 책임만 가짐)
│   │   ├── common/                # 도메인 비의존 공통 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── layout/                # 페이지 레이아웃 (헤더, 사이드바, 네비게이션)
│   │   │   ├── AppLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── expenses/              # 지출 도메인 컴포넌트
│   │   │   ├── ExpenseCard.tsx
│   │   │   ├── ExpenseForm.tsx    # 균등/개별 분담 입력 포함
│   │   │   └── ExpenseSplitInput.tsx
│   │   ├── settlements/           # 정산 도메인 컴포넌트
│   │   │   ├── SettlementSummary.tsx
│   │   │   └── SettlementDetail.tsx
│   │   ├── groups/                # 그룹 도메인 컴포넌트
│   │   │   ├── GroupCard.tsx
│   │   │   └── MemberList.tsx
│   │   └── charts/                # 차트 컴포넌트 (카테고리별·멤버별 파이 차트)
│   │       ├── CategoryPieChart.tsx
│   │       └── MemberPieChart.tsx
│   │
│   ├── hooks/                     # 커스텀 훅 (서버 상태·비즈니스 로직 캡슐화)
│   │   ├── useAuth.ts             # 인증 상태, 로그인/로그아웃
│   │   ├── useExpenses.ts         # 지출 목록 조회, 생성, 수정, 삭제
│   │   ├── useSettlement.ts       # 정산 실행, 목록 조회
│   │   ├── useGroups.ts           # 그룹 목록, 생성, 멤버 관리
│   │   ├── useInvitations.ts      # 초대 발송, 수락, 거절
│   │   └── useMessages.ts         # 메시지 목록 조회
│   │
│   ├── api/                       # HTTP 요청 함수 (API 호출 책임만 가짐)
│   │   ├── client.ts              # axios 인스턴스, 인터셉터 (토큰 주입, 갱신)
│   │   ├── authApi.ts             # 인증 관련 API 함수
│   │   ├── groupApi.ts            # 그룹 관련 API 함수
│   │   ├── expenseApi.ts          # 지출 관련 API 함수
│   │   ├── settlementApi.ts       # 정산 관련 API 함수
│   │   ├── invitationApi.ts       # 초대 관련 API 함수
│   │   └── messageApi.ts          # 메시지 관련 API 함수
│   │
│   ├── types/                     # TypeScript 타입 정의
│   │   ├── domain.ts              # 도메인 엔티티 타입 (User, Group, Expense 등)
│   │   └── api.ts                 # API 요청/응답 DTO 타입
│   │
│   ├── constants/                 # 전역 상수 (도메인 enum 값, 설정 상수)
│   │   ├── roles.ts               # ROLE, 권한 상수
│   │   ├── expense.ts             # AMOUNT_MIN/MAX, SPLIT_TYPE 등
│   │   └── routes.ts              # 라우트 경로 상수
│   │
│   ├── utils/                     # 순수 유틸 함수 (부수효과 없음)
│   │   ├── formatCurrency.ts      # KRW 금액 포맷팅 (1000 → '1,000원')
│   │   ├── dateUtils.ts           # UTC-KST 변환, 날짜 포맷팅
│   │   ├── splitCalculator.ts     # 균등 분배 계산 (나머지 귀속 로직)
│   │   └── validators.ts          # 클라이언트 사이드 입력 검증
│   │
│   ├── lib/                       # 외부 라이브러리 초기화 및 래퍼
│   │   └── queryClient.ts         # React Query 클라이언트 설정
│   │
│   ├── App.tsx                    # 라우터 설정, 전역 Provider 조합
│   └── main.tsx                   # React 진입점
│
├── .env.example                   # 환경변수 템플릿
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
└── vite.config.ts
```

**API 호출 코드 위치 및 관리 방식**:
- API 호출 함수는 반드시 `src/api/` 디렉토리의 도메인별 파일에 위치한다.
- 컴포넌트에서 `axios` 또는 `fetch`를 직접 호출하지 않는다.
- 서버 상태 관리는 `hooks/`의 커스텀 훅에서 React Query를 사용하여 캐싱·갱신을 처리한다.
- 토큰 갱신 로직은 `api/client.ts`의 axios 인터셉터에서만 처리한다.

---

## 7. 백엔드 디렉토리 구조

```
backend/
├── src/
│   ├── routes/                    # Express 라우터 등록 (URL 패턴 → 컨트롤러 연결)
│   │   ├── index.ts               # 전체 라우터 집합 등록 (/api/v1 기준)
│   │   ├── auth.routes.ts
│   │   ├── group.routes.ts
│   │   ├── expense.routes.ts
│   │   ├── settlement.routes.ts
│   │   ├── invitation.routes.ts
│   │   ├── category.routes.ts
│   │   └── message.routes.ts
│   │
│   ├── controllers/               # HTTP 요청 파싱, 응답 직렬화 (비즈니스 로직 없음)
│   │   ├── auth.controller.ts
│   │   ├── group.controller.ts
│   │   ├── expense.controller.ts
│   │   ├── settlement.controller.ts
│   │   ├── invitation.controller.ts
│   │   ├── category.controller.ts
│   │   └── message.controller.ts
│   │
│   ├── services/                  # 비즈니스 규칙 처리, 트랜잭션 조율
│   │   ├── auth.service.ts        # 회원가입, 로그인, 토큰 갱신, 탈퇴
│   │   ├── group.service.ts       # 그룹 생성/수정, 멤버 관리, MANAGER 이양
│   │   ├── expense.service.ts     # 지출 등록/수정/삭제, 분담 계산
│   │   ├── settlement.service.ts  # 정산 집계 실행, SettlementDetail 생성, 메시지 트리거
│   │   ├── invitation.service.ts  # 초대 발송, 수락, 거절, 만료 처리
│   │   ├── category.service.ts    # 카테고리 추가/삭제, 삭제 시 재분류
│   │   └── message.service.ts     # 메시지 조회
│   │
│   ├── repositories/              # Supabase 쿼리 작성, 결과를 도메인 모델로 변환
│   │   ├── user.repository.ts
│   │   ├── group.repository.ts
│   │   ├── groupMember.repository.ts
│   │   ├── expense.repository.ts
│   │   ├── expenseSplit.repository.ts
│   │   ├── settlement.repository.ts
│   │   ├── settlementDetail.repository.ts
│   │   ├── invitation.repository.ts
│   │   ├── category.repository.ts
│   │   └── message.repository.ts
│   │
│   ├── middlewares/               # Express 미들웨어 (공통 횡단 관심사)
│   │   ├── auth.middleware.ts     # JWT 파싱·서명 검증, req.user 주입
│   │   ├── role.middleware.ts     # 그룹 내 MANAGER/MEMBER role 서버사이드 확인
│   │   ├── validate.middleware.ts # 요청 바디·파라미터 스키마 검증 (zod 또는 joi)
│   │   └── errorHandler.middleware.ts  # 전역 에러 포착, 표준 에러 응답 반환
│   │
│   ├── types/                     # TypeScript 타입 정의
│   │   ├── domain.ts              # 도메인 엔티티 타입 (User, Group, Expense 등)
│   │   ├── api.ts                 # 요청/응답 DTO 타입
│   │   └── express.d.ts           # Express Request 확장 (req.user 타입 추가)
│   │
│   ├── constants/                 # 전역 상수
│   │   ├── roles.ts
│   │   ├── expense.ts
│   │   └── errorCodes.ts          # 에러 코드 상수 (INSUFFICIENT_ROLE 등)
│   │
│   ├── utils/                     # 순수 유틸 함수
│   │   ├── splitCalculator.ts     # 균등 분배 계산 (핵심 비즈니스 로직, 단독 테스트)
│   │   ├── dateUtils.ts           # KST-UTC 변환, 정산 기간 경계 계산
│   │   └── validators.ts          # 금액 범위, 날짜 유효성 순수 함수
│   │
│   ├── config/                    # 환경변수 로딩·검증, 앱 설정
│   │   ├── env.ts                 # 필수 환경변수 검증 및 export
│   │   └── cors.ts                # CORS 허용 도메인 설정
│   │
│   ├── lib/                       # 외부 라이브러리 초기화 (단일 인스턴스)
│   │   ├── db.ts                  # DB 연결 풀 (postgres.js 기반, max 10 연결)
│   │   └── jwt.ts                 # JWT 서명·검증 유틸 함수
│   │
│   └── app.ts                     # Express 앱 조립 (미들웨어 등록 순서, 라우터 마운트)
│
├── tests/
│   ├── unit/                      # 단위 테스트 (services/, utils/ 대상)
│   │   ├── splitCalculator.test.ts
│   │   ├── settlement.service.test.ts
│   │   └── dateUtils.test.ts
│   ├── integration/               # 통합 테스트 (API 엔드포인트, 권한 시나리오)
│   │   ├── auth.test.ts
│   │   ├── expense.test.ts
│   │   └── settlement.test.ts
│   └── helpers/                   # 테스트 픽스처, DB 초기화 유틸
│       └── testDb.ts
│
├── migrations/                    # DB 마이그레이션 SQL 파일 (Supabase CLI)
│   ├── 20260618000001_create_users.sql
│   ├── 20260618000002_create_groups.sql
│   └── ...
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
└── package.json
```

**도메인 엔티티별 파일 구조**:
- 10개 도메인 엔티티(User, Group, GroupMember, Invitation, Category, Expense, ExpenseSplit, Settlement, SettlementDetail, Message)는 각각 `controller`, `service`, `repository` 파일을 갖는다.
- 엔티티 간 연산(예: 정산 집계 = Expense + ExpenseSplit + Settlement)은 `settlement.service.ts`에서 여러 Repository를 조합하여 처리한다.

**미들웨어 구성 및 등록 순서**:

```typescript
// src/app.ts — 미들웨어 등록 순서
app.use(helmet());                          // 보안 헤더
app.use(cors(corsConfig));                  // CORS
app.use(express.json());                    // JSON 파싱
app.use('/api/v1', routes);                 // 라우터 (auth 미들웨어는 라우터 내 개별 적용)
app.use(errorHandler);                      // 전역 에러 핸들러 (마지막)
```

**DB 연결 풀 초기화 위치 및 주입 방식**:
- `src/lib/db.ts`에서 postgres.js 기반 DB 연결 풀을 생성하고 export한다.
- 연결 풀 크기는 최대 10개(`max: 10`)로 설정하여 메모리 효율성과 동시성을 균형맞춘다.
- Supabase PostgreSQL 데이터베이스에 직접 연결하며, 권한 검증은 미들웨어에서 직접 처리한다.
- 각 Repository는 `lib/db.ts`의 `sql` 인스턴스를 import하여 쿼리를 실행한다.

```typescript
// src/lib/db.ts
import postgres from 'postgres';
import { env } from '../config/env';

export const sql = postgres(env.DATABASE_URL, { max: 10 });

// src/repositories/expense.repository.ts
import { sql } from '../lib/db';

export async function findExpensesByGroup(groupId: string) {
  const expenses = await sql`
    SELECT * FROM expenses 
    WHERE group_id = ${groupId}
    ORDER BY date DESC
  `;
  return expenses;
}
```

---

## 8. 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-06-18 | 최초 작성 | stepanowon |
| 1.1 | 2026-06-18 | (1) 백엔드 라이브러리 초기화 위치: `src/lib/supabase.ts` → `src/lib/db.ts` (postgres.js 기반 DB 연결 풀, max 10). (2) API 엔드포인트 명세에 엑셀 내보내기 추가: `GET /groups/:groupId/reports/expenses/export`, `GET /groups/:groupId/reports/settlements/:settlementId/export`. (3) Swagger UI 엔드포인트 추가: `GET /api-docs` (섹션 5.6). | stepanowon |
