import {
  createGroup,
  getMyGroups,
  getGroupDetail,
  updateGroup,
  deactivateGroup,
  sendInvitation,
  getGroupInvitations,
  respondToInvitation,
  removeGroupMember,
} from '../../src/services/group.service';
import * as groupRepo from '../../src/repositories/group.repository';
import * as invitationRepo from '../../src/repositories/invitation.repository';
import * as userRepo from '../../src/repositories/user.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../../src/middlewares/errorHandler.middleware';

jest.mock('../../src/repositories/group.repository');
jest.mock('../../src/repositories/invitation.repository');
jest.mock('../../src/repositories/user.repository');

const mockGroupRepo = groupRepo as jest.Mocked<typeof groupRepo>;
const mockInvitationRepo = invitationRepo as jest.Mocked<typeof invitationRepo>;
const mockUserRepo = userRepo as jest.Mocked<typeof userRepo>;

const mockGroup = {
  id: 'group-uuid',
  name: '테스트 그룹',
  type: 'UNLIMITED' as const,
  status: 'active' as const,
  start_date: '2026-06-01',
  end_date: null,
  created_by: 'user-uuid',
  created_at: new Date().toISOString(),
};

// 목록·상세 조회 응답은 my_role, member_count를 포함한다
const mockGroupForUser = { ...mockGroup, my_role: 'MANAGER', member_count: 1 };

const mockUser = {
  id: 'user-uuid',
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hash',
  status: 'active' as const,
  created_at: new Date().toISOString(),
};

const mockInvitee = {
  id: 'invitee-uuid',
  username: 'invitee',
  email: 'invitee@example.com',
  password_hash: 'hash',
  status: 'active' as const,
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('group.service — createGroup (BE-14)', () => {
  it('그룹 생성 성공 및 MANAGER 자동 등록', async () => {
    mockGroupRepo.createGroup.mockResolvedValue(mockGroup);
    mockGroupRepo.addGroupMember.mockResolvedValue({
      id: 'm1',
      group_id: 'group-uuid',
      user_id: 'user-uuid',
      role: 'MANAGER',
      joined_at: new Date().toISOString(),
    });

    const result = await createGroup('user-uuid', {
      name: '테스트 그룹',
      type: 'UNLIMITED',
      start_date: '2026-06-01',
    });
    expect(result.id).toBe('group-uuid');
    expect(mockGroupRepo.addGroupMember).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'MANAGER', user_id: 'user-uuid' }),
    );
  });
});

describe('group.service — getMyGroups (BE-14)', () => {
  it('사용자의 그룹 목록 반환', async () => {
    mockGroupRepo.findGroupsByUserId.mockResolvedValue([mockGroupForUser]);
    const result = await getMyGroups('user-uuid');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('group-uuid');
  });
});

