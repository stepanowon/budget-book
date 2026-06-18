# 기술 아키텍처 다이어그램 — 공동 가계부 서비스

> 버전: 1.2  
> 작성일: 2026-06-18  
> 관련 문서: [1-domain-definition.md](1-domain-definition.md) · [2-prd.md](2-prd.md) · [3-user-scenario.md](3-user-scenario.md) · [4-project-principle.md](4-project-principle.md)

---

## 목차

1. [전체 시스템 아키텍처](#1-전체-시스템-아키텍처)
2. [엔티티 관계도 (ERD)](#2-엔티티-관계도-erd)
3. [인증 흐름](#3-인증-흐름)
4. [정산 실행 흐름](#4-정산-실행-흐름)
5. [초대 상태 전이](#5-초대-상태-전이)

---

## 1. 전체 시스템 아키텍처

클라이언트 요청이 프론트엔드 → 백엔드 REST API → Supabase 데이터베이스를 거쳐 처리되는 전체 흐름을 표현합니다.

> v1 범위: 영수증·사진 첨부 미지원(SC-02). 파일 스토리지는 Out-of-Scope.

```mermaid
flowchart TB
    Browser["🌐 Browser<br/>React + TS"]
    FE["Frontend Layer<br/>Components/Hooks"]
    API["Backend API<br/>Express"]
    Middleware["Auth/Role<br/>Middleware"]
    Service["Service Layer<br/>Business Logic"]
    DBPool["DB Connection Pool<br/>postgres.js (max 10)"]
    DB["PostgreSQL<br/>Supabase"]
    Swagger["Swagger UI<br/>/api-docs"]

    Browser -->|HTTP/REST| FE
    FE -->|JWT + JSON| API
    API --> Middleware
    Middleware -->|Validated Request| Service
    Service -->|SQL Query| DBPool
    DBPool -->|Direct Connection| DB
    DB -->|Result| DBPool
    DBPool -->|Result| Service
    Service -->|JSON Response| API
    API -->|JSON| FE
    FE -->|Render UI| Browser
    API -.->|OpenAPI 3.0| Swagger
    Browser -.->|Documentation| Swagger
```

---

## 2. 엔티티 관계도 (ERD)

10개 도메인 엔티티와 그 간 관계를 PK/FK 기준으로 표현합니다. 카디널리티는 |o, ||, o{, }o 기호로 표시합니다.

```mermaid
erDiagram
    USER {
        uuid id PK
        string username UK
        string email
        string status
    }
    
    GROUP {
        uuid id PK
        string name
        string type
        date start_date
        uuid created_by FK
        string status
    }
    
    GROUP_MEMBER {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        string role
    }
    
    INVITATION {
        uuid id PK
        uuid group_id FK
        uuid inviter_id FK
        uuid invitee_id FK
        string status
    }
    
    CATEGORY {
        uuid id PK
        string name
        string scope
        uuid group_id FK "nullable"
    }
    
    EXPENSE {
        uuid id PK
        uuid group_id FK
        uuid paid_by FK
        uuid category_id FK
        integer total_amount
        date date
        string split_type
    }
    
    EXPENSE_SPLIT {
        uuid id PK
        uuid expense_id FK
        uuid user_id FK
        integer amount
    }
    
    SETTLEMENT {
        uuid id PK
        uuid group_id FK
        date period_start
        date period_end
        uuid created_by FK
    }
    
    SETTLEMENT_DETAIL {
        uuid id PK
        uuid settlement_id FK
        uuid user_id FK
        integer total_paid
        integer total_share
        integer balance
    }
    
    MESSAGE {
        uuid id PK
        uuid settlement_id FK
        uuid recipient_user_id FK
        string content
    }

    USER ||--o{ GROUP : "creates"
    USER ||--o{ GROUP_MEMBER : "belongs_to"
    GROUP ||--o{ GROUP_MEMBER : "has"
    GROUP ||--o{ INVITATION : "receives"
    USER ||--o{ INVITATION : "sends"
    GROUP ||--o{ CATEGORY : "has"
    GROUP ||--o{ EXPENSE : "tracks"
    USER ||--o{ EXPENSE : "pays"
    EXPENSE ||--o{ EXPENSE_SPLIT : "splits_into"
    USER ||--o{ EXPENSE_SPLIT : "participates_in"
    GROUP ||--o{ SETTLEMENT : "settles"
    USER ||--o{ SETTLEMENT : "executes"
    SETTLEMENT ||--o{ SETTLEMENT_DETAIL : "contains"
    USER ||--o{ SETTLEMENT_DETAIL : "appears_in"
    SETTLEMENT ||--o{ MESSAGE : "triggers"
    USER ||--o{ MESSAGE : "receives"
```

---

## 3. 인증 흐름

로그인 시 Access Token과 Refresh Token 발급, API 요청 시 토큰 검증, 만료 시 갱신, 탈퇴 시 토큰 무효화 흐름을 표현합니다.

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant Backend as 🔐 Backend
    participant DB as 💾 DB

    Note over Browser,DB: 1️⃣ 로그인 요청
    Browser->>Backend: POST /auth/login (email, password)
    Backend->>DB: SELECT * FROM users WHERE email = ?
    DB-->>Backend: User 레코드
    Backend->>Backend: bcrypt.compare(password, hash)
    Backend-->>Browser: AccessToken (1시간) + RefreshToken (30일, httpOnly 쿠키)
    Browser->>Browser: AccessToken → React 상태(메모리) 저장
    Note over Browser: AccessToken: 메모리(React 상태)<br/>RefreshToken: httpOnly 쿠키<br/>localStorage 저장 금지(XSS 취약)

    Note over Browser,DB: 2️⃣ API 요청 (Access Token 유효)
    Browser->>Backend: GET /api/v1/groups (Authorization: Bearer {accessToken})
    Backend->>Backend: JWT 서명 검증 + 만료 확인
    Backend->>DB: SELECT * FROM groups WHERE user_id = ?
    DB-->>Backend: Groups 리스트
    Backend-->>Browser: 200 OK + Groups JSON

    Note over Browser,DB: 3️⃣ Access Token 만료 → 갱신
    Browser->>Backend: POST /auth/refresh (RefreshToken in cookie)
    Backend->>DB: SELECT * FROM refresh_tokens WHERE token = ?
    DB-->>Backend: 유효한 토큰 레코드
    Backend-->>Browser: 새 AccessToken (1시간)
    Browser->>Browser: 새 AccessToken 업데이트

    Note over Browser,DB: 4️⃣ 사용자 탈퇴 → 세션 무효화
    Browser->>Backend: POST /users/withdraw
    Backend->>DB: UPDATE users SET status = 'inactive' WHERE id = ?
    Backend->>DB: DELETE FROM refresh_tokens WHERE user_id = ?
    Backend-->>Browser: 204 No Content
    Browser->>Browser: 메모리 내 AccessToken 폐기 + Refresh 쿠키 삭제
    Note over Browser: 모든 API 요청 차단<br/>(inactive 상태 + 토큰 무효)
```

---

## 4. 정산 실행 흐름

MANAGER가 정산을 실행하면, 기간 내 지출을 집계하여 Settlement/SettlementDetail 생성, 메시지 발송, 재정산 시 새 레코드 생성 흐름을 표현합니다.

```mermaid
sequenceDiagram
    participant Manager as 👨‍💼 MANAGER
    participant Backend as 🔐 Backend
    participant DB as 💾 DB

    Note over Manager,DB: 1️⃣ 정산 실행 요청
    Manager->>Backend: POST /groups/{id}/settlements<br/>(period_start, period_end)
    Backend->>Backend: MANAGER role 검증
    Backend->>Backend: 기간 유효성 검증
    Backend->>DB: SELECT * FROM expenses<br/>WHERE group_id = ? AND date BETWEEN ? AND ?
    DB-->>Backend: 기간 내 모든 지출
    Backend->>DB: SELECT * FROM expense_splits<br/>WHERE expense_id IN (...)
    DB-->>Backend: 모든 분담 기록
    Backend->>Backend: 멤버별 집계 로직<br/>(total_paid, total_share, balance)
    Backend->>DB: INSERT INTO settlements<br/>(group_id, period_start, period_end, created_by, settled_at)
    DB-->>Backend: Settlement 생성 (id = settlement_1)
    Backend->>DB: INSERT INTO settlement_details (N명 분)<br/>VALUES (settlement_1, user_1, ...), ...
    DB-->>Backend: SettlementDetail 생성 완료
    Backend->>DB: INSERT INTO messages (N명 분)<br/>VALUES (settlement_1, user_1, ...), ...
    DB-->>Backend: Message 생성 완료
    Backend-->>Manager: 200 OK + Settlement JSON

    Note over Manager,DB: 2️⃣ 정산 기간 지출 수정 → Settlement 불변
    Manager->>Backend: PATCH /expenses/{id} (total_amount = 50000)
    Backend->>Backend: 지출 수정 진행
    Backend->>DB: UPDATE expenses SET total_amount = 50000
    Note over Backend: Settlement_1은 변경 없음<br/>(정산 결과 스냅샷 보존)

    Note over Manager,DB: 3️⃣ 재정산 → 새 Settlement 생성
    Manager->>Backend: POST /groups/{id}/settlements<br/>(period_start, period_end)
    Backend->>DB: SELECT * FROM expenses (수정된 데이터 기준)
    DB-->>Backend: 최신 지출 데이터
    Backend->>DB: INSERT INTO settlements (새 레코드)<br/>VALUES (settlement_2, ...)
    DB-->>Backend: Settlement 생성 (id = settlement_2)
    Backend->>DB: INSERT INTO settlement_details (settlement_2, ...)
    Backend->>DB: INSERT INTO messages (settlement_2, ...)
    DB-->>Backend: 메시지 전송 완료
    Backend-->>Manager: 200 OK + Settlement_2 JSON
    Note over Backend: Settlement_1은 그대로 유지됨<br/>Settlement_2와 독립적으로 존재
```

---

## 5. 초대 상태 전이

사용자 초대의 라이프사이클: PENDING → ACCEPTED/DECLINED/EXPIRED 상태 전이를 표현합니다.

```mermaid
stateDiagram-v2
    [*] --> PENDING: MANAGER가 초대 발송<br/>(expires_at = now + 7일)

    PENDING --> ACCEPTED: 초대받은 사용자<br/>수락 응답<br/>→ GroupMember 생성
    PENDING --> DECLINED: 초대받은 사용자<br/>거절 응답

    PENDING --> EXPIRED: 배치 작업<br/>(1시간 이내)<br/>expires_at 경과

    ACCEPTED --> [*]
    DECLINED --> [*]
    EXPIRED --> [*]

    note right of PENDING
        유효 기간: 7일
        상태 활성: true
    end note

    note right of ACCEPTED
        GroupMember.role = MEMBER
        사용자가 그룹에 가입
    end note

    note right of EXPIRED
        배치 처리로 자동 전환
        유효 기간 초과
    end note
```

---

## 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.2 | 2026-06-18 | (1) 시스템 아키텍처: DB 접근 방식을 @supabase/supabase-js(Supabase REST API) → postgres.js 직접 연결로 변경. DB Connection Pool(max 10) 노드 추가, SQL Query 흐름 명시. (2) ERD: Invitation.invitee_username → invitee_id(UUID FK → User.id) 변경. (3) Swagger UI 엔드포인트(/api-docs) 및 OpenAPI 3.0 흐름 아키텍처에 추가. | stepanowon |
| 1.1 | 2026-06-18 | (1) 시스템 아키텍처에서 Supabase Storage 노드 및 Upload/Download 흐름 제거 (SC-02 Out-of-Scope 반영). (2) 인증 흐름에서 AccessToken 저장 방식을 localStorage → React 상태(메모리)로 수정 (XSS 취약성 방지, 4-project-principle 보안 원칙 일치). (3) Backend 명칭 Express.js → Express 통일. | stepanowon |
| 1.0 | 2026-06-18 | 최초 작성: 전체 시스템 아키텍처, ERD, 인증 흐름, 정산 실행 흐름, 초대 상태 전이 | stepanowon |
