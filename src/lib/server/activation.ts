import crypto from 'node:crypto';
import { getSingleton, saveSingleton } from './postgres';
import type { SystemActivation } from '@/types';

const ACTIVATION_COLLECTION = 'systemActivation';
const SERIAL_SECRET = process.env.SERIAL_SECRET?.trim();

const requireSerialSecret = (): string => {
  if (!SERIAL_SECRET) {
    throw new Error('SERIAL_SECRET não configurado. Defina esta chave no .env para validar o serial.');
  }
  return SERIAL_SECRET;
};

type SerialPayload = {
  version: 1;
  machineKey: string;
  issuedAt: string;
  expiresAt?: string;
};

const parseSerial = (serial: string): { machineKey: string; expiresAt?: string; signature: string } => {
  const parts = serial.split(':');
  if (parts.length !== 3) {
    throw new Error('Serial inválido.');
  }

  const [machineKey, expiresPart, signature] = parts;
  if (!machineKey || !signature) {
    throw new Error('Serial inválido.');
  }

  return { machineKey, expiresAt: expiresPart || undefined, signature };
};

const buildHmac = (machineKey: string, expiresAt?: string): string => {
  const secret = requireSerialSecret();
  const message = `${machineKey}:${expiresAt ?? ''}`;
  return crypto.createHmac('sha256', secret).update(message).digest('base64url');
};

const verifySerialFormat = (serial: string, machineKey: string): SerialPayload => {
  const parsed = parseSerial(serial);

  if (parsed.machineKey !== machineKey) {
    throw new Error('Serial não corresponde a esta instalação.');
  }

  const expected = buildHmac(machineKey, parsed.expiresAt);
  const signatureBuffer = Buffer.from(parsed.signature, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Serial inválido.');
  }

  if (parsed.expiresAt) {
    const expiresDate = Date.parse(parsed.expiresAt);
    if (Number.isNaN(expiresDate)) {
      throw new Error('Serial inválido.');
    }
    if (expiresDate <= Date.now()) {
      throw new Error('Serial expirado.');
    }
  }

  return {
    version: 1,
    machineKey,
    issuedAt: new Date().toISOString(),
    expiresAt: parsed.expiresAt,
  };
};

export const getOrCreateSystemActivation = async (): Promise<SystemActivation> => {
  const existing = await getSingleton<SystemActivation>(ACTIVATION_COLLECTION);
  if (existing) {
    return existing;
  }

  const machineKey = crypto.randomBytes(24).toString('hex');
  const newRecord: SystemActivation = {
    machineKey,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  await saveSingleton(ACTIVATION_COLLECTION, newRecord);
  return newRecord;
};

export const getSystemActivation = async (): Promise<SystemActivation> => {
  return getOrCreateSystemActivation();
};

export const getPublicSystemActivation = async (): Promise<SystemActivation> => {
  const record = await getOrCreateSystemActivation();
  return {
    machineKey: record.machineKey,
    createdAt: record.createdAt,
    status: record.status,
    activatedAt: record.activatedAt,
    serialMetadata: record.serialMetadata,
  };
};

export const activateSystem = async (serial: string): Promise<SystemActivation> => {
  const record = await getOrCreateSystemActivation();
  const payload = verifySerialFormat(serial, record.machineKey);

  if (record.status === 'active' && record.serial === serial) {
    return record;
  }

  const updated: SystemActivation = {
    ...record,
    status: 'active',
    activatedAt: new Date().toISOString(),
    serial,
    serialMetadata: {
      version: payload.version,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
    },
  };

  await saveSingleton(ACTIVATION_COLLECTION, updated);
  return updated;
};

export const isSystemActivated = async (): Promise<boolean> => {
  const record = await getOrCreateSystemActivation();
  return record.status === 'active';
};
