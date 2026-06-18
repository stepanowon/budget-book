# 프론트엔드 스타일 가이드 — 공동 가계부 서비스

> 버전: 1.0
> 작성일: 2026-06-18
> 참고 디자인: Google Calendar (Material Design 3 기반 클린 UI)
> 관련 문서: 4-project-principle.md · 8-wireframe.md

---

## 목차

1. [디자인 원칙](#1-디자인-원칙)
2. [컬러 팔레트](#2-컬러-팔레트)
3. [타이포그래피](#3-타이포그래피)
4. [간격 시스템 (Spacing)](#4-간격-시스템-spacing)
5. [컴포넌트 스타일](#5-컴포넌트-스타일)
6. [아이콘 / 아바타](#6-아이콘--아바타)
7. [레이아웃 구조](#7-레이아웃-구조)
8. [인터랙션 / 피드백](#8-인터랙션--피드백)
9. [반응형 브레이크포인트](#9-반응형-브레이크포인트)
10. [CSS 변수 정의](#10-css-변수-정의)

---

## 1. 디자인 원칙

Google Calendar에서 추출한 4가지 핵심 원칙을 공동 가계부 UI 전반에 적용한다.

| 원칙 | 설명 | 적용 예시 |
|------|------|----------|
| **명료성 (Clarity)** | 정보 계층이 한눈에 파악되어야 한다. 중요 수치(금액, 정산 결과)는 크게, 보조 정보(날짜, 멤버 이름)는 작게. | 지출 목록에서 금액(16px bold) > 카테고리(12px gray) |
| **일관성 (Consistency)** | 동일한 역할을 하는 요소는 항상 동일한 시각 언어를 사용한다. | 모든 삭제 액션은 red, 모든 확인/완료 액션은 primary blue |
| **여백 (Whitespace)** | 과도한 색상·테두리보다 충분한 여백이 정보 그룹을 구분한다. | 카드 간 16px 간격, 섹션 간 32px 간격 |
| **상태 가시성 (State Visibility)** | 선택됨, 로딩 중, 에러 상태를 색상·아이콘·텍스트로 명시적으로 표현한다. | 오늘 날짜 강조(파란 원), 로딩 스피너, 에러 메시지 |

---

## 2. 컬러 팔레트

### 2.1 기본 색상

Google Calendar의 선명하고 절제된 팔레트를 기반으로 구성한다.

```
Primary     #1a73e8   ← Google Blue — 주요 CTA, 링크, 선택 상태, 오늘 날짜 강조
Primary Dark #1557b0  ← hover/active 상태
Primary Light #e8f0fe ← 배경 강조, chip 선택 배경

Success     #1e8e3e   ← 정산 완료, 수락 상태
Success Light #e6f4ea

Warning     #f9ab00   ← 기한 임박 초대, 미정산 경고
Warning Light #fef7e0  ← 이벤트 배경 (공휴일 스타일)

Danger      #d93025   ← 삭제, 거절, 에러
Danger Light #fce8e6

Neutral     #5f6368   ← 보조 텍스트 (날짜, 레이블)
Border      #dadce0   ← 구분선, 입력 테두리
Background  #f8f9fa   ← 페이지 배경 (Google Calendar 그리드 외곽)
Surface     #ffffff   ← 카드, 모달, 사이드바 배경
```

### 2.2 도메인 카테고리 색상

지출 카테고리를 Google Calendar 이벤트 색상 체계에서 차용한다.

| 카테고리 | 색상 코드 | 용도 |
|---------|----------|------|
| 식비 | `#039be5` (Peacock) | 지출 목록 chip, 파이 차트 |
| 교통 | `#33b679` (Sage) | |
| 쇼핑 | `#8e24aa` (Grape) | |
| 문화/여가 | `#f6bf26` (Banana) | |
| 의료 | `#d81b60` (Flamingo) | |
| 기타 | `#616161` (Graphite) | |
| 시스템(미분류) | `#9e9e9e` | 기본값 |

### 2.3 색상 사용 규칙

- 배경에 순수 흰색(`#ffffff`) + 페이지 베이스에 `#f8f9fa`를 사용하여 카드가 떠 있는 느낌을 준다.
- 텍스트 주요색: `#202124` (거의 검정, 순수 `#000000` 지양)
- 링크·클릭 가능한 텍스트: `#1a73e8`
- disabled 상태: `#bdc1c6` (텍스트), `#f1f3f4` (배경)
- 색상만으로 정보를 전달하지 않는다 — 아이콘 또는 텍스트를 항상 병행한다 (접근성).

---

## 3. 타이포그래피

Google Calendar는 **Google Sans / Roboto** 계열의 명료한 sans-serif를 사용한다. 공동 가계부 서비스는 한국어를 주 언어로 하므로 **Pretendard**를 기본 폰트로 채택한다 (웹폰트 CDN 또는 self-hosted).

### 3.1 폰트 스택

```css
font-family: 'Pretendard', 'Google Sans', 'Roboto', -apple-system,
  BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 3.2 타입 스케일

| 역할 | 크기 | 굵기 | Line Height | 사용 위치 |
|------|------|------|-------------|----------|
| Display | 28px | 400 | 1.3 | 페이지 메인 헤딩 (없음/최소화) |
| Heading 1 | 22px | 500 | 1.3 | 그룹명, 정산 결과 헤더 |
| Heading 2 | 18px | 500 | 1.4 | 섹션 제목 (지출 목록, 멤버 목록) |
| Heading 3 | 16px | 500 | 1.4 | 카드 제목, 지출 설명 |
| Body 1 | 14px | 400 | 1.5 | 일반 본문, 지출 항목 |
| Body 2 | 13px | 400 | 1.5 | 보조 정보 (날짜, 멤버 이름) |
| Caption | 12px | 400 | 1.4 | 라벨, chip 텍스트, 도움말 |
| Overline | 11px | 500 | 1.4 | 섹션 레이블 (대문자 표기 지양) |

### 3.3 금액 표시

금액은 **숫자 고정폭 변형(tabular nums)**을 적용하여 세로 정렬을 맞춘다.

```css
.amount {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  font-size: 16px;
  font-weight: 600;
  color: #202124;
}

.amount--negative { color: #d93025; }  /* 본인 부담 */
.amount--positive { color: #1e8e3e; }  /* 받을 금액 */
```

---

## 4. 간격 시스템 (Spacing)

**8px 베이스 그리드**를 사용한다. Google Calendar의 셀 패딩, 사이드바 여백이 모두 8의 배수로 이루어져 있다.

| 토큰 | 값 | 용도 |
|------|----|------|
| `space-1` | 4px | 아이콘-텍스트 사이, chip 내부 수직 |
| `space-2` | 8px | chip 내부 수평, 인풋 아이콘 간격 |
| `space-3` | 12px | 입력 필드 내부 패딩 |
| `space-4` | 16px | 카드 내부 패딩, 목록 아이템 간격 |
| `space-5` | 20px | 섹션 내 그룹 간격 |
| `space-6` | 24px | 카드 사이 간격, 모달 패딩 |
| `space-8` | 32px | 섹션 간 간격, 페이지 상하 패딩 |
| `space-12` | 48px | 페이지 최상단 여백 |

### 카드 / 컨테이너 패딩 규칙

```
작은 카드 (chip, badge)  : padding 4px 10px
중간 카드 (지출 아이템)   : padding 12px 16px
큰 카드 (정산 결과 카드)  : padding 20px 24px
모달 내부               : padding 24px
페이지 좌우 여백 (desktop): 24px ~ 32px
```

---

## 5. 컴포넌트 스타일

### 5.1 Button

Google Calendar의 버튼 스타일 3종을 채택한다.

#### Filled (Primary CTA)
```css
/* 정산 실행, 그룹 생성, 저장 등 주요 액션 */
background: #1a73e8;
color: #ffffff;
border-radius: 4px;
padding: 8px 24px;
font-size: 14px;
font-weight: 500;
border: none;
box-shadow: 0 1px 2px rgba(0,0,0,.2);

/* Hover */
background: #1557b0;
box-shadow: 0 2px 6px rgba(0,0,0,.2);

/* Disabled */
background: #f1f3f4;
color: #bdc1c6;
```

#### Outlined (Secondary)
```css
/* '오늘' 버튼, 취소, 목록으로 돌아가기 등 */
background: transparent;
color: #1a73e8;
border: 1px solid #dadce0;
border-radius: 4px;
padding: 7px 23px; /* border 1px 보정 */
font-size: 14px;

/* Hover */
background: #e8f0fe;
border-color: #c5d9f6;
```

#### Text (Tertiary / 링크형)
```css
/* 부가 액션, 초대 거절 등 */
background: transparent;
color: #1a73e8;
border: none;
padding: 8px 12px;
border-radius: 4px;

/* Hover */
background: #e8f0fe;
```

#### Danger
```css
/* 삭제, 탈퇴 등 파괴적 액션 */
background: #d93025;  /* filled variant */
color: #ffffff;
/* 또는 Outlined variant: color #d93025, border #d93025 */
```

### 5.2 Input / Form

```css
/* 기본 입력 필드 */
.input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  color: #202124;
  background: #ffffff;
  transition: border-color 150ms;
}

.input:focus {
  border-color: #1a73e8;
  outline: 2px solid #e8f0fe;
  outline-offset: 0;
}

.input::placeholder { color: #9aa0a6; }

/* 에러 상태 */
.input--error {
  border-color: #d93025;
  background: #fce8e6;
}

/* 레이블 */
.label {
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 4px;
}

/* 에러 메시지 */
.field-error {
  font-size: 12px;
  color: #d93025;
  margin-top: 4px;
}
```

### 5.3 Card

```css
.card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(60,64,67,.1);
  transition: box-shadow 150ms;
}

.card:hover {
  box-shadow: 0 2px 6px rgba(60,64,67,.15);
}

/* 선택된 카드 (그룹 선택, 지출 선택) */
.card--selected {
  border-color: #1a73e8;
  background: #f0f6ff;
}
```

### 5.4 Chip / Badge (카테고리 태그)

Google Calendar의 이벤트 바 스타일을 chip에 응용한다.

```css
.chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 11px;        /* pill shape */
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
}

/* 카테고리별 색상 (도메인 색상 참고) */
.chip--food       { background: #039be5; }
.chip--transport  { background: #33b679; }
.chip--shopping   { background: #8e24aa; }
.chip--leisure    { background: #f6bf26; color: #202124; }  /* 노란색은 텍스트 어두운 색 */
.chip--medical    { background: #d81b60; }
.chip--etc        { background: #616161; }
```

### 5.5 Table / List

```css
/* 지출 목록, 정산 내역 테이블 */
.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
  gap: 12px;
  transition: background 100ms;
}

.list-item:hover { background: #f8f9fa; }
.list-item:last-child { border-bottom: none; }

/* 테이블 헤더 */
.table-header {
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  text-transform: none;
  padding: 8px 16px;
  border-bottom: 1px solid #dadce0;
  background: #f8f9fa;
}
```

### 5.6 Modal / Dialog

```css
/* Google Calendar의 이벤트 상세 팝업 스타일 참고 */
.modal-overlay {
  background: rgba(0,0,0,.4);
  backdrop-filter: none; /* 성능 우선 */
}

.modal {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(60,64,67,.3);
  padding: 24px;
  max-width: 480px;
  width: 90%;
}

.modal-header {
  font-size: 18px;
  font-weight: 500;
  color: #202124;
  margin-bottom: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
```

### 5.7 Navigation (App Header)

Google Calendar 상단 헤더와 동일한 구조를 적용한다.

```
높이: 64px
배경: #ffffff
하단 경계: 1px solid #e0e0e0 또는 box-shadow: 0 1px 2px rgba(0,0,0,.1)
좌측: 햄버거 메뉴 아이콘 + 서비스 로고/명칭
중앙: 현재 그룹명 (모바일에서 생략)
우측: 검색 아이콘, 알림 아이콘, 프로필 아바타
```

### 5.8 Sidebar (데스크톱)

```
너비: 256px (확장) / 72px (축소)
배경: #ffffff
우측 경계: 1px solid #e0e0e0
내부 패딩: 8px
메뉴 아이템 높이: 40px, border-radius: 20px (pill)
활성 메뉴 아이템 배경: #e8f0fe, 색상: #1a73e8
비활성 텍스트: #202124
```

### 5.9 LoadingSpinner

```css
/* Google Calendar의 원형 인디케이터 */
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f1f3f4;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
```

### 5.10 EmptyState

목록이 비었을 때 중앙 정렬로 아이콘 + 설명 + CTA를 표시한다.

```
아이콘: 128×128px, color #dadce0
제목: 18px, #5f6368
설명: 14px, #9aa0a6
CTA 버튼: Filled Primary
```

---

## 6. 아이콘 / 아바타

### 아이콘

- 라이브러리: **lucide-react** (Google Calendar의 Material Icons와 유사한 스타일)
- 크기: 20px (헤더 액션), 18px (목록 내 아이콘), 16px (chip 내 아이콘)
- 색상: 컨텍스트에 따라 `#5f6368` (기본) / `#1a73e8` (활성) / `#d93025` (삭제)
- 클릭 영역: 최소 40×40px (터치 대응)

### 아바타 (멤버, 프로필)

Google Calendar의 우상단 프로필 원형 아바타와 동일하게 처리한다.

```css
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1a73e8;    /* 사용자별 도메인 색상 순환 */
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 멤버 아바타 크기 변형 */
.avatar--sm { width: 24px; height: 24px; font-size: 11px; }
.avatar--lg { width: 40px; height: 40px; font-size: 16px; }
```

**아바타 색상 순환** (멤버 순서 기반):

```
1번: #1a73e8  (Blue)
2번: #1e8e3e  (Green)
3번: #8e24aa  (Purple)
4번: #d81b60  (Pink)
5번: #e37400  (Orange)
6번: #039be5  (Cyan)
7번: #33b679  (Sage)
8번: #f6bf26  텍스트 #202124 (Yellow)
```

---

## 7. 레이아웃 구조

### 7.1 전체 레이아웃

Google Calendar의 사이드바 + 메인 영역 구조를 그대로 차용한다.

```
┌─────────────────────────────────────────────────────┐
│  AppHeader (height: 64px, z-index: 100)             │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  Sidebar     │   Main Content Area                  │
│  (256px)     │   - max-width: 1200px                │
│              │   - padding: 24px 32px               │
│  (모바일:    │   - overflow-y: auto                  │
│   숨김/      │                                      │
│   드로어)    │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

### 7.2 페이지별 레이아웃 패턴

| 페이지 | 레이아웃 패턴 |
|--------|-------------|
| 로그인 / 회원가입 | AuthLayout — 중앙 정렬 카드 (max-width: 400px) |
| 그룹 목록 | 2~3열 카드 그리드 |
| 지출 목록 | 좌측 필터 패널 + 우측 테이블/목록 |
| 정산 실행 | 단일 카드 폼 (max-width: 600px) |
| 정산 결과 | 요약 카드 + 상세 테이블 |
| 리포트 | 파이 차트(좌) + 항목 목록(우) |
| 메시지 | 전체 너비 목록 |

### 7.3 콘텐츠 최대 너비

```
전체 페이지 컨테이너  : max-width 1200px, margin 0 auto
폼 / 다이얼로그 내용  : max-width 480px
단일 카드 페이지     : max-width 600px
```

---

## 8. 인터랙션 / 피드백

### 8.1 전환 (Transition)

Google Calendar는 전환이 절제되어 있다. 과도한 애니메이션은 지양한다.

```css
/* 기본 전환 — 색상, 배경, 테두리 */
transition: background 150ms ease, border-color 150ms ease, color 150ms ease;

/* 카드 shadow */
transition: box-shadow 150ms ease;

/* 모달 등장 */
transition: opacity 200ms ease, transform 200ms ease;
.modal-enter  { opacity: 0; transform: scale(.96); }
.modal-active { opacity: 1; transform: scale(1); }
```

### 8.2 Toast / Snackbar

```
위치: 화면 좌측 하단 (또는 우측 하단)
최소 너비: 288px
최대 너비: 400px
height: 48px
border-radius: 4px
배경: #202124  (어두운 배경 — Google Calendar 스타일)
텍스트: #ffffff, 14px
자동 소멸: 4초
액션 버튼 (선택): #8ab4f8 (밝은 파란색)
```

### 8.3 상태별 UI 표현

| 상태 | 표현 방식 |
|------|----------|
| 로딩 중 | 버튼 내 스피너 또는 Skeleton 카드 |
| 성공 | Toast 메시지 (초록 아이콘 + 텍스트) |
| 에러 | 인라인 에러 메시지 (빨간 텍스트) + Toast |
| 빈 목록 | EmptyState 컴포넌트 (아이콘 + 안내 + CTA) |
| 권한 없음 | 버튼 숨김 또는 disabled, 필요 시 안내 텍스트 |

### 8.4 Focus / 접근성

```css
/* 키보드 포커스 링 — Google Calendar의 파란 outline */
:focus-visible {
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
  border-radius: 2px;
}

/* 마우스 클릭 시 포커스 링 숨김 */
:focus:not(:focus-visible) { outline: none; }
```

- 모든 인터랙티브 요소 최소 터치 영역: **44×44px**
- 색상 대비: 본문 텍스트 `#202124`/`#ffffff` → 대비율 18.1:1 (WCAG AA 이상)
- `aria-label`, `aria-live` 속성을 로딩 · 에러 메시지에 반드시 적용

---

## 9. 반응형 브레이크포인트

```
Mobile   : < 768px  → 사이드바 숨김(드로어), 단열 레이아웃
Tablet   : 768px ~ 1024px → 사이드바 축소(아이콘), 2열 그리드
Desktop  : > 1024px → 사이드바 확장(256px), 3열 그리드
Wide     : > 1440px → 콘텐츠 max-width 1200px 제한
```

### 모바일 전용 조정

- 헤더 높이: 56px (64px → 56px)
- 하단 내비게이션 바 추가 (탭 바, 높이 56px): 그룹 · 지출 · 정산 · 메시지
- 카드 좌우 패딩: 16px → 12px
- 테이블 → 카드 목록으로 대체 (복잡한 테이블은 모바일에서 스크롤 허용)

---

## 10. CSS 변수 정의

`src/index.css` 또는 `src/styles/variables.css`에 정의하여 전체에서 참조한다.

```css
:root {
  /* Colors */
  --color-primary:         #1a73e8;
  --color-primary-dark:    #1557b0;
  --color-primary-light:   #e8f0fe;
  --color-success:         #1e8e3e;
  --color-success-light:   #e6f4ea;
  --color-warning:         #f9ab00;
  --color-warning-light:   #fef7e0;
  --color-danger:          #d93025;
  --color-danger-light:    #fce8e6;

  --color-text-primary:    #202124;
  --color-text-secondary:  #5f6368;
  --color-text-disabled:   #bdc1c6;
  --color-text-placeholder:#9aa0a6;

  --color-border:          #dadce0;
  --color-border-light:    #f1f3f4;
  --color-bg:              #f8f9fa;
  --color-surface:         #ffffff;

  /* Typography */
  --font-family:           'Pretendard', 'Roboto', sans-serif;
  --font-size-base:        14px;
  --line-height-base:      1.5;

  /* Spacing */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;

  /* Border Radius */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:  12px;
  --radius-pill: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(60,64,67,.1);
  --shadow-md: 0 2px 6px rgba(60,64,67,.15);
  --shadow-lg: 0 8px 24px rgba(60,64,67,.3);

  /* Layout */
  --header-height:      64px;
  --sidebar-width:     256px;
  --sidebar-collapsed:  72px;
  --content-max-width: 1200px;

  /* Transition */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
}

/* 모바일 조정 */
@media (max-width: 768px) {
  :root {
    --header-height: 56px;
  }
}
```

---

## 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-06-18 | 최초 작성 — Google Calendar 디자인 기반 스타일 가이드 | stepanowon |
