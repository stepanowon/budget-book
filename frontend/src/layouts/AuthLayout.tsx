import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-card__title">공동 가계부</h1>
        <Outlet />
      </div>
    </div>
  );
}
