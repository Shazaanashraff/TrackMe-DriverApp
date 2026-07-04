import { ALIAS_OK } from '@/lib/_alias_probe';

describe('_alias_probe', () => {
  it('resolves the @ alias', () => {
    expect(ALIAS_OK).toBe(true);
  });
});
