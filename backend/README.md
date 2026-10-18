# 공동 가계부 — 백엔드

공동 가계부 서비스의 Node.js + Express REST API 서버입니다.  
PostgreSQL(Supabase)에 연결하며 JWT 기반 인증을 제공합니다.

---

## 기술 스택

| 항목 | 버전 / 라이브러리 |
|------|-----------------|
| 언어 | TypeScript 5.3 |
| 런타임 | Node.js 20 |
| 프레임워크 | Express 4 |
| DB 드라이버 | postgres.js 3 (연결 풀 max 10) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | jsonwebtoken (Access 1h / Refresh 30d) |
| 비밀번호 해싱 | bcrypt (cost ≥ 12) |
| 입력 검증 | zod 4 |
| 엑셀 생성 | ExcelJS |
| API 문서 | swagger-ui-express (OpenAPI 3.0) |
| 테스트 | Jest + Supertest |

---

## 디렉토리 구조

```
src/
├── config/       # 환경변수 로딩·검증 (env.ts), CORS 설정
├── constants/    # 에러 코드·HTTP 상태 코드 (errorCodes.ts), 역할·초대 상태 (roles.ts), 지출 상수 (expense.ts)
├── controllers/  # HTTP 요청 파싱, 응답 직렬화
├── jobs/         # 초대 만료 처리 잡 (invitationExpiry.job.ts, 30분 주기 setInterval)
├── lib/          # DB 연결 풀 (db.ts), JWT 유틸 (jwt.ts), bcrypt 유틸 (crypto.ts)
├── middlewares/  # 인증, 역할 검증, 입력 검증, 에러 핸들러
├── repositories/ # SQL 쿼리 작성, DB row → 도메인 모델 변환
├── routes/       # Express 라우터 (URL → 컨트롤러 연결)
├── services/     # 비즈니스 규칙
├── types/        # TypeScript 타입 정의 (domain.ts, api.ts)
├── utils/        # 순수 유틸 함수 (dateUtils, splitCalculator)
├── validators/   # zod 스키마 (요청 바디 검증)
├── app.ts        # Express 앱 조립 (미들웨어 등록 순서)
└── server.ts     # HTTP 서버 진입점
```

---

## 로컬 개발 환경 설정

### 1. 환경 변수

`.env.example`을 복사하여 `.env`를 생성합니다.

```bash
cp .env.example .env
```

| 변수 | 설명 | 필수 |
|------|------|:----:|
| `DATABASE_URL` | Supabase Transaction Pooler PostgreSQL 연결 문자열 | ✅ |
| `JWT_ACCESS_SECRET` | Access Token 서명 시크릿 (256비트 이상 권장) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 시크릿 (256비트 이상 권장) | ✅ |
| `JWT_ACCESS_TTL_SECONDS` | Access Token 유효기간(초), 기본 3600 | |
| `JWT_REFRESH_TTL_SECONDS` | Refresh Token 유효기간(초), 기본 2592000 | |
| `BCRYPT_COST` | bcrypt cost factor, 기본 12 | |
| `PORT` | 서버 포트, 기본 3000 | |
| `NODE_ENV` | 실행 환경 (`development` / `production`) | |
| `CORS_ORIGIN` | 허용할 프론트엔드 Origin, 기본 `http://localhost:5173` (`production`에서만 적용, 개발 환경은 `localhost:5173`·`localhost:3001` 고정) | |

시크릿 생성 예시:
```bash
openssl rand -hex 64
```

### 2. 의존성 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

---

## 주요 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | nodemon + ts-node 개발 서버 (파일 변경 시 자동 재시작) |
| `npm run build` | TypeScript 컴파일 → `dist/` |
| `npm start` | 빌드 결과물 실행 (`node dist/server.js`) |
| `npm test` | Jest 단위·통합 테스트 실행 |
| `npm run test:coverage` | 커버리지 리포트 포함 테스트 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 (`tsc --noEmit`) |

---

## API 엔드포인트 목록

서버 실행 후 Swagger UI에서 전체 명세를 확인할 수 있습니다.

```
GET http://localhost:3000/api-docs
```

엔드포인트 그룹 (전체 35개 중 요약, 상세는 Swagger 참고):

| 그룹 | 베이스 경로 |
|------|------------|
| 인증 | `POST /api/v1/auth/signup` · `login` · `refresh` · `logout` · `PATCH /api/v1/auth/password` · `DELETE /api/v1/auth/withdraw` |
| 그룹 | `GET/POST /api/v1/groups` · `GET/PATCH/DELETE /api/v1/groups/:groupId` |
| 멤버 | `GET /api/v1/groups/:groupId/members` · `DELETE .../members/:userId` |
| 초대 | `POST·GET /api/v1/groups/:groupId/invitations` · `GET /api/v1/invitations/my` · `PATCH /api/v1/invitations/:id` |
| 카테고리 | `GET/POST /api/v1/groups/:groupId/categories` · `DELETE .../categories/:categoryId` |
| 지출 | `GET/POST /api/v1/groups/:groupId/expenses` · `GET/PATCH/DELETE .../expenses/:expenseId` |
| 정산 | `GET/POST /api/v1/groups/:groupId/settlements` · `GET .../settlements/:settlementId` · `GET .../settlements/:settlementId/export` |
| 리포트 | `GET .../reports/categories` · `GET .../reports/members` · `GET .../reports/expenses/export` · `GET .../reports/settlements/:settlementId/export` |
| 메시지 | `GET /api/v1/messages` |
| 헬스체크 | `GET /api/v1/health` |

전체 명세: [`../swagger/swagger.json`](../swagger/swagger.json)

---

## 인증 방식

- 로그인 시 **Access Token**(JWT, 1시간)과 **Refresh Token**(JWT, 30일)을 발급합니다. (회원가입은 토큰을 발급하지 않고 사용자 정보만 반환합니다.)
- Access Token은 응답 바디, Refresh Token은 `httpOnly`·`SameSite=Strict` 쿠키(`refresh_token`, `Secure`는 production에서만)로 전달합니다.
- Refresh Token은 갱신 시마다 새로 발급(회전)되며 이전 토큰은 DB에서 삭제됩니다.
- 모든 인증 필요 엔드포인트는 `Authorization: Bearer <accessToken>` 헤더를 요구합니다.
- Refresh Token은 DB(`refresh_tokens` 테이블)에 저장되며 로그아웃·탈퇴 시 즉시 삭제됩니다.

---

## 관련 문서

- [루트 README](../README.md) — 프로젝트 전체 개요 및 문서 목록
- [프론트엔드 README](../frontend/README.md) — 웹 클라이언트 설정
- [Swagger 명세](../swagger/swagger.json) — OpenAPI 3.0 REST API 문서
- [ERD](../docs/6-erd.md) — 데이터베이스 스키마
