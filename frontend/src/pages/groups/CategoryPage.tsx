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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="카테고리 목록을 불러오는 데 실패했습니다." />;
  }

  return (
    <>
      <style>{`
        .category-page {
          padding: var(--space-6) var(--space-8);
          max-width: 640px;
          margin: 0 auto;
        }
        .category-page__title {
          font-size: 22px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-6);
        }
        .category-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
        }
        .category-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }
        .category-item__info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .category-item__name {
          font-size: 14px;
          color: var(--color-text-primary);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          height: 22px;
          padding: 0 10px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .badge--system {
          background: var(--color-border-light);
          color: var(--color-text-secondary);
        }
        .badge--group {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }
        .add-form {
          display: flex;
          gap: var(--space-2);
          align-items: flex-end;
        }
        .add-form__input-wrap {
          flex: 1;
        }
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-1);
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
        .form-error {
          font-size: 12px;
          color: var(--color-danger);
          margin-top: var(--space-1);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 20px;
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
        .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
        .btn-primary:disabled {
          background: var(--color-border);
          color: var(--color-text-disabled);
          cursor: not-allowed;
        }
        .btn-outlined {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 19px;
          background: transparent;
          color: var(--color-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          transition: background var(--transition-fast);
        }
        .btn-outlined:hover { background: var(--color-primary-light); }
        .btn-danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 14px;
          background: transparent;
          color: var(--color-danger);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-family);
          cursor: pointer;
          min-height: 44px;
          min-width: 44px;
          transition: background var(--transition-fast);
        }
        .btn-danger:hover { background: var(--color-danger-light); }
        .btn-danger--filled {
          background: var(--color-danger);
          color: #fff;
        }
        .btn-danger--filled:hover { background: #b71c1c; }
        .modal-footer-btns {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
        }
        .delete-warning {
          font-size: 13px;
          color: var(--color-danger);
          margin-top: var(--space-2);
        }
        .confirm-text {
          font-size: 14px;
          color: var(--color-text-primary);
          margin: 0;
        }
        .section-divider {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: var(--space-6) 0;
        }
      `}</style>

      <div className="category-page">
        <h1 className="category-page__title">카테고리 관리</h1>

        <ul className="category-list" role="list">
          {(categories ?? []).map((cat) => (
            <li key={cat.id} className="category-item">
              <div className="category-item__info">
                <span className="category-item__name">{cat.name}</span>
                <span className={`badge badge--${cat.type === 'SYSTEM' ? 'system' : 'group'}`}>
                  {cat.type === 'SYSTEM' ? 'SYSTEM' : 'GROUP'}
                </span>
              </div>
              {isManager && cat.type === 'GROUP' && (
                <button
                  className="btn-danger"
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
            <hr className="section-divider" />
            <form className="add-form" onSubmit={handleAddSubmit} noValidate>
              <div className="add-form__input-wrap">
                <label className="form-label" htmlFor="category-name">
                  새 카테고리 이름
                </label>
                <input
                  id="category-name"
                  className="form-input"
                  type="text"
                  placeholder="카테고리 이름 입력"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setAddError('');
                  }}
                />
                {addError && <p className="form-error">{addError}</p>}
              </div>
              <button
                className="btn-primary"
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
          <div className="modal-footer-btns">
            <button className="btn-outlined" onClick={() => setDeletingCategory(null)}>
              취소
            </button>
            <button
              className="btn-danger btn-danger--filled"
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
        <p className="confirm-text">
          <strong>{deletingCategory?.name ?? ''}</strong> 카테고리를 삭제하시겠습니까?
        </p>
        <p className="delete-warning">
          삭제 시 해당 카테고리 지출은 기타로 재분류됩니다.
        </p>
      </Modal>
    </>
  );
}
