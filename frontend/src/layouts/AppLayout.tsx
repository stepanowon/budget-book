import { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, Settings, Menu, X, LayoutList, Mail, BarChart2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { to: ROUTES.GROUPS, label: '그룹 목록', icon: LayoutList, end: true },
  { to: ROUTES.INVITATIONS, label: '초대함', icon: Mail, end: false },
  { to: ROUTES.REPORTS, label: '보고서', icon: BarChart2, end: false },
] as const;

export default function AppLayout({ onLogout }: AppLayoutProps) {
  const { data: messages = [] } = useMessages();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const badgeCount = messages.length;

  const [drawerOpen, setDrawerOpen] = useState(false);

  // 경로 이동 시 드로어 닫기
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  async function handleLogout() {
    setDrawerOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      void navigate(ROUTES.LOGIN);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      {/* 헤더 */}
      <header className="sticky top-0 z-[100] h-16 bg-white border-b border-border flex items-center px-8 md:px-4 md:h-14">
        <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto">
          <div className="flex items-center gap-6">
            {/* 햄버거 버튼 (모바일에서만 표시) */}
            <button
              className="hidden md:flex items-center justify-center w-11 h-11 border-0 rounded bg-transparent cursor-pointer text-[#202124] hover:bg-[#f8f9fa] transition-colors"
              type="button"
              aria-label="메뉴 열기"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={22} />
            </button>

            <Link to={ROUTES.GROUPS} className="text-lg font-semibold text-primary no-underline tracking-tight whitespace-nowrap">
              공동 가계부
            </Link>

            {/* 가로 네비게이션 (데스크탑에서만 표시) */}
            <nav className="flex items-center gap-1 md:hidden" aria-label="주 내비게이션">
              {NAV_ITEMS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-sm font-medium no-underline whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-primary-light text-primary font-semibold'
                        : 'text-neutral hover:bg-[#f8f9fa] hover:text-[#202124]'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.MESSAGES}
              className="relative flex items-center justify-center w-11 h-11 rounded-full bg-transparent text-neutral hover:bg-[#f8f9fa] transition-colors"
              aria-label={`메시지${badgeCount > 0 ? ` ${badgeCount}개` : ''}`}
            >
              <Bell size={20} />
              {badgeCount > 0 && (
                <span
                  className="absolute top-1 right-1 bg-danger text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center leading-none"
                  aria-hidden="true"
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </Link>
            <Link
              to={ROUTES.SETTINGS_WITHDRAW}
              className="flex items-center justify-center min-w-[44px] h-11 rounded text-neutral no-underline hover:bg-[#f8f9fa] hover:text-[#202124] transition-colors"
              aria-label="계정 설정"
            >
              <Settings size={16} />
            </Link>
            <button
              className="flex items-center justify-center min-w-[44px] h-11 px-3 rounded border border-border bg-transparent cursor-pointer text-neutral text-sm font-sans hover:bg-[#f8f9fa] hover:text-[#202124] transition-colors"
              type="button"
              onClick={() => void handleLogout()}
              aria-label="로그아웃"
            >
              <LogOut size={16} className="mr-1" />
              <span className="md:hidden">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 드로어 오버레이 */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[200]"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* 모바일 드로어 패널 */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-white z-[201] flex flex-col shadow-[4px_0_16px_rgba(0,0,0,0.12)] transition-transform duration-[220ms] ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="모바일 내비게이션"
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border min-h-[64px]">
          <Link to={ROUTES.GROUPS} className="text-[17px] font-semibold text-primary no-underline">
            공동 가계부
          </Link>
          <button
            className="flex items-center justify-center w-10 h-10 border-0 rounded bg-transparent cursor-pointer text-neutral hover:bg-[#f8f9fa] transition-colors"
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-3 py-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded text-[15px] font-medium no-underline transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-neutral hover:bg-[#f8f9fa] hover:text-[#202124]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-border flex flex-col gap-1">
          <Link
            to={ROUTES.MESSAGES}
            className="flex items-center gap-3 px-4 py-3 rounded text-[15px] font-medium text-neutral no-underline hover:bg-[#f8f9fa] hover:text-[#202124] transition-colors"
          >
            <Bell size={18} />
            메시지
            {badgeCount > 0 && (
              <span className="ml-auto bg-danger text-white rounded-[10px] px-1.5 py-px text-xs font-bold">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </Link>
          <Link
            to={ROUTES.SETTINGS_WITHDRAW}
            className="flex items-center gap-3 px-4 py-3 rounded text-[15px] font-medium text-neutral no-underline hover:bg-[#f8f9fa] hover:text-[#202124] transition-colors"
          >
            <Settings size={18} />
            계정 설정
          </Link>
          <button
            className="flex items-center gap-3 px-4 py-3 rounded text-[15px] font-medium text-neutral bg-transparent border-0 cursor-pointer font-sans w-full text-left hover:bg-[#f8f9fa] hover:text-[#202124] transition-colors"
            onClick={() => void handleLogout()}
          >
            <LogOut size={18} />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="flex-1 px-8 py-6 md:px-4 md:py-3">
        <div className="max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
