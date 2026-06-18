import { hashPassword, comparePassword } from '../../src/lib/crypto';

describe('비밀번호 해싱 유틸 (lib/crypto.ts)', () => {
  it('비밀번호를 해시화한다', async () => {
    const hash = await hashPassword('MyPassword1!');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('MyPassword1!');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('올바른 비밀번호로 비교 시 true를 반환한다', async () => {
    const hash = await hashPassword('MyPassword1!');
    const result = await comparePassword('MyPassword1!', hash);
    expect(result).toBe(true);
  });

  it('잘못된 비밀번호로 비교 시 false를 반환한다', async () => {
    const hash = await hashPassword('MyPassword1!');
    const result = await comparePassword('WrongPassword', hash);
    expect(result).toBe(false);
  });

  it('동일 비밀번호라도 해시는 매번 다르다 (salt 적용)', async () => {
    const hash1 = await hashPassword('MyPassword1!');
    const hash2 = await hashPassword('MyPassword1!');
    expect(hash1).not.toBe(hash2);
  });
});
