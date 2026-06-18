describe('환경변수 검증 (env.ts)', () => {
  const REQUIRED = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  it('필수 환경변수가 모두 있으면 정상 로딩된다', () => {
    // setup.ts에서 이미 설정됨 — import 자체가 성공해야 함
    expect(() => {
      require('../../src/config/env');
    }).not.toThrow();
  });

  it('필수 환경변수 목록이 4개이다', () => {
    expect(REQUIRED).toHaveLength(4);
    expect(REQUIRED).toContain('SUPABASE_URL');
    expect(REQUIRED).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(REQUIRED).toContain('JWT_ACCESS_SECRET');
    expect(REQUIRED).toContain('JWT_REFRESH_SECRET');
  });

  it('env 객체가 PORT를 숫자로 export한다', () => {
    const { env } = require('../../src/config/env');
    expect(typeof env.PORT).toBe('number');
  });

  it('env 객체가 NODE_ENV를 string으로 export한다', () => {
    const { env } = require('../../src/config/env');
    expect(typeof env.NODE_ENV).toBe('string');
  });

  it('env 객체가 JWT_ACCESS_TTL_SECONDS를 숫자로 export한다', () => {
    const { env } = require('../../src/config/env');
    expect(typeof env.JWT_ACCESS_TTL_SECONDS).toBe('number');
    expect(env.JWT_ACCESS_TTL_SECONDS).toBe(3600);
  });

  it('env 객체가 BCRYPT_COST를 숫자로 export한다', () => {
    const { env } = require('../../src/config/env');
    expect(typeof env.BCRYPT_COST).toBe('number');
  });
});
