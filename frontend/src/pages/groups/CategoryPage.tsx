import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as categoryApi from '@/api/categoryApi';
import { useGroup } from '@/hooks/useGroups';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import Modal from '@/components/common/Modal';
import type { CategoryResponse } from '@/types/api';

const CATEGORY_KEYS = {
  list: (groupId: string) => ['categories', groupId] as const,
};

const btnOutlined =
  'inline-flex items-center justify-center px-5 py-2 bg-transparent text-primary border border-border rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-light transition-colors';
const btnDangerSm =
  'inline-flex items-center justify-center px-3.5 py-1.5 bg-transparent text-danger border border-danger rounded text-[13px] font-medium font-sans cursor-pointer min-h-[44px] min-w-[44px] hover:bg-danger-light transition-colors';
const btnDangerFilled =
  'inline-flex items-center justify-center px-5 py-2 bg-danger text-white border-0 rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-[#b71c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const formInput =
  'w-full h-10 px-3 border border-border rounded text-sm text-[#202124] bg-white font-sans box-border outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors';

export default function CategoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const id = groupId ?? '';

  const queryClient = useQueryClient();
  const { data: group } = useGroup(id);
  const isManager = group?.my_role === 'MANAGER';

  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    queryKey: CATEGORY_KEYS.list(id),
    queryFn: () => categoryApi.getCategories(id),
    enabled: Boolean(id),
  });

  const { mutate: addCategory, isPending: isAdding } = useMutation({
    mutationFn: (name: string) => categoryApi.addGroupCategory(id, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.list(id) });
      setNewName('');
      setAddError('');
    },
    onError: () => {
      setAddError('카테고리 추가에 실패했습니다.');
    },
  });

  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: (categoryId: string) =>
      categoryApi.deleteGroupCategory(id, categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.list(id) });
      setDeletingCategory(null);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError('카테고리 이름을 입력해주세요.');
      return;
    }
    addCategory(trimmed);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="카테고리 목록을 불러오는 데 실패했습니다." />;
  }

  return (
    <>
      <div className="max-w-[640px] mx-auto">
        <h1 className="text-[22px] font-medium text-[#202124] m-0 mb-6">카테고리 관리</h1>

        <ul className="flex flex-col gap-2 mb-6" role="list">
          {(categories ?? []).map((cat) => (
            <li key={cat.id} className="flex items-center justify-between px-4 py-3 bg-white border border-border rounded">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#202124]">{cat.name}</span>
                <span
                  className={`inline-flex items-center h-[22px] px-2.5 rounded-pill text-xs font-medium whitespace-nowrap ${
                    cat.scope === 'SYSTEM'
                      ? 'bg-border text-neutral'
                      : 'bg-primary-light text-primary'
                  }`}
                >
                  {cat.scope === 'SYSTEM' ? 'SYSTEM' : 'GROUP'}
                </span>
              </div>
              {isManager && cat.scope === 'GROUP' && (
                <button
                  className={btnDangerSm}
                  onClick={() => setDeletingCategory(cat)}
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>

        {isManager && (
          <>
            <hr className="border-0 border-t border-border my-6" />
            <form className="flex gap-2 items-end" onSubmit={handleAddSubmit} noValidate>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral mb-1" htmlFor="category-name">
                  새 카테고리 이름
                </label>
                <input
                  id="category-name"
                  className={formInput}
                  type="text"
                  placeholder="카테고리 이름 입력"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setAddError('');
                  }}
                />
                {addError && <p className="text-xs text-danger mt-1">{addError}</p>}
              </div>
              <button
                className="inline-flex items-center justify-center px-5 py-2 bg-primary text-white border-0 rounded text-sm font-medium font-sans cursor-pointer min-h-[44px] hover:bg-primary-dark transition-colors disabled:bg-border disabled:text-[#bdc1c6] disabled:cursor-not-allowed"
                type="submit"
                disabled={isAdding || !newName.trim()}
              >
                {isAdding ? '추가 중...' : '추가'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        title="카테고리 삭제"
        footer={
          <div className="flex justify-end gap-2">
            <button className={btnOutlined} onClick={() => setDeletingCategory(null)}>
              취소
            </button>
            <button
              className={btnDangerFilled}
              onClick={() => {
                if (deletingCategory) deleteCategory(deletingCategory.id);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[#202124] m-0">
          <strong>{deletingCategory?.name ?? ''}</strong> 카테고리를 삭제하시겠습니까?
        </p>
        <p className="text-[13px] text-danger mt-2">
          삭제 시 해당 카테고리 지출은 기타로 재분류됩니다.
        </p>
      </Modal>
    </>
  );
}
