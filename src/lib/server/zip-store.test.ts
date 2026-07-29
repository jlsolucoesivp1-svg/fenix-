import { describe, expect, it } from 'vitest';
import { createStoredZip, sha256 } from './zip-store';

describe('zip-store', () => {
  it('creates a ZIP with the expected file headers and SHA-256 digest', () => {
    const zip = createStoredZip([
      { path: 'backup.json', content: Buffer.from('{"company":"A"}') },
      { path: 'storage/company-assets/a/logo.png', content: Buffer.from('file-a') },
    ]);
    expect(zip.subarray(0, 4).toString('hex')).toBe('504b0304');
    expect(zip.toString('utf8')).toContain('backup.json');
    expect(zip.toString('utf8')).toContain('storage/company-assets/a/logo.png');
    expect(sha256(Buffer.from('file-a'))).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects ZIP paths that could escape the archive root', () => {
    expect(() => createStoredZip([{ path: '../other-tenant.txt', content: Buffer.from('x') }])).toThrow('Caminho ZIP invalido');
  });
});
