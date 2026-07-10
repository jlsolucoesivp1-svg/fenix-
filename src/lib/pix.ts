const PIX_GUI = 'br.gov.bcb.pix';
const DEFAULT_MERCHANT_NAME = 'EMPRESA';
const DEFAULT_MERCHANT_CITY = 'SAO PAULO';
const DEFAULT_TXID = '***';
const DEFAULT_POINT_OF_INITIATION_METHOD = '11';
const EMV_ALLOWED_TEXT_PATTERN = /[^A-Z0-9 $%*+\-./:]/g;
const EMAIL_PIX_KEY_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PIX_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const removeAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const onlyPrintableAscii = (value: string) => removeAccents(value).replace(/[^\x20-\x7E]/g, '').trim();

const normalizeEmvText = (value: string) =>
  onlyPrintableAscii(value)
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(EMV_ALLOWED_TEXT_PATTERN, '')
    .trim();

const formatEmvField = (id: string, value: string): string => {
  if (value.length > 99) {
    throw new Error(`Campo EMV ${id} excede o tamanho maximo permitido.`);
  }

  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
};

const formatPixAmount = (amount: number) => amount.toFixed(2);

const parseEmvFields = (value: string) => {
  const fields = new Map<string, string>();
  let cursor = 0;

  while (cursor + 4 <= value.length) {
    const id = value.slice(cursor, cursor + 2);
    const length = Number(value.slice(cursor + 2, cursor + 4));

    if (!Number.isFinite(length)) {
      throw new Error(`Campo EMV invalido em ${id}.`);
    }

    const start = cursor + 4;
    const end = start + length;
    if (end > value.length) {
      throw new Error(`Tamanho invalido para o campo EMV ${id}.`);
    }

    fields.set(id, value.slice(start, end));
    cursor = end;
  }

  if (cursor !== value.length) {
    throw new Error('Payload EMV invalido.');
  }

  return fields;
};

const sanitizeMerchantName = (merchantName?: string) =>
  (normalizeEmvText(merchantName || DEFAULT_MERCHANT_NAME) || DEFAULT_MERCHANT_NAME).slice(0, 25);

const sanitizeMerchantCity = (merchantCity?: string) =>
  (normalizeEmvText(merchantCity || DEFAULT_MERCHANT_CITY) || DEFAULT_MERCHANT_CITY).slice(0, 15);

const sanitizeTxid = (txid?: string) => {
  const normalized = normalizeEmvText(txid || DEFAULT_TXID)
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 25);

  return normalized || DEFAULT_TXID;
};

const sanitizeDescription = (description?: string) => normalizeEmvText(description || '').slice(0, 72);

