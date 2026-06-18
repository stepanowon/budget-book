import { Request, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { ForbiddenError, NotFoundError } from './errorHandler.middleware';
import { ROLE } from '../constants/roles';

export function requireGroupMember(req: Request, res: Response, next: NextFunction): void {
  checkGroupMembership(req, res, next, false);
}

export function requireGroupManager(req: Request, res: Response, next: NextFunction): void {
  checkGroupMembership(req, res, next, true);
}

async function checkGroupMembership(
  req: Request,
  res: Response,
  next: NextFunction,
  requireManager: boolean,
): Promise<void> {
  const userId = req.user?.id;
  const groupId = req.params.groupId;

  if (!userId || !groupId) {
    return next(new ForbiddenError('접근 권한이 없습니다.'));
  }

  try {
    // 그룹 존재 여부 확인
    const [group] = await sql`SELECT id, status FROM groups WHERE id = ${groupId}`;
    if (!group) {
      return next(new NotFoundError('그룹을 찾을 수 없습니다.'));
    }

    // 멤버십 확인
    const [member] = await sql`
      SELECT role FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}
    `;
    if (!member) {
      return next(new ForbiddenError('해당 그룹의 멤버가 아닙니다.'));
    }

    const memberRow = member as unknown as { role: string };
    if (requireManager && memberRow.role !== ROLE.MANAGER) {
      return next(new ForbiddenError('MANAGER 권한이 필요합니다.'));
    }

    // req에 groupRole 주입 (컨트롤러에서 사용)
    (req as Request & { groupRole?: string }).groupRole = memberRow.role;
    next();
  } catch {
    next(new ForbiddenError('권한 확인 중 오류가 발생했습니다.'));
  }
}
