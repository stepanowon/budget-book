-- ============================================================
-- 공동 가계부 서비스 — Database Schema
-- Generated from: docs/6-erd.md v1.1
-- Created: 2026-06-18
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid() 지원


-- ============================================================
-- 2. TYPE DEFINITIONS
-- ============================================================

-- 사용자 계정 상태: 탈퇴 시 inactive 전환 (BR-12, 물리 삭제 없음)
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 그룹 운영 타입: 기간 한정(LIMITED) vs 상시(UNLIMITED) (BR-02)
DO $$ BEGIN
    CREATE TYPE group_type AS ENUM ('LIMITED', 'UNLIMITED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 그룹 활성 상태: 활성 멤버 없으면 inactive 자동 전환 (BR-14)
DO $$ BEGIN
    CREATE TYPE group_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 그룹 멤버 역할: MANAGER는 초대·정산 등 관리 권한 보유 (3.1절)
DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('MANAGER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 초대 라이프사이클: PENDING → ACCEPTED | DECLINED | EXPIRED (3.5절)
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 카테고리 범위: SYSTEM(전체 공통) vs GROUP(그룹 전용) (BR-10, BR-11)
DO $$ BEGIN
    CREATE TYPE category_scope AS ENUM ('SYSTEM', 'GROUP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 지출 분담 방식: EQUAL(균등) vs CUSTOM(개별 입력) (BR-05, BR-06, DR-04)
DO $$ BEGIN
    CREATE TYPE split_type AS ENUM ('EQUAL', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 3. TABLE DEFINITIONS
-- ============================================================

-- ── users ──────────────────────────────────────────────────
-- 서비스 가입 사용자. 물리 삭제 없이 status='inactive'로 탈퇴 처리 (BR-12).
-- username은 서비스 전체에서 고유하며 멤버 초대 시 검색 기준으로 사용 (DR-01).
CREATE TABLE IF NOT EXISTS users (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    username      VARCHAR(20)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt 해시, cost factor >= 12 (NFR-SEC07)
    status        user_status  NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT chk_users_username_format
        CHECK (username ~ '^[a-z0-9_]{3,20}$') -- 3~20자, 영문 소문자·숫자·밑줄만 (DR-01)
);

-- ── groups ─────────────────────────────────────────────────
-- 공동 지출 관리 단위. LIMITED(기간 한정)와 UNLIMITED(상시) 두 타입 지원 (BR-02).
-- 그룹도 소프트 삭제(status='inactive')만 사용하며 물리 삭제 없음.
CREATE TABLE IF NOT EXISTS groups (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  NOT NULL,
    type        group_type   NOT NULL,
    start_date  DATE         NOT NULL,
    end_date    DATE,                  -- NULL 허용: UNLIMITED이면 null, LIMITED이면 필수 (DR-03)
    created_by  UUID         NOT NULL,
    status      group_status NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_groups PRIMARY KEY (id),
    CONSTRAINT fk_groups_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_groups_name_length
        CHECK (char_length(name) >= 1),
    -- DR-03: LIMITED 타입이면 end_date가 반드시 존재하고 start_date 이후여야 함.
    -- UNLIMITED이면 end_date는 무조건 null을 허용하므로 조건부 CHECK로 강제.
    CONSTRAINT chk_limited_end_date
        CHECK (type <> 'LIMITED' OR (end_date IS NOT NULL AND end_date >= start_date))
);

-- ── group_members ───────────────────────────────────────────
-- 그룹 내 사용자 소속 및 역할 정보. (group_id, user_id) 복합 유니크로 중복 가입 방지 (DR-02).
-- joined_at은 MANAGER 권한 이양 시 최선임 MEMBER 판별 기준으로 사용 (BR-13).
CREATE TABLE IF NOT EXISTS group_members (
    id        UUID        NOT NULL DEFAULT gen_random_uuid(),
    group_id  UUID        NOT NULL,
    user_id   UUID        NOT NULL,
    role      member_role NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_group_members PRIMARY KEY (id),
    CONSTRAINT fk_group_members_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE RESTRICT,
    CONSTRAINT fk_group_members_user
        FOREIGN KEY (user_id)  REFERENCES users  (id) ON DELETE RESTRICT,
    CONSTRAINT uq_group_members_group_user
        UNIQUE (group_id, user_id) -- DR-02: 동일 그룹에 동일 사용자 중복 소속 불가
);

-- ── invitations ─────────────────────────────────────────────
-- 그룹 멤버 초대 라이프사이클 관리. MANAGER만 발송 가능하며 유효기간 7일 (BR-03, FR-I02).
-- 상태 전이: PENDING → ACCEPTED | DECLINED | EXPIRED (단방향, 최종 상태 불변).
CREATE TABLE IF NOT EXISTS invitations (
    id                UUID              NOT NULL DEFAULT gen_random_uuid(),
    group_id          UUID              NOT NULL,
    inviter_id        UUID              NOT NULL,
    invitee_username  VARCHAR(20)       NOT NULL, -- 초대받는 사용자의 username (active 사용자여야 함)
    status            invitation_status NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
    expires_at        TIMESTAMPTZ       NOT NULL, -- created_at + 7일 (애플리케이션에서 계산하여 저장)
    responded_at      TIMESTAMPTZ,               -- NULL 허용: ACCEPTED·DECLINED 시에만 기록 (EXPIRED이면 null)

    CONSTRAINT pk_invitations PRIMARY KEY (id),
    CONSTRAINT fk_invitations_group
        FOREIGN KEY (group_id)   REFERENCES groups (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invitations_inviter
        FOREIGN KEY (inviter_id) REFERENCES users  (id) ON DELETE RESTRICT,
    CONSTRAINT chk_invitations_expires_after_created
        CHECK (expires_at > created_at)
);

-- ── categories ──────────────────────────────────────────────
-- 지출 분류 태그. SYSTEM(전체 공통, 수정·삭제 불가)과 GROUP(그룹 전용) 두 가지 scope (BR-10).
-- GROUP 카테고리 삭제 전 애플리케이션이 해당 지출을 '기타'로 재분류 후 삭제 (BR-11).
CREATE TABLE IF NOT EXISTS categories (
    id       UUID           NOT NULL DEFAULT gen_random_uuid(),
    name     VARCHAR(20)    NOT NULL,
    scope    category_scope NOT NULL,
    group_id UUID,                   -- NULL 허용: SYSTEM이면 null, GROUP이면 필수

    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT fk_categories_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE RESTRICT,
    CONSTRAINT chk_categories_name_length
        CHECK (char_length(name) >= 1),
    -- GROUP 카테고리이면 group_id 필수, SYSTEM이면 group_id는 반드시 null
    CONSTRAINT chk_categories_scope_group_id
        CHECK (
            (scope = 'SYSTEM' AND group_id IS NULL) OR
            (scope = 'GROUP'  AND group_id IS NOT NULL)
        )
);

-- ── expenses ────────────────────────────────────────────────
-- 그룹 내 개별 지출 항목. paid_by(결제자)는 expense_splits에 항상 포함 (BR-06).
-- 정산 완료 후에도 수정·삭제 가능하나 기존 Settlement는 불변 (BR-15).
CREATE TABLE IF NOT EXISTS expenses (
    id           UUID       NOT NULL DEFAULT gen_random_uuid(),
    group_id     UUID       NOT NULL,
    paid_by      UUID       NOT NULL, -- 실제 지출한 사용자(결제자). expense_splits에 항상 포함 (BR-06)
    category_id  UUID       NOT NULL, -- 삭제 전 애플리케이션이 '기타' ID로 UPDATE 후 처리 (BR-11)
    total_amount INTEGER    NOT NULL,
    date         DATE       NOT NULL, -- 지출 발생일 (KST 기준)
    description  VARCHAR(200),        -- NULL 허용: 선택 입력 항목 (최대 200자)
    split_type   split_type NOT NULL,
    created_by   UUID       NOT NULL, -- 지출을 입력한 사용자
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_expenses PRIMARY KEY (id),
    CONSTRAINT fk_expenses_group
        FOREIGN KEY (group_id)    REFERENCES groups      (id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_paid_by
        FOREIGN KEY (paid_by)     REFERENCES users       (id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id) REFERENCES categories  (id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_created_by
        FOREIGN KEY (created_by)  REFERENCES users       (id) ON DELETE RESTRICT,
    CONSTRAINT chk_expenses_total_amount
        CHECK (total_amount >= 1 AND total_amount <= 999999999) -- KRW 범위: 1원 이상 999,999,999원 이하
);

-- ── expense_splits ──────────────────────────────────────────
-- 지출 항목에 대한 참여 멤버별 분담금. 멤버당 1개 레코드 보장 (DR-02 유추, UNIQUE).
-- 지출 삭제 시 CASCADE로 함께 삭제 (논리적으로 지출의 하위 데이터).
CREATE TABLE IF NOT EXISTS expense_splits (
    id         UUID    NOT NULL DEFAULT gen_random_uuid(),
    expense_id UUID    NOT NULL,
    user_id    UUID    NOT NULL,
    amount     INTEGER NOT NULL, -- 해당 멤버의 분담금 (KRW). EQUAL 나머지는 paid_by 귀속 (BR-05)

    CONSTRAINT pk_expense_splits PRIMARY KEY (id),
    CONSTRAINT fk_expense_splits_expense
        FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE, -- 지출 삭제 시 분담금도 함께 삭제
    CONSTRAINT fk_expense_splits_user
        FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE RESTRICT,
    CONSTRAINT uq_expense_splits_expense_user
        UNIQUE (expense_id, user_id), -- 동일 지출에서 멤버당 1개의 분담 레코드만 허용
    CONSTRAINT chk_expense_splits_amount
        CHECK (amount >= 0) -- 0원 분담 허용 (CUSTOM에서 특정 멤버 0원 가능)
);

-- ── settlements ─────────────────────────────────────────────
-- 특정 기간 그룹 지출의 집계 정산 결과. 생성 즉시 완료 상태 (status 컬럼 없음).
-- 재정산은 새 레코드 생성으로 처리하며 기존 레코드는 불변 (BR-15, FR-S04).
CREATE TABLE IF NOT EXISTS settlements (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    group_id     UUID        NOT NULL,
    period_start DATE        NOT NULL,
    period_end   DATE        NOT NULL, -- DR-05: period_start <= period_end 필수
    created_by   UUID        NOT NULL, -- 정산 실행자 (MANAGER만 가능, BR-07)
    settled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_settlements PRIMARY KEY (id),
    CONSTRAINT fk_settlements_group
        FOREIGN KEY (group_id)   REFERENCES groups (id) ON DELETE RESTRICT,
    CONSTRAINT fk_settlements_created_by
        FOREIGN KEY (created_by) REFERENCES users  (id) ON DELETE RESTRICT,
    CONSTRAINT chk_settlements_period
        CHECK (period_start <= period_end) -- DR-05: 정산 기간 유효성
);

-- ── settlement_details ──────────────────────────────────────
-- 정산 결과에서 멤버별 집계 금액. balance는 자동 계산 컬럼으로 불일치 원천 차단 (DR-06).
-- 정산 결과 불변 원칙(BR-15)으로 settlement_id FK는 RESTRICT 적용.
CREATE TABLE IF NOT EXISTS settlement_details (
    id            UUID    NOT NULL DEFAULT gen_random_uuid(),
    settlement_id UUID    NOT NULL,
    user_id       UUID    NOT NULL,
    total_paid    INTEGER NOT NULL, -- 결제자로서의 total_amount 합계 (0원 이상)
    total_share   INTEGER NOT NULL, -- expense_splits.amount 합계 (0원 이상)
    -- DR-06: balance = total_paid - total_share. GENERATED COLUMN으로 DB에서 자동 계산하여 불일치 원천 차단.
    balance       INTEGER NOT NULL GENERATED ALWAYS AS (total_paid - total_share) STORED,

    CONSTRAINT pk_settlement_details PRIMARY KEY (id),
    CONSTRAINT fk_settlement_details_settlement
        FOREIGN KEY (settlement_id) REFERENCES settlements (id) ON DELETE RESTRICT, -- 정산 결과 불변, CASCADE 금지
    CONSTRAINT fk_settlement_details_user
        FOREIGN KEY (user_id)       REFERENCES users       (id) ON DELETE RESTRICT,
    CONSTRAINT uq_settlement_details_settlement_user
        UNIQUE (settlement_id, user_id), -- 정산당 멤버 1개 레코드 보장
    CONSTRAINT chk_settlement_details_total_paid
        CHECK (total_paid >= 0),
    CONSTRAINT chk_settlement_details_total_share
        CHECK (total_share >= 0)
);

-- ── messages ────────────────────────────────────────────────
-- 정산 완료 시 그룹 전 멤버에게 자동 생성되는 인앱 메시지 (BR-08, BR-09).
-- 서비스 내 메시지는 정산 메시지만 허용하며 임의 발송 API는 미제공.
CREATE TABLE IF NOT EXISTS messages (
    id                 UUID        NOT NULL DEFAULT gen_random_uuid(),
    settlement_id      UUID        NOT NULL,
    recipient_user_id  UUID        NOT NULL,
    content            TEXT        NOT NULL, -- 개인화된 정산 내역 요약 본문 (FR-M01)
    sent_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_messages PRIMARY KEY (id),
    CONSTRAINT fk_messages_settlement
        FOREIGN KEY (settlement_id)     REFERENCES settlements (id) ON DELETE RESTRICT, -- 정산 증거 기록, CASCADE 금지
    CONSTRAINT fk_messages_recipient
        FOREIGN KEY (recipient_user_id) REFERENCES users       (id) ON DELETE RESTRICT
);


-- ============================================================
-- 4. INDEXES
-- ============================================================

-- group_members: 그룹별 멤버 조회, 사용자별 소속 그룹 조회, MANAGER 권한 이양 시 최선임 판별 (BR-13)
CREATE INDEX IF NOT EXISTS idx_group_members_group_id  ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id   ON group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_joined_at ON group_members (joined_at); -- BR-13: 최선임 MEMBER 판별 기준

-- invitations: 그룹·상태 복합 조회(중복 초대 차단, FR-I05), 만료 배치 처리 (NFR-A04)
CREATE INDEX IF NOT EXISTS idx_invitations_group_id_status ON invitations (group_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at       ON invitations (expires_at); -- 만료 배치: 1시간 이내 EXPIRED 전환

-- expenses: 지출 목록 조회 및 정산 기간 집계 (NFR-P01: p95 <= 500ms)
CREATE INDEX IF NOT EXISTS idx_expenses_group_id_date ON expenses (group_id, date);

-- expense_splits: 지출별 분담 조회, 사용자별 분담 집계 (정산 집계 쿼리)
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits (expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id    ON expense_splits (user_id);

-- settlements: 그룹별 정산 내역 조회
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements (group_id);

-- settlement_details: 정산별 멤버 집계 조회, 사용자별 정산 내역 조회
CREATE INDEX IF NOT EXISTS idx_settlement_details_settlement_id ON settlement_details (settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_details_user_id       ON settlement_details (user_id);

-- messages: 수신자별 인앱 메시지 조회 (FR-M02: 본인 메시지만 조회 가능)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_user_id ON messages (recipient_user_id);


-- ============================================================
-- 5. SEED DATA — 시스템 카테고리 (scope = 'SYSTEM')
-- ============================================================

-- BR-10: SYSTEM 카테고리는 수정·삭제 불가. 모든 그룹에 공통 제공.
-- 순서는 docs/6-erd.md 2.5절 기준 (식비, 교통, 숙소, 쇼핑, 문화/여가, 의료, 기타).
INSERT INTO categories (id, name, scope, group_id) VALUES
    (gen_random_uuid(), '식비',     'SYSTEM', NULL),
    (gen_random_uuid(), '교통',     'SYSTEM', NULL),
    (gen_random_uuid(), '숙소',     'SYSTEM', NULL),
    (gen_random_uuid(), '쇼핑',     'SYSTEM', NULL),
    (gen_random_uuid(), '문화/여가', 'SYSTEM', NULL),
    (gen_random_uuid(), '의료',     'SYSTEM', NULL),
    (gen_random_uuid(), '기타',     'SYSTEM', NULL)
ON CONFLICT DO NOTHING;