const sanitizePointOfInitiationMethod = (value?: '11' | '12') => value || DEFAULT_POINT_OF_INITIATION_METHOD;

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const isValidCpf = (value: string) => {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(value[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(value[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(value[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(value[10]);
};

const isValidCnpj = (value: string) => {
  if (!/^\d{14}$/.test(value) || /^(\d)\1{13}$/.test(value)) {
    return false;
  }

  const calculateCheckDigit = (base: string) => {
    const multipliers =
      base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const sum = base
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * multipliers[index], 0);

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateCheckDigit(value.slice(0, 12));
  const secondDigit = calculateCheckDigit(value.slice(0, 13));

  return firstDigit === Number(value[12]) && secondDigit === Number(value[13]);
};

const normalizePhonePixKey = (value: string) => {
  const trimmed = value.trim();
  let digits = onlyDigits(trimmed);

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (trimmed.startsWith('+')) {
    const internationalPhone = `+${digits}`;
    if (!/^\+55\d{10,11}$/.test(internationalPhone)) {
      throw new Error('Telefone Pix invalido. Use DDD + numero, preferencialmente com +55.');
    }

    return internationalPhone;
  }

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  throw new Error('Telefone Pix invalido. Use DDD + numero, preferencialmente com +55.');
};

const normalizePixKey = (pixKey: string) => {
  const trimmedKey = onlyPrintableAscii(pixKey);
  const digitsOnlyKey = onlyDigits(trimmedKey);

  if (!trimmedKey) {
    throw new Error('Chave Pix invalida.');
  }

  if (isValidCpf(digitsOnlyKey)) {
    return digitsOnlyKey;
  }

  if (isValidCnpj(digitsOnlyKey)) {
    return digitsOnlyKey;
  }

  if (EMAIL_PIX_KEY_PATTERN.test(trimmedKey)) {
    return trimmedKey.toLowerCase();
  }

  if (trimmedKey.startsWith('+') || /^\d+$/.test(digitsOnlyKey)) {
    try {
      return normalizePhonePixKey(trimmedKey);
    } catch {
      // Continue with other key formats.
    }
  }

  if (UUID_PIX_KEY_PATTERN.test(trimmedKey)) {
    return trimmedKey.toLowerCase();
  }

  if (trimmedKey.length >= 32 && trimmedKey.length <= 77 && /^[0-9a-zA-Z-]+$/.test(trimmedKey)) {
    return trimmedKey;
  }

  throw new Error('Chave Pix invalida. Informe CPF, CNPJ, e-mail, telefone ou chave aleatoria valida.');
};

const crc16Ccitt = (value: string) => {
  let crc = 0xffff;

  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
};

export const extractCityFromAddress = (address?: string) => {
  if (!address) {
    return DEFAULT_MERCHANT_CITY;
  }

  const parts = address
    .split(/[-,]/)
    .map((part) => normalizeEmvText(part))
    .filter(Boolean);

  return parts.length > 1 ? parts[parts.length - 2] : parts[0] || DEFAULT_MERCHANT_CITY;
};

export const buildPixTxid = (reference?: string) => {
  const normalized = normalizeEmvText(reference || DEFAULT_TXID)
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 25);

  return normalized || DEFAULT_TXID;
};

export const generatePixPayload = ({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid,
  description,
  pointOfInitiationMethod,
}: {
  pixKey: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  txid?: string;
  description?: string;
  pointOfInitiationMethod?: '11' | '12';
}) => {
  const key = normalizePixKey(pixKey);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Valor Pix invalido.');
  }

  const merchantAccountInfoFields = [formatEmvField('00', PIX_GUI), formatEmvField('01', key)];
  const pixDescription = sanitizeDescription(description);

  if (pixDescription) {
    merchantAccountInfoFields.push(formatEmvField('02', pixDescription));
  }

  const payload = [
    formatEmvField('00', '01'),
    formatEmvField('01', sanitizePointOfInitiationMethod(pointOfInitiationMethod)),
    formatEmvField('26', merchantAccountInfoFields.join('')),
    formatEmvField('52', '0000'),
    formatEmvField('53', '986'),
    formatEmvField('54', formatPixAmount(amount)),
    formatEmvField('58', 'BR'),
    formatEmvField('59', sanitizeMerchantName(merchantName)),
    formatEmvField('60', sanitizeMerchantCity(merchantCity)),
    formatEmvField('62', formatEmvField('05', sanitizeTxid(txid))),
  ].join('');

  const payloadWithCrc = `${payload}6304`;
  return `${payloadWithCrc}${crc16Ccitt(payloadWithCrc)}`;
};

export const validatePixPayload = (payload: string) => {
  if (!payload || payload.length < 10) {
    throw new Error('Payload PIX vazio ou invalido.');
  }

  if (!payload.endsWith(payload.slice(-4))) {
    throw new Error('CRC PIX ausente.');
  }

  const crcFieldIndex = payload.lastIndexOf('6304');
  if (crcFieldIndex === -1 || crcFieldIndex + 8 !== payload.length) {
    throw new Error('Campo CRC16 invalido.');
  }

  const payloadWithoutCrcValue = payload.slice(0, crcFieldIndex + 4);
  const providedCrc = payload.slice(crcFieldIndex + 4);
  const expectedCrc = crc16Ccitt(payloadWithoutCrcValue);

  if (providedCrc !== expectedCrc) {
    throw new Error('CRC16 do payload PIX invalido.');
  }

  const rootFields = parseEmvFields(payload.slice(0, crcFieldIndex));
  const merchantAccountInformation = rootFields.get('26');
  const additionalDataField = rootFields.get('62');

  if (rootFields.get('00') !== '01') {
    throw new Error('Payload Format Indicator invalido.');
  }

  if (!merchantAccountInformation) {
    throw new Error('Merchant Account Information ausente.');
  }

  const merchantAccountFields = parseEmvFields(merchantAccountInformation);
  if (merchantAccountFields.get('00') !== PIX_GUI) {
    throw new Error('GUI PIX invalida.');
  }

  if (!merchantAccountFields.get('01')) {
    throw new Error('Chave PIX ausente.');
  }

  if (rootFields.get('52') !== '0000') {
    throw new Error('Merchant Category Code invalido.');
  }

  if (rootFields.get('53') !== '986') {
    throw new Error('Moeda da transacao invalida.');
  }

  if (rootFields.get('58') !== 'BR') {
    throw new Error('Country Code invalido.');
  }

  const amount = rootFields.get('54');
  if (!amount || !/^\d+\.\d{2}$/.test(amount)) {
    throw new Error('Valor da transacao invalido.');
  }

  if (!rootFields.get('59')) {
    throw new Error('Nome do recebedor ausente.');
  }

  if (!rootFields.get('60')) {
    throw new Error('Cidade do recebedor ausente.');
  }

  if (!additionalDataField) {
    throw new Error('Additional Data Field Template ausente.');
  }

  const additionalDataFields = parseEmvFields(additionalDataField);
  if (!additionalDataFields.get('05')) {
    throw new Error('TXID ausente.');
  }

  return true;
};

export const generatePixQrCodeDataUrl = async (payload: string, width = 200) =>
  (await import('qrcode')).default.toDataURL(payload, {
    width,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

export const createPixPaymentData = ({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid,
  description,
  pointOfInitiationMethod,
  qrCodeWidth = 200,
}: {
  pixKey: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  txid?: string;
  description?: string;
  pointOfInitiationMethod?: '11' | '12';
  qrCodeWidth?: number;
}) => {
  const payload = generatePixPayload({
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txid,
    description,
    pointOfInitiationMethod,
  });
  validatePixPayload(payload);

  return {
    payload,
    qrCodeWidth,
    qrCodeDataUrlPromise: generatePixQrCodeDataUrl(payload, qrCodeWidth),
  };
};