describe('group.service — getGroupDetail (BE-15)', () => {
  it('그룹 상세 조회 성공 (멤버 포함)', async () => {
    mockGroupRepo.findGroupByIdForUser.mockResolvedValue(mockGroupForUser);
    mockGroupRepo.findGroupMembers.mockResolvedValue([
      { id: 'm1', group_id: 'group-uuid', user_id: 'user-uuid', role: 'MANAGER', joined_at: new Date().toISOString(), username: 'testuser' },
    ]);

    const result = await getGroupDetail('group-uuid', 'user-uuid');
    expect(mockGroupRepo.findGroupByIdForUser).toHaveBeenCalledWith('group-uuid', 'user-uuid');
    expect(result.id).toBe('group-uuid');
    expect(result.my_role).toBe('MANAGER');
    expect(result.members).toHaveLength(1);
  });

  it('존재하지 않는 그룹 조회 시 NotFoundError', async () => {
    mockGroupRepo.findGroupByIdForUser.mockResolvedValue(null);
    await expect(getGroupDetail('nonexistent', 'user-uuid')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('group.service — updateGroup (BE-15)', () => {
  it('그룹 수정 성공', async () => {
    mockGroupRepo.findGroupById.mockResolvedValue(mockGroup);
    mockGroupRepo.updateGroup.mockResolvedValue({ ...mockGroup, name: '수정된 그룹' });

    const result = await updateGroup('group-uuid', { name: '수정된 그룹' });
    expect(result.name).toBe('수정된 그룹');
  });

  it('존재하지 않는 그룹 수정 시 NotFoundError', async () => {
    mockGroupRepo.findGroupById.mockResolvedValue(null);
    await expect(updateGroup('nonexistent', { name: '새이름' })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('group.service — deactivateGroup (BE-15)', () => {
  it('그룹 비활성화 성공', async () => {
    mockGroupRepo.findGroupById.mockResolvedValue(mockGroup);
    mockGroupRepo.deactivateGroup.mockResolvedValue();

    await deactivateGroup('group-uuid');
    expect(mockGroupRepo.deactivateGroup).toHaveBeenCalledWith('group-uuid');
  });

  it('존재하지 않는 그룹 비활성화 시 NotFoundError', async () => {
    mockGroupRepo.findGroupById.mockResolvedValue(null);
    await expect(deactivateGroup('nonexistent')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('group.service — getGroupInvitations (BE-16)', () => {
  it('그룹 초대 목록 반환', async () => {
    const mockInvitations = [
      {
        id: 'inv-1', group_id: 'group-uuid', inviter_id: 'user-uuid',
        invitee_id: 'invitee-uuid', status: 'PENDING' as const,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
    mockInvitationRepo.findGroupInvitations.mockResolvedValue(mockInvitations);

    const result = await getGroupInvitations('group-uuid');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('PENDING');
  });
});

describe('group.service — sendInvitation (BE-16)', () => {
  it('유효한 초대 발송 성공 (AC-I1)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(mockInvitee);
    mockGroupRepo.findMembership.mockResolvedValue(null);
    mockInvitationRepo.findPendingInvitation.mockResolvedValue(null);
    mockInvitationRepo.createInvitation.mockResolvedValue({
      id: 'inv-uuid',
      group_id: 'group-uuid',
      inviter_id: 'user-uuid',
      invitee_id: 'invitee-uuid',
      status: 'PENDING',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });

    const result = await sendInvitation('group-uuid', 'user-uuid', 'invitee');
    expect(result.status).toBe('PENDING');
  });

  it('이미 멤버인 경우 ConflictError (AC-I2)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(mockInvitee);
    mockGroupRepo.findMembership.mockResolvedValue({
      id: 'm1',
      group_id: 'g1',
      user_id: 'invitee-uuid',
      role: 'MEMBER',
      joined_at: new Date().toISOString(),
    });

    await expect(sendInvitation('group-uuid', 'user-uuid', 'invitee')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('중복 PENDING 초대 시 ConflictError (AC-I3)', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(mockInvitee);
    mockGroupRepo.findMembership.mockResolvedValue(null);
    mockInvitationRepo.findPendingInvitation.mockResolvedValue({
      id: 'inv-uuid',
      group_id: 'group-uuid',
      inviter_id: 'user-uuid',
      invitee_id: 'invitee-uuid',
      status: 'PENDING',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });

    await expect(sendInvitation('group-uuid', 'user-uuid', 'invitee')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('존재하지 않는 사용자 초대 시 NotFoundError', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue(null);
    await expect(sendInvitation('group-uuid', 'user-uuid', 'nobody')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('비활성화된 사용자 초대 시 NotFoundError', async () => {
    mockUserRepo.findUserByUsername.mockResolvedValue({ ...mockInvitee, status: 'inactive' });
    await expect(sendInvitation('group-uuid', 'user-uuid', 'invitee')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('group.service — respondToInvitation (BE-17)', () => {
  const pendingInvitation = {
    id: 'inv-uuid',
    group_id: 'group-uuid',
    inviter_id: 'user-uuid',
    invitee_id: 'invitee-uuid',
    status: 'PENDING' as const,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  };

  it('ACCEPT 처리 시 group_members 생성 (AC-I4)', async () => {
    mockInvitationRepo.findInvitationById
      .mockResolvedValueOnce(pendingInvitation)
      .mockResolvedValueOnce({ ...pendingInvitation, status: 'ACCEPTED' });
    mockInvitationRepo.updateInvitationStatus.mockResolvedValue({
      ...pendingInvitation,
      status: 'ACCEPTED',
    });
    mockGroupRepo.addGroupMember.mockResolvedValue({
      id: 'm2',
      group_id: 'group-uuid',
      user_id: 'invitee-uuid',
      role: 'MEMBER',
      joined_at: new Date().toISOString(),
    });

    await respondToInvitation('inv-uuid', 'invitee-uuid', 'ACCEPT');
    expect(mockGroupRepo.addGroupMember).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'MEMBER', user_id: 'invitee-uuid' }),
    );
  });

  it('DECLINE 처리 시 group_members 미생성', async () => {
    mockInvitationRepo.findInvitationById
      .mockResolvedValueOnce(pendingInvitation)
      .mockResolvedValueOnce({ ...pendingInvitation, status: 'DECLINED' });
    mockInvitationRepo.updateInvitationStatus.mockResolvedValue({
      ...pendingInvitation,
      status: 'DECLINED',
    });

    await respondToInvitation('inv-uuid', 'invitee-uuid', 'DECLINE');
    expect(mockGroupRepo.addGroupMember).not.toHaveBeenCalled();
  });

  it('만료된 초대 수락 시도 시 ValidationError', async () => {
    mockInvitationRepo.findInvitationById.mockResolvedValue({
      ...pendingInvitation,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    mockInvitationRepo.updateInvitationStatus.mockResolvedValue({
      ...pendingInvitation,
      status: 'EXPIRED',
    });

    await expect(
      respondToInvitation('inv-uuid', 'invitee-uuid', 'ACCEPT'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('타인의 초대 처리 시 ForbiddenError', async () => {
    mockInvitationRepo.findInvitationById.mockResolvedValue(pendingInvitation);
    await expect(
      respondToInvitation('inv-uuid', 'other-user-uuid', 'ACCEPT'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('이미 처리된 초대 시 ValidationError', async () => {
    mockInvitationRepo.findInvitationById.mockResolvedValue({
      ...pendingInvitation,
      status: 'ACCEPTED',
    });

    await expect(
      respondToInvitation('inv-uuid', 'invitee-uuid', 'ACCEPT'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('존재하지 않는 초대 시 NotFoundError', async () => {
    mockInvitationRepo.findInvitationById.mockResolvedValue(null);
    await expect(
      respondToInvitation('inv-uuid', 'invitee-uuid', 'ACCEPT'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('group.service — removeGroupMember (BE-17)', () => {
  it('MANAGER 본인 제거 시 ValidationError', async () => {
    mockGroupRepo.findMembership.mockResolvedValue({
      id: 'm1',
      group_id: 'g1',
      user_id: 'manager-uuid',
      role: 'MANAGER',
      joined_at: new Date().toISOString(),
    });

    await expect(
      removeGroupMember('g1', 'manager-uuid', 'manager-uuid'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('일반 멤버 제거 성공', async () => {
    mockGroupRepo.findMembership
      .mockResolvedValueOnce({
        id: 'm1',
        group_id: 'g1',
        user_id: 'manager-uuid',
        role: 'MANAGER',
        joined_at: new Date().toISOString(),
      })
      .mockResolvedValueOnce({
        id: 'm2',
        group_id: 'g1',
        user_id: 'member-uuid',
        role: 'MEMBER',
        joined_at: new Date().toISOString(),
      });
    mockGroupRepo.removeGroupMember.mockResolvedValue();

    await removeGroupMember('g1', 'member-uuid', 'manager-uuid');
    expect(mockGroupRepo.removeGroupMember).toHaveBeenCalledWith('g1', 'member-uuid');
  });

  it('존재하지 않는 멤버 제거 시 NotFoundError', async () => {
    mockGroupRepo.findMembership
      .mockResolvedValueOnce({
        id: 'm1',
        group_id: 'g1',
        user_id: 'manager-uuid',
        role: 'MANAGER',
        joined_at: new Date().toISOString(),
      })
      .mockResolvedValueOnce(null);

    await expect(
      removeGroupMember('g1', 'nonexistent-uuid', 'manager-uuid'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
