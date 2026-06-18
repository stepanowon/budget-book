import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white rounded-lg p-8 shadow-[0_2px_6px_rgba(60,64,67,0.15)]">
        <h1 className="text-xl font-semibold text-primary text-center mb-8 tracking-tight">
          공동 가계부
        </h1>
        <Outlet />
      </div>
    </div>
  );
}
