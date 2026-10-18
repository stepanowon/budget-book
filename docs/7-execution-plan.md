# 실행 계획 — 공동 가계부 서비스

> 버전: 1.1  
> 작성일: 2026-06-18  
> 수정일: 2026-10-18  
> 관련 문서: 1-domain-definition.md · 2-prd.md · 4-project-principle.md · 6-erd.md

---

## 목차

1. [개요 및 원칙](#1-개요-및-원칙)
2. [전체 태스크 현황](#2-전체-태스크-현황)
3. [데이터베이스 태스크 (DB)](#3-데이터베이스-태스크-db)
4. [백엔드 태스크 (BE)](#4-백엔드-태스크-be)
5. [프론트엔드 태스크 (FE)](#5-프론트엔드-태스크-fe)
6. [구현 순서 및 의존성 맵](#6-구현-순서-및-의존성-맵)

---

## 1. 개요 및 원칙

### 태스크 ID 체계
- `DB-xx`: 데이터베이스 (Supabase/PostgreSQL)
- `BE-xx`: 백엔드 (Node.js + Express)
- `FE-xx`: 프론트엔드 (React + TypeScript)

### 복잡도 기준
- `S` (Small): 1~2일
- `M` (Medium): 3~5일
- `L` (Large): 1주 이상

### 완료 조건 체크 방법
- 각 태스크의 완료 조건은 체크박스(`- [ ]`)로 관리
- 모든 체크박스가 완료되어야 해당 태스크 완료로 간주

---

## 2. 전체 태스크 현황

| 도메인 | 태스크 수 | S | M | L |
|--------|---------|---|---|---|
| DB | 14개 | 10 | 3 | 1 |
| BE | 30개 | 8 | 18 | 4 |
| FE | 30개 | 13 | 16 | 1 |
| **합계** | **74개** | **31** | **37** | **6** |

---

## 3. 데이터베이스 태스크 (DB)

### DB-01. PostgreSQL ENUM 타입 및 익스텐션 정의
> 복잡도: `S` | 의존성: 없음

pgcrypto 익스텐션과 7개 ENUM 타입을 idempotent하게 생성한다.

**완료 조건**
- [x] pgcrypto 익스텐션이 활성화되어 gen_random_uuid() 호출 가능
- [x] user_status, group_type, group_status, member_role, invitation_status, category_scope, split_type 7개 ENUM 타입 생성 완료
- [x] 중복 실행 시 오류 없이 스킵됨 (DO $$ BEGIN ... EXCEPTION WHEN duplicate_object 패턴)
- [x] 각 ENUM 값이 도메인 정의서 섹션 3의 제약과 일치

**참조 규칙**: BR-02, BR-10, BR-12, BR-13, DR-01

---

### DB-02. users 테이블 생성 및 제약 조건 설정
> 복잡도: `S` | 의존성: DB-01

**완료 조건**
- [x] users 테이블 정상 생성 및 모든 제약 조건 적용
- [x] username 형식 CHECK 제약 (`^[a-z0-9_]{3,20}$`) 동작 확인
- [x] 중복 username/email INSERT 시 UNIQUE 위반 오류 발생 확인

**참조 규칙**: DR-01, BR-12, AC-U1, AC-U2

---

### DB-03. refresh_tokens 테이블 생성 및 제약 조건 설정
> 복잡도: `S` | 의존성: DB-02

자체 JWT 인증에서 Refresh Token을 DB로 관리하기 위한 테이블을 생성한다. 탈퇴·로그아웃 시 해당 레코드를 삭제하여 토큰을 무효화한다.

**완료 조건**
- [x] refresh_tokens 테이블 생성 완료 (id, user_id FK→users.id ON DELETE CASCADE, token, expires_at, created_at)
- [x] UNIQUE(token) 제약으로 토큰 중복 저장 차단 확인
- [x] user_id ON DELETE CASCADE 동작 확인 — users 레코드 삭제(inactive 전환이 아닌 테스트용) 시 토큰 자동 삭제
- [ ] expires_at 인덱스 생성하여 만료 토큰 조회 최적화 확인 (database/schema.sql에 refresh_tokens.expires_at 인덱스 없음 — UNIQUE(token)만 존재)

**참조 규칙**: BR-12, NFR-SEC01, NFR-SEC07, AC-U3, AC-U4

---

### DB-04. groups, group_members 테이블 생성 및 제약 조건 설정
> 복잡도: `S` | 의존성: DB-02

**완료 조건**
- [x] groups.chk_limited_end_date 제약이 LIMITED 타입의 end_date 누락 및 역순 날짜 차단
- [x] UNLIMITED 타입에서 end_date=NULL INSERT 성공
- [x] group_members UNIQUE(group_id, user_id) 제약으로 중복 소속 차단 확인

**참조 규칙**: BR-02, DR-02, DR-03, BR-14, AC-G1, AC-G2, AC-G3

---

### DB-05. categories 테이블 생성 및 scope 제약 설정
> 복잡도: `S` | 의존성: DB-04

SYSTEM이면 group_id IS NULL, GROUP이면 group_id IS NOT NULL 제약을 DB 레이어에서 강제한다.

**완료 조건**
- [x] SYSTEM 카테고리에 group_id 값 INSERT 시 CHECK 위반으로 실패
- [x] GROUP 카테고리에 group_id=NULL이면 CHECK 위반으로 실패
- [x] 유효한 SYSTEM/GROUP 카테고리 INSERT 성공

**참조 규칙**: BR-10, BR-11, AC-C1, AC-C2, AC-C3

---

### DB-06. expenses, expense_splits 테이블 생성 및 제약 조건 설정
> 복잡도: `S` | 의존성: DB-04, DB-05

**완료 조건**
- [x] expenses.total_amount 범위 외(0 또는 10억) CHECK 위반 확인
- [x] expense 삭제 시 expense_splits CASCADE 삭제 동작 확인
- [x] UNIQUE(expense_id, user_id)로 동일 지출 동일 멤버 중복 차단 확인

**참조 규칙**: BR-04, BR-05, BR-06, BR-15, DR-04, AC-ES1, AC-ES2, AC-ES3

---

### DB-07. settlements, settlement_details, messages 테이블 생성 및 제약 조건 설정
> 복잡도: `S` | 의존성: DB-04

**완료 조건**
- [x] settlements.period_start > period_end일 때 CHECK 위반 확인
- [x] settlement_details.balance가 GENERATED ALWAYS AS (total_paid - total_share) STORED로 자동 계산
- [x] total_paid, total_share 변경 시 balance 자동 갱신 확인
- [x] UNIQUE(settlement_id, user_id) 제약으로 정산당 멤버 중복 레코드 차단

**참조 규칙**: BR-07, BR-08, BR-09, BR-15, DR-05, DR-06, AC-S1, AC-S3, AC-S4, AC-M1

---

### DB-08. invitations 테이블 생성 및 제약 조건 설정
> 복잡도: `S` | 의존성: DB-04

**완료 조건**
- [x] expires_at <= created_at일 때 CHECK 위반으로 INSERT 실패
- [x] 유효한 PENDING 초대 INSERT 성공
- [x] status ENUM이 PENDING/ACCEPTED/DECLINED/EXPIRED 외 값에서 오류 발생

**참조 규칙**: BR-03, AC-I1, AC-I2, AC-I3, AC-I4, AC-I5

---

### DB-09. 인덱스 생성 — 조회 성능 및 배치 처리 최적화
> 복잡도: `S` | 의존성: DB-02, DB-04, DB-05, DB-06, DB-07, DB-08

**완료 조건**
- [x] EXPLAIN ANALYZE 기준 그룹별 지출 날짜 범위 조회가 인덱스 스캔 사용
- [x] PENDING 초대 만료 배치 쿼리(expires_at 기준)가 인덱스 스캔 사용
- [x] joined_at 인덱스를 활용한 MANAGER 이양 대상 조회 최적화 확인
- [x] 모든 인덱스가 IF NOT EXISTS로 idempotent하게 생성

**참조 규칙**: BR-13, BR-03, DR-05, AC-I5, NFR-P01

---

### DB-10. 시드 데이터 — SYSTEM 카테고리 7개 초기 적재
> 복잡도: `S` | 의존성: DB-05

**완료 조건**
- [x] 식비, 교통, 숙소, 쇼핑, 문화/여가, 의료, 기타 7개 카테고리 정상 적재
- [x] 중복 실행 시 ON CONFLICT DO NOTHING으로 오류 없이 스킵
- [x] '기타' 카테고리의 UUID 조회 방법 결정 및 문서화 (name='기타' 조회 방식 채택)
- [x] 모든 시드 레코드의 group_id가 NULL

**참조 규칙**: BR-10, BR-11, AC-C2

---

### DB-17. 초대 만료 배치 처리 — PENDING → EXPIRED 전환  ← 함수 정의가 database/schema.sql에 없음 (코드는 expire_pending_invitations() 호출)
> 복잡도: `M` | 의존성: DB-08

expires_at이 현재 시각 이전인 PENDING 초대를 EXPIRED로 일괄 전환한다. NFR-A04(1시간 이내 처리)를 만족해야 한다.

**완료 조건**
- [ ] expires_at이 지난 PENDING 초대가 1시간 이내에 EXPIRED로 전환 (AC-I5, NFR-A04)
- [ ] 배치 실행 주기 최대 30분 간격으로 설정
- [ ] 이미 최종 상태(ACCEPTED/DECLINED/EXPIRED)인 초대는 영향받지 않음
- [ ] 배치 실행 결과(전환 건수, 실행 시각)가 로그로 기록

**참조 규칙**: BR-03, AC-I5, NFR-A04

---

### DB-18. DB 함수 — MANAGER 권한 이양 및 그룹 비활성화  ← 함수 정의가 database/schema.sql에 없음 (코드는 transfer_manager_or_deactivate_group() 호출)
> 복잡도: `L` | 의존성: DB-04, DB-02

transfer_manager_or_deactivate_group 함수를 구현하여 MANAGER 탈퇴 시 권한 이양 또는 그룹 비활성화를 트랜잭션으로 처리한다.

**완료 조건**
- [ ] MANAGER 탈퇴 시 joined_at 기준 최선임 활성 MEMBER가 MANAGER로 승격 (AC-GM1)
- [ ] 활성 MEMBER가 없으면 그룹이 inactive로 전환 (AC-GM2)
- [ ] MEMBER 탈퇴 시 group_members 레코드만 삭제 (AC-GM3)
- [ ] 동시 탈퇴 시나리오에서 트랜잭션 격리로 중복 MANAGER 승격 방지

**참조 규칙**: BR-13, BR-14, BR-12, AC-GM1, AC-GM2, AC-GM3

---

### DB-19. DB 함수 — GROUP 카테고리 삭제 및 지출 재분류  ← 함수 정의가 database/schema.sql에 없음 (코드는 delete_group_category() 호출)
> 복잡도: `M` | 의존성: DB-05, DB-06, DB-10

delete_group_category 함수: 트랜잭션 내에서 지출을 '기타'로 UPDATE한 후 카테고리를 DELETE한다.

**완료 조건**
- [ ] GROUP 카테고리 삭제 시 해당 카테고리 지출이 '기타'로 재분류 (AC-C2)
- [ ] 사용 중인 지출이 없는 GROUP 카테고리도 정상 삭제 (AC-C3)
- [ ] SYSTEM 카테고리에 대해 함수 호출 시 예외 발생 (AC-C1)
- [ ] UPDATE와 DELETE가 하나의 트랜잭션 내에서 원자적으로 처리

**참조 규칙**: BR-10, BR-11, AC-C1, AC-C2, AC-C3

---

### DB-20. 마이그레이션 관리 체계 수립  ← 실제로는 마이그레이션 도구 없이 database/schema.sql 단일 파일을 수동 적용
> 복잡도: `M` | 의존성: DB-01 ~ DB-19 전체

Supabase CLI 기반 타임스탬프 마이그레이션 파일 구성 및 관리 체계 수립.

**완료 조건**
- [ ] supabase db status로 마이그레이션 이력 정상 추적
- [ ] supabase db reset으로 전체 스키마가 idempotent하게 재구성
- [ ] 마이그레이션 파일 순서가 의존성(테이블→인덱스→시드→함수→RLS)을 준수
- [ ] 로컬 환경과 원격 Supabase 프로젝트에 동일한 마이그레이션 적용 가능

---

## 4. 백엔드 태스크 (BE)

### BE-01. 프로젝트 초기 세팅 — Express 앱 골격 및 환경변수 구성
> 복잡도: `S` | 의존성: 없음

**완료 조건**
- [x] npm run dev 실행 시 서버 정상 기동, GET /api/v1/health에 200 응답
- [x] 필수 환경변수 누락 시 프로세스 종료
- [x] ESLint, Prettier, tsc --noEmit 오류 없이 통과
- [x] .env.example에 모든 필수 환경변수 키와 설명 주석 포함

**참조 규칙**: NFR-SEC03, NFR-SEC04

---

### BE-02. 인프라 레이어 구현 — DB 클라이언트, JWT 유틸, bcrypt 유틸
> 복잡도: `S` | 의존성: BE-01

**완료 조건**
- [x] signAccessToken/signRefreshToken/verifyToken 함수 올바른 payload 반환 및 만료 시 오류
- [x] hashPassword/comparePassword 함수가 bcrypt cost 12 이상으로 동작
- [x] postgres.js 연결 풀(max:10)이 DATABASE_URL로 초기화 (`src/lib/db.ts`)
- [x] JWT 시크릿 값이 로그에 출력되지 않음

**참조 규칙**: NFR-SEC01, NFR-SEC02, 도메인 2.1

---

### BE-03. 공통 미들웨어 — 전역 에러 핸들러, 로거
> 복잡도: `S` | 의존성: BE-01

**완료 조건**
- [x] 처리되지 않은 예외가 errorCode: INTERNAL_ERROR, HTTP 500으로 응답
- [x] 4xx 에러 시 errorCode, message 필드가 포함된 표준 JSON 반환
- [x] 5xx 에러 응답에 stack trace 미포함 확인
- [x] 로그에 password, token 원문이 출력되지 않음

**참조 규칙**: 도메인 2.4, NFR-M01, NFR-M02

---

### BE-04. DB 마이그레이션 — 스키마 및 시드 데이터
> 복잡도: `M` | 의존성: BE-01

**완료 조건**
- [ ] Supabase CLI로 마이그레이션 적용 시 모든 테이블이 오류 없이 생성
- [x] SYSTEM 카테고리 7개가 categories 테이블에 정확히 삽입
- [x] 복합 UNIQUE 제약 3개가 DB 레벨에 선언
- [x] balance 계산 방식(GENERATED COLUMN or 애플리케이션) 결정 및 문서화

**참조 규칙**: DR-01, DR-02, DR-06, BR-10, 도메인 3.1~3.10

---

### BE-05. 공통 타입 및 상수 정의
> 복잡도: `S` | 의존성: BE-01

**완료 조건**
- [x] any 타입 사용이 없고 tsc --noEmit 통과
- [x] ROLE, SPLIT_TYPE, INVITATION_STATUS 상수가 as const 객체로 정의
- [x] errorCodes.ts에 도메인 2.4의 7개 HTTP 상태 코드별 errorCode 상수 포함
- [x] Express Request 확장(req.user 타입)이 src/types/express.d.ts에 정의

**참조 규칙**: 도메인 2.1, 도메인 2.2, 도메인 2.4

---

### BE-06. 인증 미들웨어 — JWT 파싱 및 서명 검증
> 복잡도: `M` | 의존성: BE-02, BE-03, BE-05

**완료 조건**
- [x] 유효한 Access Token으로 요청 시 req.user.id가 정확히 설정
- [x] 토큰 없거나 만료된 경우 401 UNAUTHENTICATED 반환
- [x] inactive 사용자의 Access Token으로 요청 시 401 반환 (AC-U4)
- [x] 단위 테스트에서 토큰 없음/만료/inactive 3가지 케이스 모두 검증

**참조 규칙**: 도메인 2.1, NFR-SEC04, AC-U4

---

### BE-07. 역할 미들웨어 — 그룹 내 MANAGER/MEMBER 서버사이드 검증
> 복잡도: `M` | 의존성: BE-06

**완료 조건**
- [x] MEMBER가 MANAGER 전용 엔드포인트 호출 시 403 반환
- [x] 그룹 미소속 사용자 요청 시 403 반환
- [x] 존재하지 않는 groupId 요청 시 404 반환
- [x] 통합 테스트에서 MEMBER의 정산 실행 시도 403 확인 (AC-S2)

**참조 규칙**: NFR-SEC05, BR-07, AC-S2

---

### BE-08. 요청 검증 미들웨어 — zod 스키마 기반 입력 검증
> 복잡도: `M` | 의존성: BE-03, BE-05

**완료 조건**
- [x] username 형식 위반 시 400 INVALID_INPUT 반환
- [ ] 금액 범위 초과(0원, 10억원 이상) 시 422 VALIDATION_FAILED 반환 (현재 zod 4 이슈의 origin 미반영으로 400 INVALID_INPUT 반환 — 미해결)
- [x] end_date < start_date 시 422 반환 (AC-G2, AC-S1)
- [x] 컨트롤러 진입 전 검증 완료, 컨트롤러에 검증된 데이터만 도달

**참조 규칙**: 도메인 5, 도메인 2.2, DR-03, DR-05, AC-G1, AC-G2, AC-S1

---

### BE-09. 유틸 함수 — 균등 분배 계산 및 KST-UTC 변환
> 복잡도: `M` | 의존성: BE-05

**완료 조건**
- [x] 10,000원 3명 EQUAL 계산 시 결제자 3,334원, 나머지 각 3,333원 (AC-ES1)
- [x] 7,000원 3명 EQUAL 계산 시 결제자 2,334원, 나머지 각 2,333원
- [x] KST 2026-06-15 → period_start UTC 변환값이 2026-06-14T15:00:00Z
- [x] KST 2026-06-15 → period_end UTC 변환값이 2026-06-15T14:59:59Z
- [x] 단위 테스트에서 위 케이스 모두 통과

**참조 규칙**: BR-05, BR-06, 도메인 2.2, 도메인 2.3, AC-ES1

---

### BE-10. 인증 API — 회원가입
> 복잡도: `M` | 의존성: BE-02, BE-06, BE-08, BE-04

**완료 조건**
- [x] 유효한 자격증명으로 가입 시 201 반환, status=active (AC-U1)
- [x] 중복 username 가입 시도 시 409 DUPLICATE_RESOURCE 반환 (AC-U2)
- [x] 중복 email 가입 시도 시 409 반환
- [x] 비밀번호 규칙 위반 시 400 INVALID_INPUT 반환
- [x] 응답에 비밀번호 해시가 포함되지 않음

**참조 규칙**: FR-U01, DR-01, 도메인 2.1, NFR-SEC02, AC-U1, AC-U2

---

### BE-11. 인증 API — 로그인, 토큰 발급
> 복잡도: `M` | 의존성: BE-10

**완료 조건**
- [x] 올바른 자격증명으로 로그인 시 Access Token 반환, Refresh Token 쿠키 설정
- [x] inactive 사용자 로그인 시 401 반환 (AC-U4)
- [x] 잘못된 비밀번호 시 401 반환
- [x] Refresh Token이 httpOnly 쿠키로 전송
- [x] DB에 Refresh Token 레코드가 저장

**참조 규칙**: FR-U02, 도메인 2.1, NFR-SEC01, AC-U4

---

### BE-12. 인증 API — 토큰 갱신 및 로그아웃
> 복잡도: `M` | 의존성: BE-11

**완료 조건**
- [x] 유효한 Refresh Token으로 /refresh 호출 시 새 Access Token 반환
- [x] 만료된 Refresh Token으로 /refresh 호출 시 401 반환
- [x] /logout 호출 시 DB에서 Refresh Token 삭제, 쿠키 만료
- [x] Refresh Token 재사용 공격 시 401 반환 (DB 레코드 없음)

**참조 규칙**: 도메인 2.1, NFR-SEC01, NFR-SEC07

---

### BE-13. 인증 API — 회원 탈퇴
> 복잡도: `L` | 의존성: BE-12

MANAGER 권한 이양, 그룹 비활성화, Refresh Token 무효화를 순서대로 처리한다(명시적 DB 트랜잭션 없음, 권한 이양은 DB 함수).

**완료 조건**
- [x] 탈퇴 후 해당 사용자의 Refresh Token이 DB에서 모두 삭제 (FR-U04, NFR-SEC07)
- [x] MANAGER 탈퇴 시 joined_at 가장 이른 활성 MEMBER가 MANAGER로 승격 (AC-GM1)
- [x] 활성 MEMBER 없는 그룹은 inactive 전환 (AC-GM2)
- [x] MEMBER 탈퇴 시 GroupMember 레코드 삭제, Expense 보존 (AC-GM3)
- [x] 탈퇴 후 inactive 사용자의 Access Token으로 API 호출 시 401 반환

**참조 규칙**: FR-U04, BR-12, BR-13, BR-14, NFR-SEC07, AC-U3, AC-GM1, AC-GM2, AC-GM3

---

### BE-14. 그룹 API — 그룹 생성 및 목록 조회
> 복잡도: `M` | 의존성: BE-07, BE-08, BE-04

**완료 조건**
- [x] UNLIMITED 타입 그룹 생성 시 end_date=null로 저장 (AC-G3)
- [x] LIMITED 타입 end_date 미입력 시 422 반환 (AC-G1)
- [x] end_date < start_date 시 422 반환 (AC-G2)
- [x] 그룹 생성자가 MANAGER로 group_members에 등록
- [x] GET /groups 응답에 로그인 사용자 소속 그룹만 포함

**참조 규칙**: FR-G01, FR-G02, FR-G03, BR-02, DR-03, AC-G1, AC-G2, AC-G3

---

### BE-15. 그룹 API — 그룹 상세 조회, 수정, 비활성화
> 복잡도: `M` | 의존성: BE-14

**완료 조건**
- [x] 그룹 멤버만 GET /groups/:groupId 조회 가능, 비멤버는 403
- [x] MEMBER의 PATCH/DELETE 시도 시 403 반환
- [ ] PATCH에서 LIMITED 타입 end_date < start_date 수정 시 422 반환 (미구현 — updateGroupSchema에 날짜 순서 검증 없음)
- [x] DELETE 후 group.status=inactive, 기존 지출 데이터 보존

**참조 규칙**: FR-G04, FR-G05, BR-14, DR-03

---

### BE-16. 멤버/초대 API — 초대 발송 및 목록 조회
> 복잡도: `M` | 의존성: BE-07, BE-08, BE-15

**완료 조건**
- [x] 유효한 username, PENDING 초대 없음 조건에서 초대 생성 성공 (AC-I1)
- [x] 이미 그룹 멤버인 username 초대 시 409 반환 (AC-I2)
- [x] 동일 대상 PENDING 초대 존재 시 409 반환 (AC-I3)
- [x] expires_at이 created_at + 7일로 정확히 설정
- [x] MEMBER의 초대 발송 시도 시 403 반환

**참조 규칙**: FR-I01, FR-I02, FR-I05, BR-03, AC-I1, AC-I2, AC-I3

---

### BE-17. 멤버/초대 API — 초대 수락/거절 및 멤버 제거
> 복잡도: `M` | 의존성: BE-16

**완료 조건**
- [x] PENDING 초대 수락 시 GroupMember 생성(role=MEMBER), Invitation status=ACCEPTED (AC-I4)
- [x] PENDING 초대 거절 시 Invitation status=DECLINED
- [x] 만료된 초대 수락 시도 시 422 반환
- [x] MANAGER의 멤버 제거 후 GroupMember 삭제, Expense 보존 (FR-I06)
- [x] MANAGER 본인 제거 시도 시 422 반환

**참조 규칙**: FR-I03, FR-I04, FR-I06, BR-03, AC-I4

---

### BE-18. 카테고리 API — 조회, 추가/삭제
> 복잡도: `M` | 의존성: BE-07, BE-08, BE-04

**완료 조건**
- [x] SYSTEM 카테고리 삭제 시도 시 403 반환 (AC-C1, BR-10)
- [x] GROUP 카테고리 삭제 시 해당 카테고리 사용 Expense가 '기타'로 재분류 (AC-C2)
- [x] 사용 중인 지출 없는 GROUP 카테고리 삭제 시 카테고리만 삭제 (AC-C3)
- [ ] 삭제와 재분류가 단일 트랜잭션으로 처리 (DB 함수 delete_group_category에 의존, 함수 정의는 schema.sql에 없음)
- [x] MEMBER의 추가/삭제 시도 시 403 반환

**참조 규칙**: FR-C01, FR-C02, FR-C03, FR-C04, BR-10, BR-11, AC-C1, AC-C2, AC-C3

---

### BE-19. 지출 API — 지출 등록 (EQUAL/CUSTOM 분담 계산 포함)
> 복잡도: `L` | 의존성: BE-07, BE-08, BE-09, BE-18

**완료 조건**
- [x] EQUAL 10,000원 3명 저장 시 ExpenseSplit 레코드 3,334/3,333/3,333원으로 생성 (AC-ES1)
- [x] CUSTOM 분담 합산 불일치 시 422 반환 (AC-ES3)
- [x] paid_by가 participants에 없어도 ExpenseSplit에 자동 포함 (BR-06)
- [ ] 금액 범위 위반 시 422 반환 (현재 400 INVALID_INPUT 반환 — 338과 동일 원인)
- [x] 그룹 비멤버 접근 시 403 반환
- [ ] Expense와 ExpenseSplit이 단일 트랜잭션으로 저장 (현재 INSERT가 개별 쿼리로 실행됨)

**참조 규칙**: FR-E01, FR-E02, FR-E03, FR-E04, BR-05, BR-06, DR-04, AC-ES1, AC-ES3

---

### BE-20. 지출 API — 지출 목록 조회 및 필터
> 복잡도: `M` | 의존성: BE-19

**완료 조건**
- [x] 그룹 멤버 모두 전체 지출 목록 조회 가능 (BR-04)
- [x] date_from/date_to 필터가 KST 기준으로 적용
- [x] category_id 필터 동작 확인
- [x] 페이지네이션 파라미터 적용, 응답에 총 건수 포함
- [x] 비멤버 접근 시 403 반환

**참조 규칙**: FR-E05, FR-E08, BR-04, 도메인 2.3

---

### BE-21. 지출 API — 지출 수정 및 삭제
> 복잡도: `M` | 의존성: BE-20

**완료 조건**
- [x] MEMBER가 본인이 결제자(paid_by)인 지출 수정/삭제 성공
- [x] MEMBER가 타인 작성 지출 수정/삭제 시도 시 403 반환
- [x] 정산 완료 기간 지출 수정 후 Settlement/SettlementDetail 불변 (AC-EX1)
- [x] 정산 완료 기간 지출 삭제 후 Settlement/SettlementDetail 불변 (AC-EX2)
- [ ] 수정 시 ExpenseSplit 재계산이 트랜잭션으로 처리 (현재 개별 쿼리로 처리)

**참조 규칙**: FR-E06, FR-E07, BR-15, AC-EX1, AC-EX2

---

### BE-22. 정산 API — 정산 실행 및 메시지 발송
> 복잡도: `L` | 의존성: BE-07, BE-09, BE-21

Settlement, SettlementDetail, Message 생성을 순서대로 생성한다(명시적 DB 트랜잭션 없음).

**완료 조건**
- [x] MEMBER의 정산 실행 시도 시 403 반환 (AC-S2)
- [x] period_start > period_end 시 422 반환 (AC-S1)
- [x] 정산 후 SettlementDetail의 balance = total_paid - total_share (DR-06)
- [x] 지출 0건 기간 정산 시 그룹 멤버 수만큼 SettlementDetail 생성, 모두 balance=0 (AC-S3)
- [x] 정산 완료 후 활성 멤버 전원에게 Message 레코드 생성 (AC-M1)
- [x] 재정산 시 기존 Settlement 레코드 불변, 새 레코드 생성 (FR-S04)

**참조 규칙**: FR-S01, FR-S04, FR-S06, BR-07, BR-08, DR-05, DR-06, AC-S1, AC-S2, AC-S3, AC-S4, AC-M1

---

### BE-23. 정산 API — 정산 목록 및 상세 조회
> 복잡도: `S` | 의존성: BE-22

**완료 조건**
- [x] 그룹 멤버(MANAGER/MEMBER) 모두 정산 목록 조회 가능 (FR-S05)
- [x] 재정산 2건 존재 시 두 Settlement 레코드가 독립적으로 목록에 표시
- [x] 정산 상세에 멤버별 balance 부호 정확히 반환 (양수=받을금액, 음수=낼금액)
- [x] 비멤버 접근 시 403 반환

**참조 규칙**: FR-S02, FR-S05, DR-06

---

### BE-24. 메시지 API — 수신 메시지 목록 조회
> 복잡도: `S` | 의존성: BE-22

**완료 조건**
- [x] 로그인 사용자의 수신 메시지만 반환, 타인 메시지 미노출
- [x] 임의 메시지 발송 API가 존재하지 않음 (AC-M2)
- [x] 페이지네이션 적용
- [x] 비인증 요청 시 401 반환

**참조 규칙**: FR-M02, FR-M03, BR-09, AC-M2

---

### BE-25. 리포트 API — 차트 데이터 조회
> 복잡도: `M` | 의존성: BE-20

**완료 조건**
- [x] GET /groups/:groupId/reports/categories 에서 카테고리별 지출 합계 집계
- [x] GET /groups/:groupId/reports/members 에서 멤버별 분담금 합계 집계 (ExpenseSplit 기준)
- [x] period_start~period_end 필터가 KST 기준으로 동작
- [x] 비멤버 접근 시 403 반환
- [x] 응답 시간 p95 ≤ 3,000ms (NFR-P04)
- [x] GET /groups/:groupId/reports/expenses/export 에서 지출 엑셀 다운로드
- [x] GET /groups/:groupId/reports/settlements/:settlementId/export 에서 정산 엑셀 다운로드

**참조 규칙**: FR-R01, FR-R02, FR-R03, FR-R04, NFR-P04, 도메인 2.3

---

### BE-26. 리포트 API — 엑셀 내보내기
> 복잡도: `M` | 의존성: BE-23, BE-25

**완료 조건**
- [x] GET /groups/:groupId/reports/expenses/export 에서 지출 내역 엑셀 다운로드 (날짜, 카테고리, 금액, 결제자, 분담 정보 포함)
- [x] GET /groups/:groupId/reports/settlements/:settlementId/export 에서 정산 엑셀 다운로드 (멤버별 total_paid, total_share, balance 포함)
- [x] Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet 헤더 설정
- [x] 비멤버 접근 시 403 반환

**참조 규칙**: FR-R03, FR-R04, DR-06

---

### BE-27. 배치 — 초대 만료 처리
> 복잡도: `S` | 의존성: BE-16

**완료 조건**
- [x] 만료 시각이 경과한 PENDING 초대가 1시간 이내에 EXPIRED로 전환 (AC-I5, NFR-A04)
- [x] 배치 실행마다 처리 건수가 로그에 기록
- [x] 0건 처리 시에도 오류 없이 정상 완료
- [x] 배치 실패 시 error 레벨로 로그 기록, 서버 프로세스는 계속 동작

**참조 규칙**: FR-I02, NFR-A04, AC-I5, 도메인 3.4

---

### BE-28. 단위 테스트 — 비즈니스 로직 및 유틸 함수
> 복잡도: `M` | 의존성: BE-09, BE-22

**완료 조건**
- [x] splitCalculator 단위 테스트: AC-ES1, AC-ES2 포함 5개 이상 케이스 통과
- [x] dateUtils 단위 테스트: KST-UTC 경계 변환 케이스 4개 이상 통과
- [x] settlement.service 단위 테스트: balance 계산, 0건 기간 처리 케이스 포함
- [x] services/ 라인 커버리지 80% 이상 달성

**참조 규칙**: BR-05, BR-06, DR-06, AC-ES1, AC-S3

---

### BE-29. 통합 테스트 — 인증 플로우 및 권한 검증
> 복잡도: `L` | 의존성: BE-13, BE-21, BE-22

**완료 조건**
- [x] 회원가입→로그인→탈퇴 플로우 통합 테스트 통과
- [x] 권한 거부 5개 시나리오(403/401) 통합 테스트 통과
- [x] 정산 후 지출 수정 시 Settlement 불변 통합 테스트 통과 (AC-EX1)
- [x] 전체 BE 라인 커버리지 70% 이상

**참조 규칙**: NFR-SEC04, NFR-SEC05, AC-EX1, AC-S2

---

### BE-30. Swagger UI 적용 — /api-docs 엔드포인트
> 복잡도: `S` | 의존성: BE-01

**완료 조건**
- [x] GET /api-docs 에서 Swagger UI 정상 렌더링
- [x] swagger/swagger.json 기반 OpenAPI 3.0 명세 표시
- [x] helmet contentSecurityPolicy 비활성화로 Swagger UI 정상 로드

**참조 규칙**: 도메인 2.1

---

## 5. 프론트엔드 태스크 (FE)

### FE-01. Vite + React + TypeScript 프로젝트 초기 세팅
> 복잡도: `S` | 의존성: 없음

**완료 조건**
- [x] vite.config.ts에서 경로 별칭('@/') 설정 완료
- [x] tsconfig.json에 noImplicitAny, strictNullChecks 적용
- [x] ESLint no-explicit-any 규칙 활성화 및 Prettier 설정
- [x] src/constants/roles.ts, expense.ts, routes.ts에 도메인 상수 정의

---

### FE-02. React Router v7 라우터 설정 및 보호 라우트 구현
> 복잡도: `S` | 의존성: FE-01

**완료 조건**
- [x] App.tsx에 전체 라우트 트리 구성 완료
- [x] ProtectedRoute 컴포넌트가 비인증 사용자를 /login으로 리다이렉트
- [x] 404 Fallback 페이지 구현
- [x] routes.ts 상수를 통해 하드코딩된 경로 문자열 사용 금지

---

### FE-03. axios 인스턴스 및 토큰 관리
> 복잡도: `M` | 의존성: FE-01

**완료 조건**
- [x] axios 인스턴스가 src/api/client.ts에 단일 생성
- [x] 요청 인터셉터에서 Access Token 자동 주입 구현
- [x] 401 응답 시 /auth/refresh 호출 후 원본 요청 재시도 로직 구현
- [x] 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
- [x] Access Token은 lib/tokenStore.ts를 통해 localStorage(access_token)에 저장 (메모리 저장 방식은 향후 과제)

**참조 규칙**: NFR-SEC01

---

### FE-04. React Query 설정 및 도메인/API 타입 정의
> 복잡도: `M` | 의존성: FE-01

**완료 조건**
- [x] QueryClientProvider가 App.tsx에 등록 완료
- [x] domain.ts에 10개 도메인 엔티티 타입 정의 (any 사용 없음)
- [x] api.ts에 각 API 엔드포인트별 요청/응답 DTO 타입 정의
- [x] ROLE, SPLIT_TYPE, INVITATION_STATUS 등 as const 객체로 열거형 정의

---

### FE-05. 공통 유틸 함수 구현 (통화 포맷, 날짜, 분담 계산, 검증)
> 복잡도: `M` | 의존성: FE-01

**완료 조건**
- [x] formatCurrency(1000) === '1,000원' 등 단위 테스트 90% 이상 커버리지
- [x] splitCalculator가 균등 분배 나머지를 결제자에게 귀속하는 로직 검증 완료
- [x] dateUtils에서 KST 기준 날짜를 API 전송 시 YYYY-MM-DD 문자열로 처리
- [x] validators.ts가 금액 범위, 날짜 역전 등 클라이언트 사이드 검증 함수 제공

**참조 규칙**: BR-05, BR-06, DR-04

---

### FE-06. 공통 UI 컴포넌트 구현 (Button, Modal, Input, Table, LoadingSpinner, ErrorMessage)
> 복잡도: `M` | 의존성: FE-01

**완료 조건**
- [x] Button, Modal, Input, Table, LoadingSpinner, ErrorMessage 컴포넌트 구현 완료
- [x] 모든 interactive 요소에 키보드 접근 가능 (Tab, Enter, Escape)
- [x] 에러 메시지에 role='alert' 또는 aria-live 적용
- [x] 모달에 focus trap 구현
- [x] 색상 대비율 4.5:1 이상 확인 (WCAG 2.1 AA)

---

### FE-07. 레이아웃 컴포넌트 구현 (AppLayout, AuthLayout)
> 복잡도: `S` | 의존성: FE-06

**완료 조건**
- [x] AppLayout이 헤더, 메인 콘텐츠 영역을 포함하며 Outlet으로 페이지 컴포넌트 렌더링
- [x] 모바일(320px~) 및 데스크탑 반응형 레이아웃 구현
- [x] 헤더에 메시지 알림 배지 표시 영역 포함
- [x] AuthLayout이 인증 화면용 카드 중앙 레이아웃 제공

---

### FE-08. 인증 API 클라이언트 및 useAuth 훅 구현
> 복잡도: `M` | 의존성: FE-03, FE-04

**완료 조건**
- [x] authApi.ts에 signup, login, refresh, withdraw 함수 구현
- [x] useAuth 훅에서 현재 인증 사용자 정보, isAuthenticated 상태 제공
- [x] 로그아웃/탈퇴 후 메모리 내 Access Token 즉시 초기화
- [x] API 에러(401, 409 등)를 훅 레벨에서 표준화된 에러 객체로 변환

**참조 규칙**: FR-U01, FR-U02, FR-U04, NFR-SEC01, NFR-SEC07

---

### FE-09. 회원가입 페이지 구현
> 복잡도: `S` | 의존성: FE-07, FE-08

**완료 조건**
- [x] 이메일, 비밀번호, username 필드 및 유효성 검증 구현
- [x] username 중복(409) 에러를 username 필드 아래에 인라인 표시
- [x] 가입 성공 후 로그인 페이지로 리다이렉트
- [x] 모든 폼 필드에 label 연결 및 aria-describedby로 에러 메시지 연결

**참조 규칙**: FR-U01, FR-U03

---

### FE-10. 로그인 페이지 구현
> 복잡도: `S` | 의존성: FE-07, FE-08

**완료 조건**
- [x] 이메일, 비밀번호 폼 및 로그인 버튼 구현
- [x] 로그인 성공 시 redirect 처리 (from location 기반)
- [x] 401 에러 시 '이메일 또는 비밀번호가 올바르지 않습니다' 메시지 표시
- [x] 로딩 중 버튼 비활성화 처리

**참조 규칙**: FR-U02

---

### FE-11. 회원 탈퇴 화면 구현
> 복잡도: `S` | 의존성: FE-07, FE-08

**완료 조건**
- [x] 탈퇴 확인 모달에 정책 안내 문구 포함
- [x] 탈퇴 완료 후 클라이언트 토큰 초기화 및 로그인 페이지 이동
- [x] 탈퇴 API 호출 중 로딩 상태 표시 및 중복 클릭 방지
- [x] 모달에 키보드 접근성 및 focus trap 적용

**참조 규칙**: FR-U04, FR-U05

---

### FE-12. 그룹 API 클라이언트 및 useGroups 훅 구현
> 복잡도: `M` | 의존성: FE-03, FE-04

**완료 조건**
- [x] groupApi.ts에 getGroups, getGroup, createGroup, updateGroup, deactivateGroup 함수 구현
- [x] useGroups 훅에서 그룹 목록 및 개별 그룹 상세 데이터 제공
- [x] 그룹 생성/수정 뮤테이션 성공 시 관련 쿼리 자동 무효화
- [x] API 응답 타입이 src/types/api.ts의 DTO 타입과 일치

**참조 규칙**: FR-G01, FR-G02, FR-G04, FR-G05

---

### FE-13. 그룹 목록 페이지 구현
> 복잡도: `S` | 의존성: FE-07, FE-12

**완료 조건**
- [x] 그룹 목록 로딩/에러/빈 상태 세 가지 상태 UI 구현
- [x] 각 그룹 카드 클릭 시 그룹 상세 페이지로 이동
- [x] '그룹 만들기' 버튼이 그룹 생성 페이지로 연결
- [x] LIMITED 그룹에 종료일 표시, UNLIMITED는 '상시' 표시

**참조 규칙**: FR-G01, FR-G03

---

### FE-14. 그룹 생성 페이지 구현
> 복잡도: `S` | 의존성: FE-07, FE-12

**완료 조건**
- [x] 그룹 타입 선택에 따라 종료일 필드 조건부 렌더링
- [x] LIMITED 타입 선택 시 종료일 필수 검증
- [x] 종료일이 시작일보다 이전인 경우 에러 메시지 표시
- [x] 그룹 생성 성공 시 생성된 그룹의 상세 페이지로 이동

**참조 규칙**: FR-G01, FR-G02

---

### FE-15. 그룹 상세 페이지 및 그룹 수정/비활성화 구현
> 복잡도: `M` | 의존성: FE-07, FE-12

**완료 조건**
- [x] 그룹 기본 정보(이름, 타입, 기간, 상태) 표시
- [x] MANAGER 역할인 경우에만 수정/비활성화 버튼 노출
- [x] 그룹 수정 폼에서 이름·기간 변경 후 저장 기능 구현
- [x] 비활성화 확인 모달 구현 및 성공 시 그룹 목록으로 이동

**참조 규칙**: FR-G04, FR-G05

---

### FE-16. 초대/멤버 API 클라이언트 및 useInvitations 훅 구현
> 복잡도: `M` | 의존성: FE-03, FE-04

**완료 조건**
- [x] invitationApi.ts에 sendInvitation, getMyInvitations, respondToInvitation 함수 구현
- [x] groupApi.ts에 getGroupMembers, removeGroupMember 함수 추가
- [x] useInvitations 훅에서 수신 초대 목록 및 수락/거절 뮤테이션 제공
- [x] 409(중복 초대), 404(사용자 없음) 에러를 UI 메시지로 변환

**참조 규칙**: FR-I01, FR-I02, FR-I03, FR-I04, FR-I05, FR-I06

---

### FE-17. 초대 발송 화면 구현 (MANAGER용)
> 복잡도: `S` | 의존성: FE-15, FE-16

**완료 조건**
- [x] username 입력 및 초대 전송 UI 구현 (검색 결과 표시는 없음)
- [x] 초대 발송 성공 시 성공 토스트 또는 인라인 메시지 표시
- [x] 409, 404 에러별 구체적인 안내 메시지 표시
- [x] MANAGER 역할이 아닌 사용자에게 초대 발송 UI 미노출

**참조 규칙**: FR-I01, FR-I05

---

### FE-18. 수신 초대 목록 및 수락/거절 화면 구현
> 복잡도: `S` | 의존성: FE-07, FE-16

**완료 조건**
- [x] PENDING 초대 목록 표시 (그룹명, 초대자, 만료 기한 포함)
- [x] 수락 성공 시 해당 그룹 상세 페이지로 이동
- [x] 거절 성공 시 목록에서 해당 초대 제거
- [x] 만료된 초대에 '만료됨' 배지 표시 및 버튼 비활성화

**참조 규칙**: FR-I03, FR-I04, FR-I02

---

### FE-19. 그룹 멤버 관리 화면 구현
> 복잡도: `S` | 의존성: FE-15, FE-16

**완료 조건**
- [x] 멤버 목록에 username, 역할 배지, 합류일 표시
- [x] MANAGER에게만 멤버 제거 버튼 노출 (본인 제거 버튼 미노출)
- [x] 멤버 제거 확인 모달 구현
- [x] 멤버 제거 성공 시 멤버 목록 자동 갱신

**참조 규칙**: FR-I06

---

### FE-20. 지출 API 클라이언트 및 useExpenses 훅 구현
> 복잡도: `M` | 의존성: FE-03, FE-04

**완료 조건**
- [x] expenseApi.ts에 getExpenses, createExpense, updateExpense, deleteExpense 함수 구현
- [x] 필터 파라미터(날짜 범위, 카테고리 ID) 쿼리스트링 변환 처리
- [x] useExpenses 훅에서 필터 상태 관리 및 데이터 제공
- [x] 생성/수정/삭제 뮤테이션 성공 시 지출 목록 쿼리 자동 무효화

**참조 규칙**: FR-E01, FR-E05, FR-E06, FR-E08

---

### FE-21. 지출 목록 페이지 및 필터 UI 구현
> 복잡도: `M` | 의존성: FE-07, FE-20

**완료 조건**
- [x] 지출 목록 카드에 금액(KRW 포맷), 카테고리, 날짜(KST), 결제자, 설명 표시
- [x] 날짜 범위 필터 및 카테고리 드롭다운 필터 구현
- [x] 본인 입력 또는 MANAGER인 경우 수정/삭제 버튼 노출
- [x] 지출이 없는 경우 empty state UI 표시

**참조 규칙**: FR-E05, FR-E06, FR-E08

---

### FE-22. 지출 입력/수정 폼 구현 (균등/개별 분담)
> 복잡도: `L` | 의존성: FE-05, FE-07, FE-20

**완료 조건**
- [x] EQUAL/CUSTOM 분담 방식 전환 시 입력 UI 동적 변경
- [x] EQUAL 선택 시 splitCalculator를 사용한 실시간 분담금 미리보기
- [x] CUSTOM 선택 시 멤버별 금액 입력 및 합산 자동 계산
- [x] CUSTOM 합산과 총액 불일치 시 실시간 오류 표시
- [x] 결제자가 참여자에서 제외될 수 없도록 UI 강제
- [x] 지출 수정 시 기존 데이터 폼에 프리필

**참조 규칙**: FR-E01, FR-E02, FR-E03, FR-E04, BR-05, BR-06, DR-04

---

### FE-23. 카테고리 API 클라이언트 및 카테고리 관리 화면 구현  ← 화면·라우트는 구현되었으나 그룹 화면에서 이동하는 링크가 없음 (URL 직접 진입)
> 복잡도: `M` | 의존성: FE-07, FE-03, FE-04

**완료 조건**
- [x] categoryApi.ts에 getCategories, addGroupCategory, deleteGroupCategory 함수 구현
- [x] 카테고리 목록에서 SYSTEM/GROUP 카테고리 구분 표시
- [x] SYSTEM 카테고리에 수정/삭제 버튼 미노출
- [x] GROUP 카테고리 삭제 확인 모달에 재분류 안내 문구 포함
- [x] 카테고리 추가/삭제 성공 시 목록 자동 갱신

**참조 규칙**: FR-C01, FR-C02, FR-C03, FR-C04, BR-10, BR-11

---

### FE-24. 정산 API 클라이언트 및 useSettlement 훅 구현
> 복잡도: `M` | 의존성: FE-03, FE-04

**완료 조건**
- [x] settlementApi.ts에 createSettlement, getSettlements, getSettlementDetail 함수 구현
- [x] useSettlement 훅에서 정산 실행 뮤테이션 및 목록 데이터 제공
- [x] 정산 실행 성공 시 정산 목록 쿼리 자동 무효화
- [x] 403(MANAGER 권한 없음) 에러를 안내 메시지로 변환

**참조 규칙**: FR-S01, FR-S02, FR-S04, FR-S05, FR-S06

---

### FE-25. 정산 실행 화면 구현
> 복잡도: `S` | 의존성: FE-07, FE-24

**완료 조건**
- [x] 정산 기간 날짜 입력 UI 구현
- [x] 종료일 < 시작일 조건의 클라이언트 사이드 검증
- [x] MANAGER 역할이 아닌 사용자에게 정산 실행 버튼 미노출
- [x] 정산 실행 중 로딩 상태 및 중복 제출 방지
- [x] 정산 성공 후 정산 결과 영역으로 스크롤 (별도 화면 이동 없음)

**참조 규칙**: FR-S01, FR-S06

---

### FE-26. 정산 결과 조회 및 정산 목록 화면 구현
> 복잡도: `M` | 의존성: FE-07, FE-24

**완료 조건**
- [x] 정산 목록에 기간, 실행일 표시 (총 지출 금액은 표시하지 않음)
- [x] 정산 상세에서 멤버별 결제액/분담액/차액을 표 형태로 표시
- [x] 차액 양수/음수를 색상(접근성 대비 고려) 및 텍스트('받을 금액'/'낼 금액')로 구분
- [x] 정산 내역이 없는 경우 '아직 정산 내역이 없습니다' 빈 상태 표시
- [x] 재정산 시 이전 정산과 신규 정산이 목록에 함께 표시

**참조 규칙**: FR-S02, FR-S04, FR-S05

---

### FE-27. 메시지 API 클라이언트 및 메시지 목록 페이지 구현
> 복잡도: `S` | 의존성: FE-07, FE-03, FE-04

**완료 조건**
- [x] messageApi.ts에 getMessages 함수 구현
- [x] 메시지 목록에서 각 메시지의 내용(정산 완료 안내), 정산 기간, 정산일 표시 (그룹명·차액은 표시하지 않음)
- [x] 차액 양수/음수를 텍스트로 명확히 구분
- [x] 메시지가 없는 경우 empty state UI 표시
- [x] 헤더에 읽지 않은 메시지 배지(count) 표시

**참조 규칙**: FR-M01, FR-M02, FR-M03

---

### FE-28. 리포트 — 파이 차트 화면 구현
> 복잡도: `M` | 의존성: FE-07, FE-03, FE-04

**완료 조건**
- [x] 카테고리별 파이 차트와 멤버별 파이 차트 각각 구현
- [x] 기간(시작일/종료일) 선택 후 차트 데이터 조회
- [x] 차트에 색상 외 텍스트 레이블로 카테고리/멤버명과 금액 표시 (접근성)
- [x] 데이터 로딩/에러/빈 상태 처리
- [x] 차트 컴포넌트에 aria-label 및 데이터 테이블 대체 수단 제공

**참조 규칙**: FR-R01, FR-R02

---

### FE-29. 엑셀 내보내기 기능 구현
> 복잡도: `M` | 의존성: FE-21, FE-26

**완료 조건**
- [x] 지출 내역 엑셀 파일에 날짜, 카테고리, 금액, 결제자, 설명 컬럼 포함
- [x] 정산 금액 엑셀 파일에 멤버별 결제액, 분담액, 차액 컬럼 포함
- [x] 다운로드 중 로딩 상태 표시
- [x] 지출 엑셀 파일명에 그룹명과 날짜 범위 포함 (정산 엑셀은 정산결과_{settlementId}.xlsx)

**참조 규칙**: FR-R03, FR-R04

---

### FE-30. 전역 에러 처리 및 접근성 기반 공통 피드백 UI
> 복잡도: `M` | 의존성: FE-06

**완료 조건**
- [x] errorCode를 한국어 메시지로 변환하는 매핑 구현
- [x] 전역 토스트 컴포넌트 구현 및 App.tsx에 등록
- [x] aria-live='polite' 영역에서 성공/에러 메시지를 스크린 리더에 전달
- [x] 네트워크 오류(5xx, 네트워크 단절) 시 일반 오류 메시지 표시
- [x] API 요청 중 페이지 수준 및 버튼 수준 로딩 인디케이터 일관성 확보

---

## 6. 구현 순서 및 의존성 맵

### Phase 1 — 기반 (병렬 가능)
```
DB-01 → DB-02 → DB-03(refresh_tokens)
BE-01 → BE-02, BE-03, BE-05
FE-01 → FE-02, FE-03, FE-04, FE-05, FE-06
```

### Phase 2 — 스키마 및 인프라 (병렬 가능)
```
DB-04 → DB-05, DB-08        (그룹, 카테고리, 초대)
DB-04 → DB-06 → DB-07       (지출, 정산)
DB-09, DB-10                (인덱스, 시드)
BE-06 → BE-07 → BE-08, BE-09
FE-07 → FE-08               (레이아웃, 인증 훅)
```

### Phase 3 — 핵심 기능 (순차)
```
DB-17, DB-18, DB-19         (배치/함수)
BE-10 → BE-11 → BE-12 → BE-13  (인증 전체)
BE-14 → BE-15               (그룹)
BE-16 → BE-17               (초대/멤버)
FE-09, FE-10, FE-11         (인증 화면)
FE-12 → FE-13, FE-14, FE-15  (그룹 화면)
FE-16 → FE-17, FE-18, FE-19  (초대/멤버 화면)
```

### Phase 4 — 비즈니스 로직 (순차)
```
BE-18 → BE-19 → BE-20 → BE-21  (카테고리, 지출)
BE-22 → BE-23, BE-24           (정산, 메시지)
BE-25, BE-26                    (리포트)
BE-27                           (배치)
FE-20 → FE-21 → FE-22          (지출)
FE-23                           (카테고리)
FE-24 → FE-25, FE-26           (정산)
FE-27, FE-28, FE-29, FE-30     (메시지, 리포트)
```

### Phase 5 — 품질 보증
```
BE-28, BE-29                (단위/통합 테스트)
DB-20                       (마이그레이션 체계)
```
