# 도메인 정의서 — 공동 가계부 서비스

> 버전: 1.4  
> 작성일: 2026-06-18  
> 관련 문서: [2-prd.md](2-prd.md) · [3-user-scenario.md](3-user-scenario.md) · [4-project-principle.md](4-project-principle.md) · [5-arch-diagram.md](5-arch-diagram.md)

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [공통 정책](#2-공통-정책)
3. [도메인 개념 및 용어 정의](#3-도메인-개념-및-용어-정의)
4. [도메인 규칙](#4-도메인-규칙)
5. [입력 검증 규칙](#5-입력-검증-규칙)
6. [추적 매트릭스](#6-추적-매트릭스)
7. [기술 제약](#7-기술-제약)
8. [기능 경계](#8-기능-경계)
9. [변경 이력](#9-변경-이력)

---

## 1. 서비스 개요

여러 명이 함께 지출을 기록하고 정산하는 **그룹 기반 공동 가계부 웹 서비스**다.  
가족, 친구, 여행 동행 등 다양한 그룹 형태를 지원하며, 지출 기록과 수동 정산을 핵심 기능으로 제공한다.

**용어 정의**

| 용어 | 정의 |
|------|------|
| 활성 멤버 | `User.status = active`이며 해당 그룹의 `GroupMember` 레코드가 존재하는 사용자 |
| 결제자 | 지출 시 실제 금액을 지불한 사용자 (`Expense.paid_by`) |
| 분담금 | 한 멤버가 특정 지출에 대해 부담해야 할 금액 (`ExpenseSplit.amount`) |

---

## 2. 공통 정책

> 아래 정책은 서비스 전체에 적용되는 단일 출처(SSOT)다.  
> 엔티티 속성 표와 입력 검증 규칙(섹션 5)에서 동일 값이 필요한 경우 이 섹션을 참조한다.

### 2.1 인증 정책

| 항목 | 정책 |
|------|------|
| 로그인 방식 | 이메일 + 비밀번호 |
| 이메일 검증 | 가입 시 인증 메일 발송, 검증 완료 전 서비스 이용 불가 |
| 비밀번호 규칙 | 8자 이상, 영문·숫자·특수문자 각 1자 이상 포함 |
| 세션 방식 | JWT (Access Token + Refresh Token) |
| Access Token 만료 | 1시간 |
| Refresh Token 만료 | 30일 (갱신 시 초기화) |

### 2.2 화폐·금액 정책

| 항목 | 정책 |
|------|------|
| 지원 통화 | 단일 통화 (KRW, 원화) |
| 금액 단위 | 정수 (원 단위), 소수점 없음 |
| 금액 범위 | 1원 이상 999,999,999원 이하 |
| 반올림 정책 | 균등 분배 시 나머지 금액은 결제자(`paid_by`)에게 귀속 |

**균등 분배 예시**

| 총액 | 참여 멤버 수 | 1인당 금액 | 나머지 | 결제자 몫 |
|------|------------|-----------|--------|----------|
| 10,000원 | 3명 | 3,333원 | 1원 | 3,334원 |
| 10,000원 | 4명 | 2,500원 | 0원 | 2,500원 |
| 7,000원 | 3명 | 2,333원 | 1원 | 2,334원 |

### 2.3 시간대 정책

| 항목 | 정책 |
|------|------|
| 서버 저장 기준 | UTC |
| UI 표시 기준 | KST (UTC+9) 고정 |
| 지출 `date` 의미 | 사용자가 입력한 KST 기준 날짜 (시각 없음, 날짜만) |
| 정산 기간 경계 | `period_start` 00:00:00 KST 이상, `period_end` 23:59:59 KST 이하 (양 끝 포함) |

### 2.4 에러 코드 규약

| HTTP 상태 | 의미 | 대표 케이스 |
|----------|------|------------|
| 400 | 잘못된 요청 형식 | JSON 파싱 실패, 필수 필드 누락 |
| 401 | 인증 실패 | 토큰 없음·만료, inactive 사용자 로그인 |
| 403 | 권한 없음 | MEMBER가 정산 실행, SYSTEM 카테고리 삭제 시도 |
| 404 | 리소스 없음 | 존재하지 않는 그룹·지출 조회 |
| 409 | 중복 충돌 | username 중복 가입, 이미 멤버인 사용자 초대 |
| 422 | 검증 실패 | 금액 범위 초과, `end_date < start_date` |

---

## 3. 도메인 개념 및 용어 정의

### 3.1 User (사용자)

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `username` | string | 필수 | UNIQUE, 3~20자, 영문 소문자·숫자·밑줄만 허용 | 서비스 내 공개 식별자. 멤버 초대 시 사용 |
| `email` | string | 필수 | UNIQUE | 로그인용 이메일 |
| `status` | enum | 필수 | `active` \| `inactive` | 탈퇴 시 `inactive`, 물리 삭제 아님 |
| `created_at` | timestamp | 필수 | UTC | 가입 시각 |

**규칙**
- 한 사용자는 여러 그룹에 동시에 소속될 수 있다.
- 탈퇴(`inactive`) 사용자의 기존 지출 기록은 보존된다.
- `inactive` 사용자는 로그인 및 서비스 이용 불가.

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-U1 | DR-01 | 미사용 `username` | 회원가입 시도 | 가입 성공, `status = active` |
| AC-U2 | DR-01 | 이미 존재하는 `username` | 회원가입 시도 | 409 에러 반환 |
| AC-U3 | BR-12 | `active` 사용자 | 탈퇴 요청 | `status = inactive` 전환, 로그인 불가, 지출 기록 보존 |
| AC-U4 | BR-12 | `inactive` 사용자 | 로그인 시도 | 401 에러 반환 |

---

### 3.2 Group (그룹)

공동 지출을 관리하는 기본 단위.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `name` | string | 필수 | 1~50자 | 그룹 이름 |
| `type` | enum | 필수 | `LIMITED` \| `UNLIMITED` | 기간 한정 여부 |
| `start_date` | date | 필수 | KST | 그룹 시작일 |
| `end_date` | date | 선택 | KST, `LIMITED`이면 필수·`start_date` 이후, `UNLIMITED`이면 null | 그룹 종료일 |
| `created_by` | UUID | 필수 | FK → User.id | 그룹 최초 생성자 |
| `status` | enum | 필수 | `active` \| `inactive` | 비활성화 시 조회만 가능 |
| `created_at` | timestamp | 필수 | UTC | 생성 시각 |

**그룹 타입 구분**

| 타입 | 설명 | 예시 |
|------|------|------|
| `LIMITED` | 특정 기간에만 운영. `start_date` ~ `end_date` 모두 필수 | 여행 그룹 |
| `UNLIMITED` | 종료일 없이 계속 운영. `end_date = null` | 가족 그룹, 정기 모임 |

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-G1 | DR-03 | `LIMITED` 타입, `end_date` 미입력 | 그룹 생성 | 422 에러 반환 |
| AC-G2 | DR-03 | `LIMITED` 타입, `end_date < start_date` | 그룹 생성 | 422 에러 반환 |
| AC-G3 | BR-02 | `UNLIMITED` 타입 | 그룹 생성 | `end_date = null`로 생성 성공 |

---

### 3.3 GroupMember (그룹 멤버)

그룹 내 사용자의 소속 및 역할 정보.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `group_id` | UUID | 필수 | FK → Group.id | 소속 그룹 |
| `user_id` | UUID | 필수 | FK → User.id, UNIQUE(group_id, user_id) | 소속 사용자 |
| `role` | enum | 필수 | `MANAGER` \| `MEMBER` | 그룹 내 역할 |
| `joined_at` | timestamp | 필수 | UTC | 그룹 참여 시각. 권한 이양 기준 |

**역할(Role) 정의**

| 역할 | 권한 |
|------|------|
| `MANAGER` | 그룹 정보 수정, 멤버 초대/제거, 정산 실행, 카테고리 추가/삭제, 그룹 비활성화 |
| `MEMBER` | 지출 입력·수정·삭제(본인 작성 한정), 지출 조회, 차트·정산 내역 조회 |

**MANAGER 이양 규칙**
- `MANAGER`가 서비스를 탈퇴하면, 해당 그룹에서 `joined_at` 기준으로 가장 먼저 가입한 활성 멤버(`User.status = active`이며 `GroupMember` 레코드 존재)에게 `MANAGER` 권한이 자동 이양된다.
- 활성 멤버가 없으면 그룹은 자동으로 `inactive` 상태로 전환된다.

**가시성 정책**
- 그룹 내 모든 지출 내역은 그룹 멤버 전체에게 공개된다.

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-GM1 | BR-13 | MANAGER가 탈퇴, 활성 MEMBER 2명 이상 | 탈퇴 완료 | `joined_at` 가장 이른 활성 MEMBER가 MANAGER로 승격 |
| AC-GM2 | BR-13, BR-14 | MANAGER가 탈퇴, 활성 MEMBER 없음 | 탈퇴 완료 | 그룹 `status = inactive` 전환 |
| AC-GM3 | BR-12 | MEMBER가 탈퇴 | 탈퇴 완료 | GroupMember 레코드 삭제, 지출 기록 보존 |

---

### 3.4 Invitation (초대)

그룹 멤버 초대의 라이프사이클을 관리하는 엔티티.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `group_id` | UUID | 필수 | FK → Group.id | 초대 대상 그룹 |
| `inviter_id` | UUID | 필수 | FK → User.id | 초대한 사용자 (MANAGER) |
| `invitee_id` | UUID | 필수 | FK → User.id, `active` 사용자만 허용 | 초대받는 사용자 (username으로 조회 후 id 저장) |
| `status` | enum | 필수 | `PENDING` \| `ACCEPTED` \| `DECLINED` \| `EXPIRED` | 초대 상태 |
| `created_at` | timestamp | 필수 | UTC | 초대 생성 시각 |
| `expires_at` | timestamp | 필수 | `created_at + 7일` (UTC) | 초대 만료 시각 |
| `responded_at` | timestamp | 선택 | UTC | 수락/거절 시각 |

**초대 상태 전이**

```
PENDING → ACCEPTED  (초대받은 사용자가 수락)
PENDING → DECLINED  (초대받은 사용자가 거절)
PENDING → EXPIRED   (expires_at 경과 후 1시간 이내 배치 처리)
```

**초대 규칙**
- `MANAGER`만 초대를 발송할 수 있다.
- 이미 해당 그룹에 소속된 사용자에게는 초대를 발송할 수 없다.
- 동일 사용자에게 `PENDING` 상태의 초대가 이미 존재하면 중복 초대 불가.
- 초대 수락 시 즉시 `GroupMember` 레코드가 생성되고 `role = MEMBER`로 설정된다.

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-I1 | BR-03 | 유효한 `username`, `PENDING` 초대 없음 | MANAGER가 초대 발송 | `status = PENDING` 초대 생성 |
| AC-I2 | BR-03 | 이미 그룹 멤버인 `username` | MANAGER가 초대 시도 | 409 에러 반환 |
| AC-I3 | BR-03 | 동일 대상 `PENDING` 초대 존재 | MANAGER가 재초대 시도 | 409 에러 반환 |
| AC-I4 | BR-03 | `PENDING` 초대 | 초대받은 사용자가 수락 | `status = ACCEPTED`, GroupMember 생성(`role = MEMBER`) |
| AC-I5 | BR-03 | `PENDING` 초대, `expires_at` 경과 | 배치 처리 실행 | `status = EXPIRED` 전환 (경과 후 1시간 이내 보장) |

---

### 3.5 Category (카테고리)

지출을 분류하는 태그.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `name` | string | 필수 | 1~20자 | 카테고리 이름 |
| `scope` | enum | 필수 | `SYSTEM` \| `GROUP` | 기본 제공 여부 |
| `group_id` | UUID | 선택 | FK → Group.id. `GROUP`이면 필수, `SYSTEM`이면 null | 소속 그룹 |

**기본 제공 카테고리 (SYSTEM)**

`식비` · `교통` · `숙소` · `쇼핑` · `문화/여가` · `의료` · `기타`

- `MANAGER`는 그룹 전용(`GROUP`) 카테고리를 추가·삭제할 수 있다.
- `SYSTEM` 카테고리는 수정·삭제 불가.
- `GROUP` 카테고리 삭제 시, 해당 카테고리를 사용 중인 지출은 `기타`(`SYSTEM`)로 자동 재분류된다.

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-C1 | BR-10 | `SYSTEM` 카테고리 | MANAGER가 삭제 시도 | 403 에러 반환 |
| AC-C2 | BR-11 | `GROUP` 카테고리, 해당 카테고리 사용 지출 3건 존재 | MANAGER가 삭제 실행 | 카테고리 삭제, 지출 3건의 `category_id` → `기타` ID로 재분류 |
| AC-C3 | BR-11 | `GROUP` 카테고리, 사용 중인 지출 없음 | MANAGER가 삭제 실행 | 카테고리 삭제, 지출 변경 없음 |

---

### 3.6 Expense (지출)

그룹 내에서 발생한 개별 지출 항목.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `group_id` | UUID | 필수 | FK → Group.id | 소속 그룹 |
| `paid_by` | UUID | 필수 | FK → User.id | 실제 지출한 사용자 (분담 대상에 항상 포함) |
| `category_id` | UUID | 필수 | FK → Category.id | 지출 카테고리 |
| `total_amount` | integer | 필수 | → 2.2 화폐·금액 정책 | 전체 지출 금액 (원) |
| `date` | date | 필수 | KST 기준 날짜, → 2.3 시간대 정책 | 지출 발생일 |
| `description` | string | 선택 | 최대 200자 | 지출 설명 |
| `split_type` | enum | 필수 | `EQUAL` \| `CUSTOM` | 분담 방식 |
| `created_by` | UUID | 필수 | FK → User.id | 지출을 입력한 사용자 |
| `created_at` | timestamp | 필수 | UTC | 입력 시각 |

**정산 후 수정·삭제 정책 (BR-15)**
- 이미 정산에 포함된 기간의 `Expense`도 수정·삭제할 수 있다.
- 단, 기존 `Settlement` 및 `SettlementDetail` 레코드는 변경되지 않는다 (정산 결과 불변).
- 정산 결과 갱신이 필요하면 `MANAGER`가 재정산을 실행해야 한다.

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-EX1 | BR-15 | 정산 완료된 기간에 속한 Expense | 금액 수정 | 수정 성공, 기존 Settlement/SettlementDetail 불변 |
| AC-EX2 | BR-15 | 정산 완료된 기간에 속한 Expense | 삭제 실행 | 삭제 성공, 기존 Settlement/SettlementDetail 불변 |

---

### 3.7 ExpenseSplit (지출 분담)

지출 항목에 대한 참여 멤버별 분담금 정보.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `expense_id` | UUID | 필수 | FK → Expense.id | 대상 지출 |
| `user_id` | UUID | 필수 | FK → User.id, UNIQUE(expense_id, user_id) | 분담 대상 멤버 |
| `amount` | integer | 필수 | 0 이상 | 해당 멤버의 분담금 (원) |

**참여 멤버 범위**
- 지출 입력 시 그룹 멤버 중 일부를 **참여자**로 선택할 수 있다.
- `paid_by`(결제자)는 참여자 선택과 무관하게 항상 분담 대상에 포함된다.
- `ExpenseSplit` 레코드는 선택된 참여자에 대해서만 생성된다.

**집계 정의 (SettlementDetail 계산 기준)**
- `total_paid` = 해당 멤버가 `paid_by`인 `Expense.total_amount`의 합계
- `total_share` = 해당 멤버의 `ExpenseSplit.amount` 합계

**지출 입력 방식**

| 방식 | 설명 | 비고 |
|------|------|------|
| 균등 분배 (`EQUAL`) | 전체 금액 ÷ 참여 멤버 수 → 나머지는 결제자(`paid_by`)에게 귀속 | → 2.2 반올림 정책 |
| 개별 입력 (`CUSTOM`) | 멤버별 금액을 직접 입력 → `total_amount` = 멤버별 금액 합산으로 자동 계산 | 합산 불일치 시 저장 불가 |

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-ES1 | BR-05, BR-06 | 10,000원, 참여자 3명(결제자 포함), EQUAL | 지출 저장 | 결제자 3,334원, 나머지 2명 각 3,333원 |
| AC-ES2 | BR-06 | 참여자 0명 선택(결제자 미포함) | 지출 저장 시도 | 422 에러 (결제자 자동 포함으로 최소 1명 보장) |
| AC-ES3 | DR-04 | CUSTOM, 멤버별 합산 ≠ 입력한 총액 | 지출 저장 시도 | 422 에러 반환 |

---

### 3.8 Settlement (정산)

특정 기간 동안의 멤버별 지출 집계 결과.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `group_id` | UUID | 필수 | FK → Group.id | 정산 대상 그룹 |
| `period_start` | date | 필수 | KST, ≤ `period_end` | 정산 시작일 (해당일 00:00:00 포함) |
| `period_end` | date | 필수 | KST, ≥ `period_start` | 정산 종료일 (해당일 23:59:59 포함) |
| `created_by` | UUID | 필수 | FK → User.id (MANAGER) | 정산 실행자 |
| `settled_at` | timestamp | 필수 | UTC | 정산 완료 시각 |

**정산 집계 방식**
- `period_start` ~ `period_end` (양 끝 포함, KST 기준, → 2.3 시간대 정책) 내 모든 `Expense`의 `ExpenseSplit`을 멤버별로 합산한다.
- 동일 기간에 대한 복수 정산이 가능하다(재정산 허용). 각 정산 결과는 독립적으로 보존된다.
- 정산 완료 후 각 멤버에게 **정산 메시지**를 발송한다.
- `status` 컬럼 없음: 정산은 생성 즉시 완료 상태. 진행 중·취소 개념 없음(단순화 의도).

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-S1 | DR-05 | `period_start > period_end` | 정산 실행 | 422 에러 반환 |
| AC-S2 | BR-07 | MEMBER가 정산 실행 시도 | 정산 요청 | 403 에러 반환 |
| AC-S3 | BR-07, BR-08 | 기간 내 지출 0건, MANAGER 실행 | 정산 실행 | SettlementDetail 레코드 = 활성 멤버 수만큼 생성 (모든 `balance = 0`), 전 멤버 메시지 발송 |
| AC-S4 | BR-07, BR-08 | 유효한 기간, MANAGER 실행 | 정산 완료 | SettlementDetail 생성, 전 멤버 정산 메시지 발송 |

---

### 3.9 SettlementDetail (정산 상세)

정산 결과에서 멤버별 집계 금액.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `settlement_id` | UUID | 필수 | FK → Settlement.id | 소속 정산 |
| `user_id` | UUID | 필수 | FK → User.id, UNIQUE(settlement_id, user_id) | 대상 멤버 |
| `total_paid` | integer | 필수 | 0 이상 | 해당 멤버가 결제자인 지출의 `total_amount` 합계 |
| `total_share` | integer | 필수 | 0 이상 | 해당 멤버의 `ExpenseSplit.amount` 합계 |
| `balance` | integer | 필수 | `total_paid − total_share` | 양수: 받을 금액, 음수: 내야 할 금액 |

---

### 3.10 Message (메시지)

서비스 내 메시지는 **정산 메시지만** 허용한다.

| 속성 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `id` | UUID | 필수 | PK | 내부 식별자 |
| `settlement_id` | UUID | 필수 | FK → Settlement.id | 연계된 정산 |
| `recipient_user_id` | UUID | 필수 | FK → User.id | 수신 멤버 |
| `content` | string | 필수 | - | 메시지 본문 (정산 내역 요약) |
| `sent_at` | timestamp | 필수 | UTC | 발송 시각 |

**수용 기준 (AC)**

| AC | 검증 규칙 | Given | When | Then |
|----|----------|-------|------|------|
| AC-M1 | BR-08 | 정산 완료 (활성 멤버 N명) | 정산 실행 | Message 레코드 N개 생성, 각 멤버에게 발송 |
| AC-M2 | BR-09 | 임의 메시지 발송 API 호출 시도 | - | 해당 기능 미제공 (404 또는 미노출) |

---

## 4. 도메인 규칙

규칙 ID 체계: `DR-` 데이터 규칙 · `BR-` 비즈니스 규칙 · `SC-` 범위 규칙

| ID | 분류 | 규칙 | 관련 엔티티 |
|----|------|------|------------|
| DR-01 | DR | `username`은 서비스 전체에서 고유하다 | User |
| DR-02 | DR | `(group_id, user_id)` 조합은 GroupMember 내 유일하다 | GroupMember |
| DR-03 | DR | `LIMITED` 그룹의 `end_date`는 `start_date` 이후여야 한다 | Group |
| DR-04 | DR | `CUSTOM` 분담 합산은 `total_amount`와 일치해야 한다 | Expense, ExpenseSplit |
| DR-05 | DR | 정산 `period_start`는 `period_end` 이전이거나 같아야 한다 | Settlement |
| DR-06 | DR | `balance = total_paid − total_share` | SettlementDetail |
| BR-01 | BR | 사용자는 여러 그룹에 동시 소속될 수 있다 | User, GroupMember |
| BR-02 | BR | 그룹은 `LIMITED` 또는 `UNLIMITED` 타입으로 생성된다 | Group |
| BR-03 | BR | 멤버 초대는 `MANAGER`만 가능하며 `username`으로 검색한다 | Invitation |
| BR-04 | BR | 그룹 내 모든 지출 내역은 멤버 전체에게 공개된다 | Expense |
| BR-05 | BR | 균등 분배 나머지 금액은 결제자(`paid_by`)에게 귀속된다 | ExpenseSplit |
| BR-06 | BR | 결제자(`paid_by`)는 참여자 선택 여부와 무관하게 분담 대상에 항상 포함된다 | ExpenseSplit |
| BR-07 | BR | 정산은 `MANAGER`만 실행하며 기간을 직접 지정한다 | Settlement |
| BR-08 | BR | 정산 완료 시 그룹 전 멤버에게 정산 메시지가 자동 발송된다 | Message |
| BR-09 | BR | 서비스 내 메시지는 정산 메시지만 허용한다 | Message |
| BR-10 | BR | `SYSTEM` 카테고리는 수정·삭제 불가하며 모든 그룹에 공통 제공된다 | Category |
| BR-11 | BR | `GROUP` 카테고리 삭제 시 해당 카테고리 지출은 `기타`로 재분류된다 | Category, Expense |
| BR-12 | BR | 탈퇴 사용자는 `inactive` 처리되며 기존 지출 기록은 보존된다 | User |
| BR-13 | BR | `MANAGER` 탈퇴 시 `joined_at` 기준 최선임 활성 멤버에게 권한이 자동 이양된다 | GroupMember |
| BR-14 | BR | 활성 멤버가 없는 그룹은 자동으로 `inactive` 상태로 전환된다 | Group |
| BR-15 | BR | 정산 완료 후에도 해당 기간의 Expense는 수정·삭제 가능하며, 기존 정산 결과는 변경되지 않는다 | Expense, Settlement |
| SC-01 | SC | 예산 계획 기능은 제공하지 않는다 | - |
| SC-02 | SC | 영수증·사진 첨부 기능은 제공하지 않는다 | - |
| SC-03 | SC | 자동 정산은 제공하지 않는다. 모든 정산은 수동으로 실행된다 | Settlement |

---

## 5. 입력 검증 규칙

> 정책 값(비밀번호·금액·시간대)은 섹션 2의 단일 출처를 따른다. 중복 명시 없이 아래에서 참조한다.

| 필드 | 규칙 |
|------|------|
| `username` | 3~20자, 영문 소문자·숫자·밑줄(`_`)만 허용, 공백 불가 |
| `email` | RFC 5322 형식 |
| `password` | → 2.1 인증 정책 (8자 이상, 영문·숫자·특수문자 각 1자 이상) |
| `Group.name` | 1~50자 |
| `Category.name` | 1~20자 |
| `Expense.total_amount` | → 2.2 화폐·금액 정책 (정수, 1 이상 999,999,999 이하) |
| `Expense.date` | YYYY-MM-DD, 1900-01-01 이후, 미래 날짜 허용, → 2.3 시간대 정책 |
| `Expense.description` | 최대 200자 (선택) |
| `Settlement.period_start` | YYYY-MM-DD, `period_end` 이전이거나 같아야 함, → 2.3 시간대 정책 |
| `Settlement.period_end` | YYYY-MM-DD, `period_start` 이후이거나 같아야 함, → 2.3 시간대 정책 |
| `Invitation.invitee_username` | 존재하는 `active` 사용자의 `username`이어야 함 |

---

## 6. 추적 매트릭스

| 규칙 ID | 관련 엔티티 | In-Scope 기능 | 검증 AC |
|---------|------------|--------------|---------|
| DR-01 | User | 회원가입 | AC-U1, AC-U2 |
| DR-02 | GroupMember | 그룹 멤버 관리 | AC-GM1 |
| DR-03 | Group | 그룹 생성 (기간 한정) | AC-G1, AC-G2 |
| DR-04 | Expense, ExpenseSplit | 지출 입력 (개별 분담) | AC-ES3 |
| DR-05 | Settlement | 수동 정산 | AC-S1 |
| DR-06 | SettlementDetail | 엑셀 내보내기 | AC-S3, AC-S4 |
| BR-02 | Group | 그룹 생성 (무제한) | AC-G3 |
| BR-03 | Invitation | 멤버 초대 (`username` 검색) | AC-I1~AC-I5 |
| BR-04 | Expense | 지출 조회 (전체 공개) | - |
| BR-05, BR-06 | ExpenseSplit | 지출 입력 (균등 분담) | AC-ES1, AC-ES2 |
| BR-07, BR-08 | Settlement, Message | 수동 정산 및 메시지 발송 | AC-S2~AC-S4, AC-M1 |
| BR-09 | Message | 메시지 기능 제한 | AC-M2 |
| BR-10 | Category | 카테고리 관리 (SYSTEM 보호) | AC-C1 |
| BR-11 | Category, Expense | 카테고리 삭제 및 재분류 | AC-C2, AC-C3 |
| BR-12, BR-13, BR-14 | User, GroupMember, Group | 사용자 탈퇴 처리 | AC-U3, AC-U4, AC-GM1~AC-GM3 |
| BR-15 | Expense, Settlement | 정산 후 지출 수정·삭제 | AC-EX1, AC-EX2 |
| SC-01~SC-03 | - | Out-of-Scope 기능 경계 | - |

---

## 7. 기술 제약

| 항목 | 내용 |
|------|------|
| 플랫폼 | 웹 / 모바일 웹 (반응형 UI) |
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| 언어 | 한국어 단독 지원 (v1) |
| 통화 | KRW 단독 지원 (v1), → 2.2 화폐·금액 정책 |
| 예상 사용 규모 | 초기 수십~수백 명, 향후 다수 사용자까지 확장 고려 |

---

## 8. 기능 경계

### In-Scope

| 기능 | 근거 규칙 |
|------|----------|
| 그룹 생성 및 멤버 초대 (`username` 검색) | BR-02, BR-03 |
| 지출 입력 (금액, 카테고리, 날짜, 참여자, 균등/개별 분담) | BR-04~BR-06, DR-04 |
| 수동 정산 (기간 지정 집계 → 정산 메시지 발송) | BR-07~BR-09, SC-03 |
| 정산 후 지출 수정·삭제 (정산 결과 불변) | BR-15 |
| 카테고리별·멤버별 기간 파이 차트 조회 | BR-04, DR-06 |
| 전체 비용 및 멤버별 정산 금액 엑셀 내보내기 | DR-06 |
| 사용자 탈퇴 (비활성화) | BR-12, BR-13 |

### Out-of-Scope

| 제외 기능 | 근거 규칙 |
|----------|----------|
| 예산 계획 및 예산 알림 | SC-01 |
| 영수증·사진 첨부 | SC-02 |
| 정산 외 메시지·채팅 | BR-09 |
| 자동 정산 | SC-03 |
| 외부 간편결제 연동 | - |
| 다중 통화 지원 | 2.2 화폐·금액 정책 |

---

## 9. 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-06-18 | 최초 작성 | stepanowon |
| 1.1 | 2026-06-18 | 인증·화폐·시간대 정책 추가; Invitation 엔티티 신설; 전 엔티티 타입·필수·제약 명세; 균등 분배 결정론적 명세; AC 추가; DR/BR/SC 규칙 체계 도입; 추적 매트릭스·입력 검증 규칙 추가 | stepanowon |
| 1.2 | 2026-06-18 | (1) BR-15 신설: 정산 후 Expense 수정·삭제 허용 및 정산 결과 불변 명세; AC-EX1·EX2 추가. (2) 값 중복 제거: 섹션 5에서 비밀번호·금액·시간대를 섹션 2 참조로 전환, 엔티티 표 중복 제거. (3) 검증 공백 보강: 전 AC 표에 검증 규칙 ID 컬럼 추가; Category(AC-C1~C3)·Message(AC-M1·M2) AC 신설; AC-S3 SettlementDetail 레코드 수 명세; AC-I5 배치 SLA(1시간) 추가; 에러 코드 규약(2.4) 신설; 추적 매트릭스에 검증 AC 컬럼 추가 | stepanowon |
| 1.3 | 2026-06-18 | 7. 기술 제약표에 언어(한국어 단독, v1) 및 통화(KRW 단독, v1) 항목 추가 — PRD 11.1과 일관성 맞춤 | stepanowon |
| 1.4 | 2026-06-18 | Invitation 엔티티 3.4 섹션: invitee_username → invitee_id(UUID FK → User.id) 변경. 초대 발송 시 username으로 사용자 조회 후 id 저장 | stepanowon |
