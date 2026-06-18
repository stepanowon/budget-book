import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/lib/jwt';
import { UserPayload } from '../../src/types/domain';

const mockUser: UserPayload = {
  id: 'test-uuid-1234',
  username: 'testuser',
  status: 'active',
};

describe('JWT 유틸 (lib/jwt.ts)', () => {
  describe('signAccessToken / verifyAccessToken', () => {
    it('유효한 페이로드로 Access Token을 생성하고 검증할 수 있다', () => {
      const token = signAccessToken(mockUser);
      expect(typeof token).toBe('string');
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.status).toBe(mockUser.status);
    });

    it('만료된 Access Token 검증 시 오류가 발생한다', () => {
      // 음수 expiresIn으로 즉시 만료 토큰 생성
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: mockUser.id, username: mockUser.username, status: mockUser.status },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: -1 },
      );
      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });

    it('잘못된 시크릿으로 서명된 토큰은 검증 실패한다', () => {
      const jwt = require('jsonwebtoken');
      const badToken = jwt.sign({ id: 'x' }, 'wrong-secret');
      expect(() => verifyAccessToken(badToken)).toThrow();
    });
  });

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('유효한 페이로드로 Refresh Token을 생성하고 검증할 수 있다', () => {
      const token = signRefreshToken(mockUser);
      const decoded = verifyRefreshToken(token);
      expect(decoded.id).toBe(mockUser.id);
    });

    it('만료된 Refresh Token 검증 시 오류가 발생한다', () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: mockUser.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: -1 },
      );
      expect(() => verifyRefreshToken(expiredToken)).toThrow();
    });
  });
});
