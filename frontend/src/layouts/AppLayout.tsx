import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import './AppLayout.css';

interface AppLayoutProps {
  onLogout?: () => void;
}

export default function AppLayout({ onLogout }: AppLayoutProps) {
  const { data: messages = [] } = useMessages();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const badgeCount = messages.length;

  async function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      void navigate(ROUTES.LOGIN);
    }
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__inner">
          <span className="app-header__logo">공동 가계부</span>
          <div className="app-header__actions">
            <Link
              to={ROUTES.MESSAGES}
              className="app-header__notification"
              aria-label={`메시지 ${badgeCount > 0 ? `${badgeCount}개` : ''}`}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, textDecoration: 'none', color: 'inherit' }}
            >
              <Bell size={20} />
              {badgeCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#d93025',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                  aria-hidden="true"
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </Link>
            <Link
              to={ROUTES.SETTINGS_WITHDRAW}
              className="app-header__settings"
              aria-label="계정 설정"
            >
              <Settings size={16} />
            </Link>
            <button
              className="app-header__logout"
              type="button"
              onClick={() => void handleLogout()}
              aria-label="로그아웃"
            >
              <LogOut size={16} style={{ marginRight: 4 }} />
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="app-main__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
