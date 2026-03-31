import { NextResponse } from 'next/server';

type BrasilApiCnpjResponse = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  telefone?: string;
  email?: string;
};

type CnpjWsResponse = {
  razao_social?: string;
  estabelecimento?: {
    cnpj?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    ddd1?: string;
    telefone1?: string;
    email?: string | null;
    cidade?: {
      nome?: string;
    };
    estado?: {
      sigla?: string;
    };
  };
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length !== 14) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const buildAddress = (payload: BrasilApiCnpjResponse) => {
  const street = [payload.logradouro, payload.numero, payload.complemento].filter(Boolean).join(', ').trim();
  const locality = [payload.bairro, payload.municipio, payload.uf].filter(Boolean).join(' - ').trim();
  return [street, locality].filter(Boolean).join(' | ');
};

const buildWsAddress = (payload: CnpjWsResponse) => {
  const establishment = payload.estabelecimento || {};
  const street = [establishment.tipo_logradouro, establishment.logradouro, establishment.numero, establishment.complemento]
    .filter(Boolean)
    .join(', ')
    .trim();
  const locality = [establishment.bairro, establishment.cidade?.nome, establishment.estado?.sigla]
    .filter(Boolean)
    .join(' - ')
    .trim();
  return [street, locality].filter(Boolean).join(' | ');
};

const normalizePhone = (ddd?: string, phone?: string) => {
  if (!phone) return '';
  return ddd ? `(${ddd}) ${phone}` : phone;
};

const lookupBrasilApi = async (cnpj: string) => {
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as BrasilApiCnpjResponse;
  return {
    document: formatCnpj(payload.cnpj || cnpj),
    name: payload.razao_social || payload.nome_fantasia || '',
    phone: payload.telefone || '',
    email: payload.email || '',
    cep: payload.cep ? formatCep(payload.cep) : '',
    address: buildAddress(payload),
  };
};

const lookupCnpjWs = async (cnpj: string) => {
  const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as CnpjWsResponse;
  return {
    document: formatCnpj(payload.estabelecimento?.cnpj || cnpj),
    name: payload.razao_social || '',
    phone: normalizePhone(payload.estabelecimento?.ddd1, payload.estabelecimento?.telefone1),
    email: payload.estabelecimento?.email || '',
    cep: payload.estabelecimento?.cep ? formatCep(payload.estabelecimento.cep) : '',
    address: buildWsAddress(payload),
  };
};

export async function GET(_: Request, context: { params: Promise<{ cnpj: string }> }) {
  try {
    const { cnpj } = await context.params;
    const normalizedCnpj = onlyDigits(cnpj);

    if (normalizedCnpj.length !== 14) {
      return NextResponse.json({ error: 'CNPJ invalido.' }, { status: 400 });
    }

    const payload = await lookupBrasilApi(normalizedCnpj) || await lookupCnpjWs(normalizedCnpj);

    if (!payload) {
      return NextResponse.json({ error: 'Falha ao consultar CNPJ.' }, { status: 502 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    return NextResponse.json({ error: 'Falha ao consultar CNPJ.' }, { status: 500 });
  }
}
