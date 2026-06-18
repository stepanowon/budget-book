import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroup } from '@/hooks/useGroups';
import { ROUTES } from '@/constants/routes';
import type { GroupType } from '@/types/domain';

interface FormState {
  name: string;
  type: GroupType;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  name?: string;
  end_date?: string;
}

export default function GroupCreatePage() {
  const navigate = useNavigate();
  const { mutate: createGroup, isPending } = useCreateGroup();

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<FormState>({
    name: '',
    type: 'UNLIMITED',
    start_date: today,
    end_date: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = '그룹명을 입력해주세요.';
    }

    if (form.type === 'LIMITED') {
      if (!form.end_date) {
        newErrors.end_date = '종료일을 입력해주세요.';
      } else if (form.end_date <= form.start_date) {
        newErrors.end_date = '종료일은 시작일 이후여야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createGroup(
      {
        name: form.name.trim(),
        type: form.type,
        start_date: form.start_date,
        end_date: form.type === 'LIMITED' ? form.end_date : null,
      },
      {
        onSuccess: (newGroup) => {
          navigate(ROUTES.GROUP_DETAIL(newGroup.id));
        },
      },
    );
  };

  return (
    <>
      <style>{`
        .group-create-page {
          padding: var(--space-6) var(--space-8);
          max-width: 480px;
          margin: 0 auto;
        }
        .group-create-page__title {
          font-size: 22px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-6);
        }
        .form-group {
          margin-bottom: var(--space-4);
        }
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-1);
        }
        .form-label--required::after {
          content: ' *';
          color: var(--color-danger);
        }
        .form-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--color-text-primary);
          background: var(--color-surface);
          font-family: var(--font-family);
          box-sizing: border-box;
          transition: border-color var(--transition-fast);
        }
        .form-input:focus {
          border-color: var(--color-primary);
          outline: 2px solid var(--color-primary-light);
          outline-offset: 0;
        }
        .form-input--error {
          border-color: var(--color-danger);
          background: var(--color-danger-light);
        }
        .form-error {
          font-size: 12px;
          color: var(--color-danger);
          margin-top: var(--space-1);
        }
        .type-options {
          display: flex;
          gap: var(--space-3);
        }
        .type-option {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          font-size: 14px;
          color: var(--color-text-primary);
          min-height: 44px;
          padding: 0 var(--space-2);
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
          margin-top: var(--space-6);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 24px;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          transition: background var(--transition-fast);
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }
        .btn-primary:disabled {
          background: var(--color-border);
          color: var(--color-text-disabled);
          cursor: not-allowed;
        }
        .btn-outlined {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 23px;
          background: transparent;
          color: var(--color-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          transition: background var(--transition-fast), border-color var(--transition-fast);
        }
        .btn-outlined:hover {
          background: var(--color-primary-light);
          border-color: #c5d9f6;
        }
      `}</style>
      <div className="group-create-page">
        <h1 className="group-create-page__title">그룹 만들기</h1>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label form-label--required" htmlFor="group-name">
              그룹명
            </label>
            <input
              id="group-name"
              className={`form-input${errors.name ? ' form-input--error' : ''}`}
              type="text"
              placeholder="그룹명을 입력하세요"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <span className="form-label">유형</span>
            <div className="type-options">
              <label className="type-option">
                <input
                  type="radio"
                  name="group-type"
                  value="UNLIMITED"
                  checked={form.type === 'UNLIMITED'}
                  onChange={() => setForm((prev) => ({ ...prev, type: 'UNLIMITED', end_date: '' }))}
                />
                상시
              </label>
              <label className="type-option">
                <input
                  type="radio"
                  name="group-type"
                  value="LIMITED"
                  checked={form.type === 'LIMITED'}
                  onChange={() => setForm((prev) => ({ ...prev, type: 'LIMITED' }))}
                />
                기간제
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label--required" htmlFor="group-start-date">
              시작일
            </label>
            <input
              id="group-start-date"
              className="form-input"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
            />
          </div>

          {form.type === 'LIMITED' && (
            <div className="form-group">
              <label className="form-label form-label--required" htmlFor="group-end-date">
                종료일
              </label>
              <input
                id="group-end-date"
                className={`form-input${errors.end_date ? ' form-input--error' : ''}`}
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
              />
              {errors.end_date && <p className="form-error">{errors.end_date}</p>}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-outlined" onClick={() => navigate(-1)}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? '생성 중...' : '그룹 만들기'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
