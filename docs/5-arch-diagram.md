# 기술 아키텍처 다이어그램 — 공동 가계부 서비스

**버전:** 1.0  
**작성일:** 2026-06-18  
**참조 문서:** `docs/1-domain-definition.md`, `docs/2-prd.md`, `docs/4-project-principle.md`

---

## 1. 시스템 전체 구성

```mermaid
graph TB
    subgraph Client["클라이언트"]
        Browser["브라우저\nReact + TypeScript"]
    end

    subgraph Server["백엔드 서버"]
        API["Node.js + Express\nREST API"]
        Batch["배치 작업\nnode-cron"]
    end

    subgraph Supabase["Supabase (BaaS)"]
        DB["PostgreSQL\n(데이터 저장)"]
        Storage["Supabase Storage\n(파일 첨부 · 2차 개발)"]
    end

    Browser -- "HTTPS / REST" --> API
    API -- "supabaseAdmin" --> DB
    API -- "파일 업로드" --> Storage
    Batch -- "월별 정산 자동 실행\n초대 만료 처리" --> API
```

---

## 2. 프론트엔드 레이어

```mermaid
graph TB
    Pages["Pages\n화면 조립 · 라우팅"]
    Features["Features\n도메인별 컴포넌트 · 훅"]
    Hooks["Custom Hooks\nReact Query · Zustand"]
    Services["Services\nAPI 호출 함수"]
    HTTP["axios 인스턴스\n인터셉터 (토큰 자동 갱신)"]

    Pages --> Features
    Features --> Hooks
    Hooks --> Services
    Services --> HTTP
```

> 컴포넌트는 훅을 경유하여 서비스를 호출한다. 서비스를 직접 호출하지 않는다.

---

## 3. 백엔드 레이어

```mermaid
graph TB
    Router["Router\n엔드포인트 정의 · 미들웨어 연결"]
    MW["Middleware\nJWT 인증 · 그룹 멤버십 인가 · 요청 유효성 검사"]
    Controller["Controller\nreq 파싱 → Service 호출 → res 반환"]
    Service["Service\n비즈니스 로직 · 도메인 규칙 검증"]
    Repository["Repository\nSupabase 쿼리 (DB 접근 유일 위치)"]
    DB[("Supabase PostgreSQL")]

    Router --> MW
    MW --> Controller
    Controller --> Service
    Service --> Repository
    Repository --> DB
```

---

## 4. 인증 흐름

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant API as 백엔드 API
    participant DB as Supabase DB

    C->>API: POST /api/auth/login
    API->>DB: 사용자 조회 · 비밀번호 검증
    DB-->>API: 사용자 정보
    API-->>C: Access Token (1h) + Refresh Token (30d, HttpOnly 쿠키)

    Note over C,API: Access Token 만료 시
    C->>API: 임의 API 호출 → 401 응답
    C->>API: POST /api/auth/refresh (Refresh Token)
    API-->>C: 새 Access Token
```

---

## 5. 도메인 엔티티 관계

```mermaid
erDiagram
    User ||--o{ GroupMember : "소속"
    Group ||--o{ GroupMember : "구성"
    Group ||--o{ Expense : "포함"
    Group ||--o{ Settlement : "정산"
    Group ||--o{ GroupInvitation : "초대"
    GroupMember ||--o{ Expense : "결제·입력"
    GroupMember ||--o{ ExpenseParticipant : "참여"
    Expense ||--o{ ExpenseParticipant : "분담"
    Settlement ||--o{ SettlementItem : "내역"
    GroupMember ||--o{ SettlementItem : "송금"
    User ||--o{ Notification : "수신"
```

---

## 6. 배치 작업 스케줄

```mermaid
graph LR
    Cron["node-cron"]

    Cron -- "매월 1일 00:00 KST" --> MonthlyJob["자동 정산 생성\n(상시 그룹 전월 지출 집계)"]
    Cron -- "매일 00:00 KST" --> ArchiveJob["기간 한정 그룹\n자동 ARCHIVED 처리"]
    Cron -- "매일 주기적 실행" --> ExpireJob["만료 초대 처리\n(PENDING → EXPIRED)"]

    MonthlyJob -- "실패 시" --> FailNotify["관리자에게\nBATCH_FAILURE 알림"]
```
