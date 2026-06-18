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

const formInput =
  'w-full h-10 px-3 border border-border rounded text-sm text-[#202124] bg-white font-sans box-border outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors';
const formInputError =
  'w-full h-10 px-3 border border-danger rounded text-sm text-[#202124] bg-danger-light font-sans box-border outline-none focus:border-danger focus:ring-2 focus:ring-primary-light transition-colors';
const labelRequired =
  'block text-xs font-medium text-neutral mb-1 after:content-["_*"] after:text-danger';

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
    <div className="max-w-[480px] mx-auto">
      <h1 className="text-[22px] font-medium text-[#202124] m-0 mb-6">그룹 만들기</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className={labelRequired} htmlFor="group-name">
            그룹명
          </label>
          <input
            id="group-name"
            className={errors.name ? formInputError : formInput}
            type="text"
            placeholder="그룹명을 입력하세요"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <span className="block text-xs font-medium text-neutral mb-1">유형</span>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#202124] min-h-[44px] px-2">
              <input
                type="radio"
                name="group-type"
                value="UNLIMITED"
                checked={form.type === 'UNLIMITED'}
                onChange={() => setForm((prev) => ({ ...prev, type: 'UNLIMITED', end_date: '' }))}
              />
              상시
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#202124] min-h-[44px] px-2">
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

        <div className="mb-4">
          <label className={labelRequired} htmlFor="group-start-date">
            시작일
          </label>
          <input
            id="group-start-date"
            className={formInput}
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
          />
        </div>

        {form.type === 'LIMITED' && (
          <div className="mb-4">
            <label className={labelRequired} htmlFor="group-end-date">
              종료일
            </label>
            <input
              id="group-end-date"
              className={errors.end_date ? formInputError : formInput}
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
            />
            {errors.end_date && <p className="text-xs text-danger mt-1">{errors.end_date}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="inline-flex items-center justify-center px-6 py-2 bg-transparent text-primary border border-border rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-light hover:border-[#c5d9f6] transition-colors"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white border-0 rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-dark transition-colors disabled:bg-border disabled:text-[#bdc1c6] disabled:cursor-not-allowed"
            disabled={isPending}
          >
            {isPending ? '생성 중...' : '그룹 만들기'}
          </button>
        </div>
      </form>
    </div>
  );
}
