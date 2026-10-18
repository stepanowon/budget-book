import * as groupRepo from '../repositories/group.repository';
import * as invitationRepo from '../repositories/invitation.repository';
import * as userRepo from '../repositories/user.repository';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../middlewares/errorHandler.middleware';
import { ROLE, INVITATION_STATUS } from '../constants/roles';
import { INVITATION_EXPIRE_DAYS } from '../constants/expense';
import { Group, Invitation } from '../types/domain';

// 그룹 생성 (BE-14)
export async function createGroup(
  userId: string,
  params: {
    name: string;
    type: string;
    start_date: string;
    end_date?: string | null;
  },
): Promise<Group> {
  const group = await groupRepo.createGroup({ ...params, created_by: userId });
  await groupRepo.addGroupMember({ group_id: group.id, user_id: userId, role: ROLE.MANAGER });
  console.info('[GROUP] Created', { groupId: group.id, userId });
  return group;
}

// 그룹 목록 조회 (BE-14)
export async function getMyGroups(userId: string): Promise<Group[]> {
  return groupRepo.findGroupsByUserId(userId);
}

// 그룹 상세 조회 (BE-15)
export async function getGroupDetail(groupId: string, userId: string) {
  const group = await groupRepo.findGroupByIdForUser(groupId, userId);
  if (!group) throw new NotFoundError('그룹을 찾을 수 없습니다.');
  const members = await groupRepo.findGroupMembers(groupId);
  return { ...group, members };
}

export async function getGroupMembers(groupId: string) {
  return groupRepo.findGroupMembers(groupId);
}

// 그룹 수정 (BE-15) - MANAGER만 가능
export async function updateGroup(
  groupId: string,
  params: {
    name?: string;
    type?: string;
    start_date?: string;
    end_date?: string | null;
  },
): Promise<Group> {
  const group = await groupRepo.findGroupById(groupId);
  if (!group) throw new NotFoundError('그룹을 찾을 수 없습니다.');
  const updated = await groupRepo.updateGroup(groupId, params);
  console.info('[GROUP] Updated', { groupId });
  return updated;
}

// 그룹 비활성화 (BE-15) - MANAGER만 가능
export async function deactivateGroup(groupId: string): Promise<void> {
  const group = await groupRepo.findGroupById(groupId);
  if (!group) throw new NotFoundError('그룹을 찾을 수 없습니다.');
  await groupRepo.deactivateGroup(groupId);
  console.info('[GROUP] Deactivated', { groupId });
}

// 초대 발송 (BE-16) - MANAGER만 가능
export async function sendInvitation(
  groupId: string,
  inviterId: string,
  inviteeUsername: string,
): Promise<Invitation> {
  const invitee = await userRepo.findUserByUsername(inviteeUsername);
  if (!invitee) throw new NotFoundError('존재하지 않는 사용자입니다.');
  if (invitee.status === 'inactive') throw new NotFoundError('존재하지 않는 사용자입니다.');

  // 이미 멤버인지 확인 (AC-I2)
  const existingMember = await groupRepo.findMembership(groupId, invitee.id);
  if (existingMember) throw new ConflictError('이미 그룹 멤버입니다.');

  // 중복 PENDING 초대 확인 (AC-I3)
  const pendingInvitation = await invitationRepo.findPendingInvitation(groupId, invitee.id);
  if (pendingInvitation) throw new ConflictError('이미 대기 중인 초대가 있습니다.');

  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const invitation = await invitationRepo.createInvitation({
    group_id: groupId,
    inviter_id: inviterId,
    invitee_id: invitee.id,
    expires_at: expiresAt,
  });

  console.info('[INVITATION] Sent', { groupId, inviteeId: invitee.id });
  return invitation;
}

// 초대 목록 조회 (BE-16)
export async function getGroupInvitations(groupId: string): Promise<Invitation[]> {
  return invitationRepo.findGroupInvitations(groupId);
}

// 내 초대 목록 조회
export async function getMyInvitations(userId: string) {
  return invitationRepo.findMyInvitations(userId);
}

// 초대 수락/거절 (BE-17)
export async function respondToInvitation(
  invitationId: string,
  userId: string,
  action: string,
): Promise<Invitation | null> {
  const invitation = await invitationRepo.findInvitationById(invitationId);
  if (!invitation) throw new NotFoundError('초대를 찾을 수 없습니다.');
  if (invitation.invitee_id !== userId) throw new ForbiddenError('본인의 초대만 처리할 수 있습니다.');
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw new ValidationError('이미 처리된 초대입니다.');
  }
  if (new Date(invitation.expires_at) < new Date()) {
    await invitationRepo.updateInvitationStatus(invitationId, INVITATION_STATUS.EXPIRED);
    throw new ValidationError('만료된 초대입니다.');
  }

  if (action === 'ACCEPT') {
    await invitationRepo.updateInvitationStatus(invitationId, INVITATION_STATUS.ACCEPTED);
    await groupRepo.addGroupMember({
      group_id: invitation.group_id,
      user_id: userId,
      role: ROLE.MEMBER,
    });
    console.info('[INVITATION] Accepted', { invitationId, userId });
  } else {
    await invitationRepo.updateInvitationStatus(invitationId, INVITATION_STATUS.DECLINED);
    console.info('[INVITATION] Declined', { invitationId, userId });
  }

  return invitationRepo.findInvitationById(invitationId);
}

// 멤버 제거 (BE-17) - MANAGER만 가능
export async function removeGroupMember(
  groupId: string,
  targetUserId: string,
  requesterId: string,
): Promise<void> {
  // MANAGER 본인 제거 불가
  const requesterMembership = await groupRepo.findMembership(groupId, requesterId);
  if (requesterMembership?.role === ROLE.MANAGER && requesterId === targetUserId) {
    throw new ValidationError('MANAGER는 본인을 제거할 수 없습니다.');
  }

  const targetMembership = await groupRepo.findMembership(groupId, targetUserId);
  if (!targetMembership) throw new NotFoundError('해당 멤버를 찾을 수 없습니다.');

  await groupRepo.removeGroupMember(groupId, targetUserId);
  console.info('[GROUP] Member removed', { groupId, targetUserId });
}
