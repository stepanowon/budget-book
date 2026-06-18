import { Request, Response, NextFunction } from 'express';
import * as groupService from '../services/group.service';
import { HTTP_STATUS } from '../constants/errorCodes';

export async function createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.createGroup(req.user!.id, req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
}

export async function getMyGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await groupService.getMyGroups(req.user!.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
}

export async function getGroupDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const group = await groupService.getGroupDetail(req.params.groupId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.updateGroup(req.params.groupId, req.body);
    res.status(HTTP_STATUS.OK).json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
}

export async function deactivateGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await groupService.deactivateGroup(req.params.groupId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: '그룹이 비활성화되었습니다.' } });
  } catch (err) {
    next(err);
  }
}

export async function sendInvitation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitation = await groupService.sendInvitation(
      req.params.groupId,
      req.user!.id,
      req.body.invitee_username,
    );
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: invitation });
  } catch (err) {
    next(err);
  }
}

export async function getGroupInvitations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const invitations = await groupService.getGroupInvitations(req.params.groupId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: invitations });
  } catch (err) {
    next(err);
  }
}

export async function respondToInvitation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await groupService.respondToInvitation(
      req.params.invitationId,
      req.user!.id,
      req.body.action,
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function removeGroupMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await groupService.removeGroupMember(req.params.groupId, req.params.userId, req.user!.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: '멤버가 제거되었습니다.' } });
  } catch (err) {
    next(err);
  }
}
