import { createHash } from 'node:crypto';

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  return value >>> 0;
});

const crc32 = (value: Buffer) => {
  let crc = 0xffffffff;
  for (const byte of value) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date: Date) => {
  const year = Math.max(1980, date.getUTCFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
  };
};

const u16 = (value: number) => { const b = Buffer.alloc(2); b.writeUInt16LE(value, 0); return b; };
const u32 = (value: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0, 0); return b; };

export const sha256 = (value: Buffer) => createHash('sha256').update(value).digest('hex');

export type ZipEntry = { path: string; content: Buffer };

// ZIP "store" format intentionally avoids a third-party archive dependency.
// It is deterministic and keeps all buffers in memory; callers enforce limits.
export const createStoredZip = (entries: ZipEntry[]) => {
  let offset = 0;
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  const now = dosDateTime(new Date());

  for (const entry of entries) {
    if (!entry.path || entry.path.includes('..') || entry.path.startsWith('/')) throw new Error('Caminho ZIP invalido.');
    const name = Buffer.from(entry.path, 'utf8');
    const checksum = crc32(entry.content);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(now.time), u16(now.date),
      u32(checksum), u32(entry.content.length), u32(entry.content.length), u16(name.length), u16(0), name, entry.content,
    ]);
    locals.push(local);
    centrals.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(now.time), u16(now.date),
      u32(checksum), u32(entry.content.length), u32(entry.content.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ]));
    offset += local.length;
  }
  const central = Buffer.concat(centrals);
  return Buffer.concat([
    ...locals,
    central,
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(offset), u16(0),
  ]);
};
