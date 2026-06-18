# 프로젝트 구조 설계 원칙 — 공동 가계부 서비스

**버전:** 1.0  
**작성일:** 2026-06-17  
**참조 문서:** `docs/1-domain-definition.md`, `docs/2-prd.md`

---

## 목차

1. [최상위 원칙](#1-최상위-원칙)
2. [의존성/레이어 원칙](#2-의존성레이어-원칙)
3. [코드/네이밍 원칙](#3-코드네이밍-원칙)
4. [테스트/품질 원칙](#4-테스트품질-원칙)
5. [설정/보안/운영 원칙](#5-설정보안운영-원칙)
6. [프론트엔드 디렉토리 구조](#6-프론트엔드-디렉토리-구조)
7. [백엔드 디렉토리 구조](#7-백엔드-디렉토리-구조)

---

## 1. 최상위 원칙

### 1.1 단순성 우선 (Simplicity First)

1인 개발 · MVP 환경에서는 **지금 당장 필요한 것만 만든다.** 추후 확장을 고려하되, 실제 필요가 생기기 전에는 구조를 복잡하게 만들지 않는다.

- 추상화 레이어는 실제 중복이 2회 이상 발생했을 때 도입한다.
- 폴더·파일을 나누는 기준은 "역할이 명확히 다른가"이다. 애매하면 하나의 파일에 유지한다.
- 3rd-party 라이브러리 도입 전, 내장 API나 단순 구현으로 해결 가능한지 먼저 검토한다.

### 1.2 일관성 (Consistency)

코드베이스 전체에서 같은 패턴을 사용한다. 팀 규칙이 개인 선호보다 우선한다.

- 한 번 정한 네이밍·폴더 구조를 프로젝트 전 기간 동안 유지한다.
- 기존 코드에서 이미 사용된 패턴을 새 코드에서도 따른다.
- 패턴을 변경할 때는 기존 코드 전체를 함께 수정한다 (부분 적용 금지).

### 1.3 예측 가능성 (Predictability)

파일명, 폴더 위치, 함수 시그니처를 보면 동작을 예측할 수 있어야 한다.

- 함수는 단 하나의 책임을 가진다 (Single Responsibility).
- 사이드 이펙트(네트워크 호출, 상태 변경)가 있는 함수는 이름에 그 의도를 드러낸다.
- 같은 기능이 두 곳에 존재하지 않도록 한다 (DRY).

### 1.4 MVP 실용 원칙

PRD 10절의 개발 제약(1인 개발, 3일 MVP)을 항상 염두에 둔다.

- 기능 구현 우선순위: F-01(인증) → F-02(그룹) → F-03(지출) → F-05(정산) → F-06(알림) → F-07(리포트)
- 2차 개발 예정 기능(소셜 로그인, 파일 첨부, 다국어)을 위한 복잡한 사전 구조는 만들지 않는다.
- Supabase 무료 플랜 제약을 고려하여 불필요한 DB 호출을 줄인다.

---

## 2. 의존성/레이어 원칙

### 2.1 프론트엔드 레이어 구조

```
UI (Components/Pages)
    ↓
Hook / Store (상태 관리, 비즈니스 로직)
    ↓
Service (API 호출, 외부 통신)
    ↓
[HTTP Client — axios instance]
```

- **UI 레이어**: 화면 렌더링과 사용자 이벤트 수신만 담당한다. API 호출·상태 관리 로직을 직접 포함하지 않는다.
- **Hook/Store 레이어**: `use` 접두사 커스텀 훅 또는 Zustand 스토어. 서버 상태는 React Query(TanStack Query)로 관리한다.
- **Service 레이어**: axios 인스턴스를 사용한 API 호출 함수만 포함한다. UI 상태나 라우팅 로직을 포함하지 않는다.

레이어 규칙:
- 상위 레이어는 하위 레이어를 호출할 수 있으나, 하위 레이어는 상위 레이어를 참조하지 않는다.
- `Component → Service` 직접 호출 금지. 반드시 Hook을 경유한다.

```
✅ 올바른 의존 방향
ExpenseList (Component)
  → useExpenses (Hook) [React Query]
    → expenseService.getExpenses() (Service)
      → apiClient.get('/expenses') (axios)

❌ 잘못된 의존 방향
ExpenseList (Component)
  → apiClient.get('/expenses')  // Service 레이어를 건너뜀
```

### 2.2 백엔드 레이어 구조

```
Router (라우팅, 미들웨어 적용)
    ↓
Controller (요청 파싱, 응답 포맷)
    ↓
Service (비즈니스 로직, 도메인 규칙 검증)
    ↓
Repository (DB 쿼리, Supabase 클라이언트 접근)
    ↓
[Supabase PostgreSQL]
```

- **Router**: 엔드포인트 정의와 미들웨어(인증, 유효성 검사) 연결만 담당한다.
- **Controller**: `req`에서 데이터를 추출하고 Service를 호출한 뒤 `res`로 결과를 반환한다. 비즈니스 로직을 포함하지 않는다.
- **Service**: 도메인 규칙(예: 기간 한정 그룹 종료일 이후 지출 불가, 마지막 관리자 탈퇴 차단)을 검증하고 처리한다.
- **Repository**: Supabase 클라이언트(`supabaseAdmin`)는 **반드시 Repository 레이어에서만 접근**한다. Controller나 Service에서 직접 호출하지 않는다.

```
✅ Supabase 클라이언트 접근 위치
// src/repositories/expenseRepository.ts
import { supabaseAdmin } from '../lib/supabase';

export const findExpensesByGroup = async (groupId: string) => {
  return supabaseAdmin
    .from('expenses')
    .select('*')
    .eq('group_id', groupId);
};

❌ 잘못된 접근 위치
// src/services/expenseService.ts
import { supabaseAdmin } from '../lib/supabase'; // Service에서 직접 접근 금지
```

### 2.3 순환 참조 금지

- FE: `hooks` ↔ `services` 간 순환 참조 금지. `services`는 `hooks`를 import하지 않는다.
- BE: `services` ↔ `repositories` 간 순환 참조 금지. `repositories`는 `services`를 import하지 않는다.
- 공통 유틸(날짜 포맷, 금액 계산 등)은 `utils/` 에 두고 어느 레이어에서도 import 가능하게 한다.

---

## 3. 코드/네이밍 원칙

### 3.1 케이스 컨벤션 사용 위치

| 케이스 | 사용 위치 | 예시 |
|-------|---------|------|
| `PascalCase` | React 컴포넌트, TypeScript 타입/인터페이스/enum | `ExpenseCard`, `GroupType`, `UserRole` |
| `camelCase` | 변수, 함수, 훅, 객체 키(JS/TS), 파일명(훅/서비스/유틸) | `useExpenses`, `calculateShare`, `groupId` |
| `kebab-case` | 컴포넌트 파일명, 페이지 파일명, CSS 클래스 | `expense-card.tsx`, `group-detail.tsx` |
| `SCREAMING_SNAKE_CASE` | 상수, 환경변수 이름 | `MAX_RETRY_COUNT`, `JWT_ACCESS_EXPIRES_IN` |
| `snake_case` | DB 테이블명, 컬럼명 | `group_members`, `created_at`, `is_confirmed` |

```
✅ 올바른 파일 네이밍
components/expense/ExpenseCard.tsx        (PascalCase — 컴포넌트)
hooks/useExpenses.ts                      (camelCase — 훅)
services/expenseService.ts                (camelCase — 서비스)
pages/group-detail.tsx                    (kebab-case — 페이지)
constants/settlementStatus.ts             (camelCase — 상수 파일)

❌ 잘못된 파일 네이밍
components/expense/expense_card.tsx       (snake_case 금지)
hooks/UseExpenses.ts                      (PascalCase 훅 파일 금지)
services/ExpenseService.ts                (PascalCase 서비스 파일 금지)
```

### 3.2 함수 네이밍 원칙

- **CRUD 동사** 규칙을 일관되게 사용한다.

| 동작 | FE (Service/Hook) | BE (Controller/Service/Repository) |
|-----|-------------------|-------------------------------------|
| 조회(목록) | `getExpenses` | `getExpenses` / `findExpensesByGroup` |
| 조회(단건) | `getExpense` | `getExpenseById` / `findExpenseById` |
| 생성 | `createExpense` | `createExpense` / `insertExpense` |
| 수정 | `updateExpense` | `updateExpense` / `updateExpenseById` |
| 삭제 | `deleteExpense` | `deleteExpense` / `deleteExpenseById` |
| 정산 실행 | `runSettlement` | `runSettlement` |

```
✅ 올바른 함수명
async function calculateShareAmount(amount: number, participantCount: number): number
async function findGroupById(groupId: string): Promise<Group | null>
async function archiveExpiredGroups(): Promise<void>

❌ 잘못된 함수명
async function calc(a: number, b: number)   // 의미 불명확
async function doGroup(id: string)           // 동작 불명확
async function groupData()                   // 동사 없음
```

### 3.3 React 컴포넌트 구조 규칙

컴포넌트 내부 구성은 아래 순서를 따른다.

```tsx
// 1. import (외부 라이브러리 → 내부 모듈 순)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseItem } from './ExpenseItem';

// 2. 타입 정의 (해당 파일에서만 쓰이는 Props)
interface ExpenseListProps {
  groupId: string;
}

// 3. 컴포넌트 함수 (named export 권장)
export function ExpenseList({ groupId }: ExpenseListProps) {
  // 3-1. 훅 호출
  const { expenses, isLoading } = useExpenses(groupId);
  const navigate = useNavigate();

  // 3-2. 이벤트 핸들러
  const handleExpenseClick = (expenseId: string) => {
    navigate(`/expenses/${expenseId}`);
  };

  // 3-3. 조기 반환 (로딩, 에러 상태)
  if (isLoading) return <LoadingSpinner />;

  // 3-4. 렌더링
  return (
    <ul>
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onClick={handleExpenseClick}
        />
      ))}
    </ul>
  );
}
```

규칙:
- 컴포넌트 하나당 파일 하나. 파일 크기가 200줄을 초과하면 분리를 검토한다.
- `default export`보다 `named export`를 사용한다 (IDE 자동완성 및 리팩토링 용이).
- 인라인 스타일(`style={{}}`)은 사용하지 않는다. Tailwind CSS 클래스 또는 CSS Module을 사용한다.

### 3.4 API 엔드포인트 네이밍 규칙 (RESTful)

도메인 자원을 복수 명사로 표현하고, 동작은 HTTP 메서드로 구분한다.

| 메서드 | 패턴 | 설명 |
|-------|------|------|
| `GET` | `/api/groups` | 그룹 목록 조회 |
| `POST` | `/api/groups` | 그룹 생성 |
| `GET` | `/api/groups/:groupId` | 그룹 단건 조회 |
| `PATCH` | `/api/groups/:groupId` | 그룹 수정 (부분 업데이트) |
| `GET` | `/api/groups/:groupId/expenses` | 그룹 내 지출 목록 조회 |
| `POST` | `/api/groups/:groupId/expenses` | 지출 등록 |
| `GET` | `/api/groups/:groupId/expenses/:expenseId` | 지출 단건 조회 |
| `PATCH` | `/api/groups/:groupId/expenses/:expenseId` | 지출 수정 |
| `DELETE` | `/api/groups/:groupId/expenses/:expenseId` | 지출 삭제 |
| `POST` | `/api/groups/:groupId/settlements` | 정산 실행 |
| `GET` | `/api/groups/:groupId/settlements` | 정산 히스토리 조회 |
| `PATCH` | `/api/settlements/:settlementItemId/confirm` | 정산 완료 체크 |
| `POST` | `/api/auth/register` | 회원가입 |
| `POST` | `/api/auth/login` | 로그인 |
| `POST` | `/api/auth/refresh` | 토큰 갱신 |
| `POST` | `/api/auth/logout` | 로그아웃 |

```
✅ 올바른 엔드포인트
POST   /api/groups/:groupId/invitations
PATCH  /api/groups/:groupId/members/:memberId/role
GET    /api/groups/:groupId/reports/category-summary

❌ 잘못된 엔드포인트
POST   /api/createGroup                    // 동사 포함 금지
GET    /api/getGroupExpenseList/:id        // 동사 포함, 단복수 혼용
POST   /api/groups/:groupId/doSettlement   // 동사 포함 금지
```

### 3.5 DB 컬럼·테이블 네이밍 (snake_case)

도메인 정의서(1-domain-definition.md) 섹션 5의 도메인 모델을 기준으로 한다.

```
✅ 올바른 DB 네이밍
테이블: users, groups, group_members, group_invitations
       categories, expenses, expense_participants, expense_attachments
       settlements, settlement_items, notifications

컬럼:  group_id, user_id, created_by, expense_date
       is_active, is_confirmed, is_read
       period_start, period_end, expires_at, created_at, updated_at

ENUM 값: ACTIVE, ARCHIVED, PENDING, ACCEPTED, REJECTED, EXPIRED
         ADMIN, MEMBER, LIMITED, ONGOING, AUTO, MANUAL

❌ 잘못된 DB 네이밍
테이블: groupMembers (camelCase), GroupMember (PascalCase)
컬럼:  groupId, createdBy, isActive
```

### 3.6 상수·환경변수·타입 정의 위치

**FE:**
```
src/
├── constants/          # 앱 전체 공통 상수 (GROUP_TYPE, SETTLEMENT_STATUS 등)
├── types/              # 전역 TypeScript 타입·인터페이스
│   ├── domain.ts       # 도메인 엔티티 타입 (Group, Expense, Settlement 등)
│   └── api.ts          # API 요청·응답 타입
└── .env / .env.local   # 환경변수 (VITE_ 접두사 필수)
```

**BE:**
```
src/
├── constants/          # 공통 상수 (HTTP_STATUS, ERROR_CODE 등)
├── types/              # 전역 TypeScript 타입
│   ├── domain.ts       # 도메인 엔티티 타입
│   └── express.d.ts    # req.user 등 Express 타입 확장
└── .env                # 환경변수 (NODE_ENV, DB_URL, JWT_SECRET 등)
```

---

## 4. 테스트/품질 원칙

### 4.1 MVP 단계 테스트 전략

1인 개발 · 3일 MVP 제약 하에서는 **핵심 비즈니스 로직의 단위 테스트**에 집중한다. UI 테스트나 E2E 테스트는 MVP 이후 점진적으로 추가한다.

| 테스트 종류 | MVP 단계 방침 | 대상 |
|-----------|------------|------|
| 단위 테스트 | **필수** 작성 | 정산 알고리즘, 분담액 계산, 도메인 유효성 검사 |
| API 통합 테스트 | **선택적** 작성 (핵심 API만) | 인증, 정산 실행, 지출 CRUD |
| 컴포넌트 테스트 | MVP 이후 추가 | — |
| E2E 테스트 | MVP 이후 추가 | — |

### 4.2 단위 테스트 대상 (필수)

아래 로직은 버그 발생 시 금전 손해 또는 데이터 불일치로 이어지므로 반드시 단위 테스트를 작성한다.

**정산 알고리즘 (PRD F-05-9)**
```typescript
// BE: src/services/__tests__/settlementService.test.ts

describe('calculateSettlement', () => {
  it('3명 그리디 정산: 최소 거래 수로 이체 목록 생성', () => {
    // A: +10,000 (채권), B: -3,000, C: -7,000 (채무)
    // 결과: B→A 3,000 / C→A 7,000 (2건)
  });

  it('채권채무 상쇄 후 순 금액이 0인 경우 이체 목록이 비어 있다', () => {});

  it('전월 지출이 없으면 SettlementItem이 생성되지 않는다', () => {});
});
```

**분담액 계산 (도메인 정의서 3.4절)**
```typescript
// BE: src/utils/__tests__/shareCalculator.test.ts

describe('calculateShareAmount', () => {
  it('10,000원 ÷ 3명 → 3,333원(일반) + 3,334원(결제자)', () => {});
  it('나눠 떨어지는 경우 오차 없이 균등 분배된다', () => {});
  it('분담액의 합계가 항상 지출 총액과 일치한다', () => {});
});
```

**도메인 유효성 검사**
```typescript
// 기간 한정 그룹 종료일 이후 지출 불가 검증
// 마지막 관리자 탈퇴 차단 검증
// 동일 기간 정산 중복 실행 차단 검증
```

### 4.3 API 통합 테스트 기준 (선택적)

supertest를 사용하여 아래 API에 대한 통합 테스트를 작성한다.

- `POST /api/auth/login` — 정상 로그인, 잘못된 자격증명
- `POST /api/groups/:groupId/settlements` — 정산 실행 성공, 중복 실행 차단
- `POST /api/groups/:groupId/expenses` — 지출 등록 성공, 권한 없는 사용자 차단

테스트는 실제 Supabase DB 대신 테스트용 DB 또는 모킹을 사용한다.

### 4.4 TypeScript 설정

```json
// tsconfig.json (FE, BE 공통)
{
  "compilerOptions": {
    "strict": true,          // strict 모드 활성화 (필수)
    "noImplicitAny": true,   // any 암묵적 사용 금지
    "strictNullChecks": true // null/undefined 명시적 처리 강제
  }
}
```

- `any` 타입은 사용을 최대한 지양하며, 불가피한 경우 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 주석과 이유를 명시한다.
- 외부 라이브러리의 타입이 없는 경우 `@types/` 패키지를 먼저 찾고, 없으면 `declare module`로 최소 선언한다.

### 4.5 ESLint/Prettier 설정 방향

**ESLint 핵심 규칙:**
```javascript
// .eslintrc.js
{
  "rules": {
    "no-console": "warn",           // console.log는 경고 (디버그용 로그 잔류 방지)
    "no-unused-vars": "error",      // 미사용 변수 에러
    "@typescript-eslint/no-explicit-any": "warn",
    "import/no-circular-deps": "error"  // 순환 참조 에러
  }
}
```

**Prettier 핵심 설정:**
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- `pre-commit` 훅(husky + lint-staged)으로 커밋 전 자동 lint 검사를 실행한다.
- `console.log` 잔류 경고를 빌드 전 확인한다. 프로덕션 빌드에서 `console.log`가 남지 않도록 한다.

---

## 5. 설정/보안/운영 원칙

### 5.1 환경변수 관리

**FE 환경변수 파일 분리:**
```
frontend/
├── .env.development      # 개발 환경 (로컬)
├── .env.production       # 프로덕션 환경
└── .env.example          # 팀 공유용 샘플 (커밋 O, 실제 값 없음)
```

**BE 환경변수 파일 분리:**
```
backend/
├── .env                  # 현재 실행 환경 (gitignore 필수)
├── .env.development      # 개발 환경 기본값
├── .env.production       # 프로덕션 환경 기본값
└── .env.example          # 팀 공유용 샘플 (커밋 O, 실제 값 없음)
```

**절대 커밋 금지 항목 (`/.gitignore` 필수 포함):**
```
.env
.env.local
.env.production
.env.development.local
```

**절대 커밋 금지 변수 목록:**
- `SUPABASE_SERVICE_ROLE_KEY` — DB 전체 접근 가능한 슈퍼키
- `JWT_SECRET` — 토큰 서명 키
- `SUPABASE_URL` — DB URL (공개 시 DDoS 표적 가능)
- 비밀번호, API 키, 인증서 경로 일체

```
✅ .env.example (커밋 허용)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-jwt-secret-here
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d
CORS_ALLOWED_ORIGINS=http://localhost:5173

❌ .env (커밋 절대 금지)
SUPABASE_URL=https://xyzabc123.supabase.co
JWT_SECRET=super-secret-key-1234
```

### 5.2 CORS 설정 원칙 (PRD 5.3절 반영)

- 허용 오리진은 반드시 **환경변수**(`CORS_ALLOWED_ORIGINS`)로 관리한다.
- 프로덕션 환경에서 와일드카드(`*`) 사용을 금지한다.
- 개발 환경에서는 `http://localhost:5173`만 허용한다.

```typescript
// BE: src/app.ts
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? [];

app.use(cors({
  origin: (origin, callback) => {
    // 개발 환경에서 origin 없는 요청(Postman 등) 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단된 요청입니다.'));
    }
  },
  credentials: true,  // HttpOnly 쿠키 전송 허용
}));

✅ 프로덕션 환경변수
CORS_ALLOWED_ORIGINS=https://budget-book.vercel.app

❌ 절대 금지
app.use(cors({ origin: '*' }));   // 프로덕션에서 와일드카드 금지
```

### 5.3 JWT 토큰 저장 위치 및 갱신 전략 (PRD F-01-4, 5.3절 반영)

| 토큰 | 저장 위치 | 만료 |
|------|---------|-----|
| Access Token | 메모리 (JS 변수 또는 React 상태) | 1시간 |
| Refresh Token | `HttpOnly` 쿠키 | 30일 |

**선택 이유:**
- Access Token을 `localStorage`에 저장하면 XSS 공격으로 탈취 가능하므로 메모리에 보관한다.
- Refresh Token은 `HttpOnly` 쿠키에 저장하여 JS로 접근 불가하게 한다.

**자동 갱신 전략 (SC-03 반영):**
```typescript
// FE: src/lib/apiClient.ts
// axios 응답 인터셉터에서 401 감지 시 자동 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { accessToken } = await authService.refreshToken();
        setAccessToken(accessToken);  // 메모리 상태 업데이트
        error.config.headers['Authorization'] = `Bearer ${accessToken}`;
        return apiClient(error.config);
      } catch {
        // Refresh Token도 만료 → 강제 로그아웃
        authStore.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 5.4 Supabase Row Level Security (RLS) 적용 방향

- 모든 테이블에 RLS를 활성화한다. RLS 비활성화 상태로 배포하지 않는다.
- **BE에서 `supabaseAdmin` (service role key)을 사용하는 경우**: BE가 자체 인가 로직(JWT 검증 + 그룹 멤버십 확인)을 수행하므로 RLS를 우회할 수 있다. 단, 이 경우 BE의 인가 로직이 RLS 역할을 완전히 대체해야 한다.
- **FE에서 직접 Supabase를 호출하는 경우** (MVP 범위 밖): anon key + RLS 정책으로 접근 제어한다.

핵심 RLS 정책 방향 (BE 우회 시 참조용):
```sql
-- 그룹 데이터는 해당 그룹의 활성 멤버만 조회 가능
-- expenses: group_id → group_members의 user_id = auth.uid() AND is_active = true
-- settlement_items: from_member만 is_confirmed 업데이트 가능
```

### 5.5 비밀번호 해시 (PRD 5.3절 반영)

```typescript
// BE: src/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // PRD 요구사항: salt rounds ≥ 12

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

✅ 올바른 사용
const hashedPassword = await hashPassword(plainPassword);

❌ 절대 금지
users.password = plainPassword;           // 평문 저장 금지
const hash = bcrypt.hashSync(pw, 10);     // SALT_ROUNDS < 12 금지
```

### 5.6 Git 브랜치 전략 (1인 개발)

1인 개발 환경에서는 단순한 **GitHub Flow** 를 채택한다.

```
main          ← 항상 배포 가능한 상태 유지
 └── feat/auth-login
 └── feat/expense-crud
 └── fix/settlement-rounding-bug
 └── chore/setup-eslint
```

규칙:
- `main` 브랜치에 직접 push하지 않는다. 모든 변경은 feature 브랜치에서 작업 후 PR/MR을 통해 병합한다.
- 브랜치명: `feat/기능명`, `fix/버그명`, `chore/작업명` (kebab-case)
- 커밋 메시지 형식: `type: 간결한 설명` (영어 또는 한국어 일관 유지)
  - `feat: 지출 등록 API 구현`
  - `fix: 정산 분담액 반올림 오차 수정`
  - `chore: ESLint 설정 추가`
- 배포 전 `main` 브랜치에서 반드시 테스트를 확인한다.

---

## 6. 프론트엔드 디렉토리 구조

React + TypeScript 기준으로 **feature-based(기능 도메인 기반)** 구조를 채택한다.

**채택 이유:** 공동 가계부 서비스는 인증, 그룹, 지출, 정산, 알림, 리포트라는 명확한 도메인이 존재한다. 기능별로 컴포넌트·훅·서비스를 함께 묶으면 관련 코드를 한 폴더에서 찾을 수 있어 1인 개발 시 탐색 비용이 줄어든다. 앱 전체에서 재사용되는 공통 요소는 `shared/`에 분리한다.

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                    # React 앱 진입점
│   ├── App.tsx                     # 라우터 설정, 전역 레이아웃
│   │
│   ├── features/                   # 도메인 기능 단위 모듈
│   │   ├── auth/                   # 인증 (F-01)
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── PasswordResetForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts      # 로그인·로그아웃·토큰 갱신
│   │   │   ├── services/
│   │   │   │   └── authService.ts  # API 호출 함수
│   │   │   └── types.ts            # auth 도메인 타입
│   │   │
│   │   ├── groups/                 # 그룹 관리 (F-02)
│   │   │   ├── components/
│   │   │   │   ├── GroupCard.tsx
│   │   │   │   ├── GroupCreateForm.tsx
│   │   │   │   └── MemberList.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useGroups.ts
│   │   │   │   └── useGroupMembers.ts
│   │   │   ├── services/
│   │   │   │   └── groupService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── expenses/               # 지출 관리 (F-03)
│   │   │   ├── components/
│   │   │   │   ├── ExpenseList.tsx
│   │   │   │   ├── ExpenseCard.tsx
│   │   │   │   └── ExpenseForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useExpenses.ts
│   │   │   ├── services/
│   │   │   │   └── expenseService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── categories/             # 카테고리 관리 (F-04)
│   │   │   ├── components/
│   │   │   │   └── CategorySelector.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCategories.ts
│   │   │   ├── services/
│   │   │   │   └── categoryService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── settlements/            # 정산 (F-05)
│   │   │   ├── components/
│   │   │   │   ├── SettlementRunner.tsx
│   │   │   │   ├── SettlementResult.tsx
│   │   │   │   └── SettlementHistory.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSettlements.ts
│   │   │   ├── services/
│   │   │   │   └── settlementService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── notifications/          # 인앱 알림 (F-06)
│   │   │   ├── components/
│   │   │   │   ├── NotificationList.tsx
│   │   │   │   └── InvitationNotice.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useNotifications.ts
│   │   │   ├── services/
│   │   │   │   └── notificationService.ts
│   │   │   └── types.ts
│   │   │
│   │   └── reports/                # 리포트 (F-07)
│   │       ├── components/
│   │       │   ├── CategoryPieChart.tsx
│   │       │   └── ExportButton.tsx
│   │       ├── hooks/
│   │       │   └── useReport.ts
│   │       ├── services/
│   │       │   └── reportService.ts
│   │       └── types.ts
│   │
│   ├── pages/                      # 라우터에서 직접 참조하는 페이지 컴포넌트
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── home.tsx                # 그룹 목록
│   │   ├── group-detail.tsx        # 지출 목록
│   │   ├── expense-form.tsx        # 지출 등록/수정
│   │   ├── settlement.tsx          # 정산 실행/결과
│   │   ├── settlement-history.tsx
│   │   ├── report.tsx              # 파이 차트
│   │   ├── notifications.tsx       # 메시지함
│   │   └── my-page.tsx
│   │
│   ├── shared/                     # 전체 앱 공통 재사용 모듈
│   │   ├── components/             # 공통 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── hooks/                  # 공통 훅
│   │   │   └── useConfirmDialog.ts
│   │   └── layout/
│   │       ├── AppLayout.tsx       # 공통 레이아웃 (사이드바 / 탭바)
│   │       └── ProtectedRoute.tsx  # 인증 가드
│   │
│   ├── lib/                        # 외부 라이브러리 설정·래퍼
│   │   ├── apiClient.ts            # axios 인스턴스 + 인터셉터 설정
│   │   └── queryClient.ts          # React Query 클라이언트 설정
│   │
│   ├── store/                      # 전역 클라이언트 상태 (Zustand)
│   │   └── authStore.ts            # Access Token, 로그인 상태
│   │
│   ├── constants/                  # 앱 전체 공통 상수
│   │   ├── groupStatus.ts          # ACTIVE, ARCHIVED
│   │   ├── settlementStatus.ts     # AUTO, MANUAL
│   │   └── notificationType.ts     # INVITATION, SETTLEMENT 등
│   │
│   ├── types/                      # 전역 TypeScript 타입
│   │   ├── domain.ts               # 도메인 엔티티 인터페이스
│   │   └── api.ts                  # API 응답 공통 타입
│   │
│   └── utils/                      # 순수 유틸 함수
│       ├── formatDate.ts           # 날짜 포맷 (KST 기준)
│       ├── formatCurrency.ts       # 원화 포맷 (1,000원)
│       └── calculateShare.ts       # 분담액 계산 (FE 미리보기용)
│
├── .env.example
├── .env.development
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**주요 폴더 역할 요약:**

| 폴더 | 역할 |
|------|------|
| `features/` | 도메인 기능별 컴포넌트·훅·서비스를 함께 관리. 기능 추가·삭제 시 해당 폴더만 변경 |
| `pages/` | React Router에서 참조하는 페이지 단위 컴포넌트. 레이아웃 조립 역할 |
| `shared/` | 두 개 이상의 feature에서 사용하는 공통 컴포넌트·훅 |
| `lib/` | axios, React Query 등 외부 라이브러리 초기화 설정 |
| `store/` | 페이지 이동을 넘어 유지되는 전역 상태 (Access Token 등) |
| `constants/` | 문자열 리터럴 대신 사용하는 타입 안전 상수 |
| `types/` | 여러 feature에서 공유하는 도메인 타입 |
| `utils/` | 라이브러리 의존 없는 순수 함수 |

---

## 7. 백엔드 디렉토리 구조

Node.js + Express 기준으로 **레이어 기반** 구조를 채택한다. Router → Controller → Service → Repository의 계층 분리를 파일 구조에 그대로 반영한다.

```
backend/
├── src/
│   ├── index.ts                    # 서버 진입점 (포트 리슨)
│   ├── app.ts                      # Express 앱 설정 (미들웨어, 라우터 마운트)
│   │
│   ├── routes/                     # Router 레이어: 엔드포인트 정의 + 미들웨어 연결
│   │   ├── index.ts                # /api 라우터 통합 진입점
│   │   ├── authRoutes.ts           # /api/auth
│   │   ├── groupRoutes.ts          # /api/groups
│   │   ├── expenseRoutes.ts        # /api/groups/:groupId/expenses
│   │   ├── categoryRoutes.ts       # /api/groups/:groupId/categories
│   │   ├── settlementRoutes.ts     # /api/groups/:groupId/settlements
│   │   ├── notificationRoutes.ts   # /api/notifications
│   │   └── reportRoutes.ts         # /api/groups/:groupId/reports
│   │
│   ├── controllers/                # Controller 레이어: req 파싱 → Service 호출 → res 반환
│   │   ├── authController.ts
│   │   ├── groupController.ts
│   │   ├── expenseController.ts
│   │   ├── categoryController.ts
│   │   ├── settlementController.ts
│   │   ├── notificationController.ts
│   │   └── reportController.ts
│   │
│   ├── services/                   # Service 레이어: 비즈니스 로직 + 도메인 규칙 검증
│   │   ├── authService.ts          # 회원가입, 로그인, 토큰 갱신
│   │   ├── groupService.ts         # 그룹 CRUD, 멤버 관리, 초대 처리
│   │   ├── expenseService.ts       # 지출 CRUD, 분담액 계산
│   │   ├── categoryService.ts      # 카테고리 관리
│   │   ├── settlementService.ts    # 정산 실행, 그리디 알고리즘
│   │   ├── notificationService.ts  # 알림 생성·조회
│   │   └── reportService.ts        # 카테고리 집계, xlsx 생성
│   │
│   ├── repositories/               # Repository 레이어: DB 쿼리 (Supabase 접근 유일 위치)
│   │   ├── userRepository.ts
│   │   ├── groupRepository.ts
│   │   ├── groupMemberRepository.ts
│   │   ├── invitationRepository.ts
│   │   ├── expenseRepository.ts
│   │   ├── categoryRepository.ts
│   │   ├── settlementRepository.ts
│   │   ├── notificationRepository.ts
│   │   └── reportRepository.ts
│   │
│   ├── middlewares/                # Express 미들웨어
│   │   ├── authenticate.ts         # JWT 검증 (Bearer 토큰 파싱 + 유효성 확인)
│   │   ├── authorize.ts            # 그룹 멤버십·역할 확인 (ADMIN/MEMBER)
│   │   ├── validate.ts             # 요청 바디 유효성 검사 (zod)
│   │   └── errorHandler.ts         # 전역 에러 핸들러
│   │
│   ├── lib/                        # 라이브러리 설정
│   │   └── supabase.ts             # supabaseAdmin 클라이언트 초기화 (단일 인스턴스)
│   │
│   ├── jobs/                       # 스케줄 배치 작업
│   │   ├── archiveGroups.ts        # 매일 자정 기간 한정 그룹 자동 ARCHIVED 처리
│   │   └── expireInvitations.ts    # 매일 만료 초대 처리 (PENDING → EXPIRED)
│   │
│   ├── constants/                  # 공통 상수
│   │   ├── httpStatus.ts           # HTTP 상태 코드
│   │   └── errorCode.ts            # 앱 에러 코드 (AUTH_001, GROUP_001 등)
│   │
│   ├── types/                      # TypeScript 타입 정의
│   │   ├── domain.ts               # 도메인 엔티티 타입 (DB 로우 타입)
│   │   ├── request.ts              # Controller req body 타입
│   │   └── express.d.ts            # req.user 등 Express 네임스페이스 확장
│   │
│   └── utils/                      # 순수 유틸 함수
│       ├── shareCalculator.ts      # 분담액 계산 (round 및 오차 귀속)
│       ├── settlementAlgorithm.ts  # 그리디 최소 거래 정산 알고리즘
│       ├── jwtHelper.ts            # 토큰 생성·검증 래퍼
│       └── dateHelper.ts           # KST 변환, 월 범위 계산
│
├── __tests__/                      # 테스트 파일
│   ├── unit/
│   │   ├── shareCalculator.test.ts
│   │   └── settlementAlgorithm.test.ts
│   └── integration/
│       ├── auth.test.ts
│       └── settlement.test.ts
│
├── .env.example
├── .env
├── tsconfig.json
├── jest.config.ts
└── package.json
```

**주요 폴더 역할 요약:**

| 폴더 | 역할 |
|------|------|
| `routes/` | URL 매핑, 미들웨어 연결. 비즈니스 로직 없음 |
| `controllers/` | `req` → `Service` → `res` 변환. 도메인 로직 없음 |
| `services/` | 도메인 규칙 검증 및 처리. DB 직접 접근 없음 |
| `repositories/` | Supabase 쿼리 전용. `supabaseAdmin` 접근 유일 위치 |
| `middlewares/` | 인증·인가·유효성 검사·에러 처리 미들웨어 |
| `lib/` | 외부 클라이언트 초기화 (Supabase 단일 인스턴스) |
| `jobs/` | node-cron 배치 작업 (그룹 자동 아카이브, 초대 만료 처리) |
| `utils/` | 정산 알고리즘, 분담액 계산 등 순수 함수 (단위 테스트 대상) |
| `types/` | Express 타입 확장, 도메인 엔티티 타입 |

**레이어별 책임 요약 예시 — 지출 등록 흐름:**

```
POST /api/groups/:groupId/expenses
  ↓
[authenticate] JWT 검증, req.user 설정
[authorize]    그룹 멤버 여부 확인
  ↓
ExpenseController.create(req, res)
  → req.body, req.params 파싱
  → expenseService.createExpense(groupId, userId, dto) 호출
  ↓
ExpenseService.createExpense()
  → 기간 한정 그룹 종료일 이후 날짜 검증
  → 참여자 1인 이상 검증
  → 분담액 계산 (shareCalculator.ts)
  → expenseRepository.insert(expense) 호출
  ↓
ExpenseRepository.insert()
  → supabaseAdmin.from('expenses').insert(...) 실행
  → supabaseAdmin.from('expense_participants').insert(...) 실행
  ↓
Controller → res.status(201).json(createdExpense) 반환
```
