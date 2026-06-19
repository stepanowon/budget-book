# 공동 가계부 — 프론트엔드

공동 가계부 서비스의 React 기반 웹 클라이언트입니다.  
모바일 퍼스트 반응형 UI로 구현되며, 백엔드 API(`../backend`)와 통신합니다.

---

## 기술 스택

| 항목 | 버전 / 라이브러리 |
|------|-----------------|
| 언어 | TypeScript ~6.0 |
| 프레임워크 | React 19 |
| 빌드 도구 | Vite 8 |
| 라우팅 | React Router v7 |
| 서버 상태 | TanStack React Query v5 |
| HTTP | Axios |
| 스타일 | Tailwind CSS v3 (모바일 퍼스트, `md:` = 768px+) |
| 차트 | Recharts |
| PDF 내보내기 | html2canvas + jsPDF |
| 아이콘 | lucide-react |
| 테스트 | Vitest + Testing Library |

---

## 디렉토리 구조

```
src/
├── api/          # HTTP 요청 함수 (axios 기반, 도메인별 파일)
├── components/   # UI 컴포넌트
│   ├── common/   # 도메인 비의존 공통 컴포넌트 (Button, Modal 등)
│   ├── expenses/ # 지출 도메인 컴포넌트
│   ├── groups/   # 그룹 도메인 컴포넌트
│   └── charts/   # 파이 차트 컴포넌트
├── constants/    # 전역 상수 (routes, roles 등)
├── contexts/     # React Context (Toast 등)
├── hooks/        # 커스텀 훅 (React Query 래핑)
├── layouts/      # 페이지 레이아웃 (AppLayout, AuthLayout)
├── lib/          # 외부 라이브러리 초기화 (queryClient, tokenStore)
├── pages/        # 라우트 단위 페이지 컴포넌트
├── types/        # TypeScript 타입 정의 (domain.ts, api.ts)
└── utils/        # 순수 유틸 함수 (formatCurrency, dateUtils 등)
```

---

## 로컬 개발 환경 설정

### 1. 환경 변수

`.env.example`을 복사하여 `.env`를 생성합니다.

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL | `http://localhost:3000/api/v1` |

### 2. 의존성 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.  
백엔드 서버(`../backend`)가 먼저 실행되어 있어야 합니다.

---

## 주요 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | Vite 개발 서버 실행 (HMR 포함) |
| `npm run build` | TypeScript 컴파일 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run test` | Vitest 단위 테스트 실행 |
| `npm run test:watch` | Vitest 감시 모드 |

---

## 인증 방식

- Access Token(JWT, 1시간)을 `localStorage`에 저장하고 axios 인터셉터에서 `Authorization: Bearer` 헤더로 자동 주입합니다.
- Refresh Token은 `httpOnly` 쿠키로 관리되며, 401 응답 시 `/auth/refresh`를 자동 호출하여 토큰을 갱신합니다.
- `src/lib/tokenStore.ts`에서 토큰 읽기/쓰기를 중앙 관리합니다.

---

## 주요 화면

| 화면 | 경로 | 설명 |
|------|------|------|
| 로그인 | `/login` | 이메일 + 비밀번호 로그인 |
| 회원가입 | `/signup` | 이메일·비밀번호·username 등록 |
| 그룹 목록 | `/groups` | 내가 소속된 그룹 카드 목록 |
| 그룹 상세 | `/groups/:id` | 지출 목록·카테고리·멤버·정산 탭 |
| 지출 등록/수정 | `/groups/:id/expenses/new` | 균등(N빵)/개별 분담 입력 폼 |
| 정산 | `/groups/:id/settlements` | 정산 실행·내역·엑셀 내보내기 |
| 리포트 | `/reports` | 카테고리·멤버별 파이 차트, PDF/엑셀 내보내기 |
| 초대함 | `/invitations` | 수신 초대 목록, 수락/거절 |
| 메시지 | `/messages` | 정산 완료 인앱 메시지 목록 |
| 계정 설정 | `/settings/withdraw` | 비밀번호 변경, 회원 탈퇴 |

---

## 관련 문서

- [루트 README](../README.md) — 프로젝트 전체 개요 및 문서 목록
- [백엔드 README](../backend/README.md) — API 서버 설정 및 엔드포인트
- [Swagger 명세](../swagger/swagger.json) — OpenAPI 3.0 REST API 문서
