import { NextResponse } from 'next/server';

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const buildAddress = (payload: ViaCepResponse) => {
  const street = [payload.logradouro, payload.complemento].filter(Boolean).join(', ').trim();
  const locality = [payload.bairro, payload.localidade, payload.uf].filter(Boolean).join(' - ').trim();
  return [street, locality].filter(Boolean).join(' | ');
};

export async function GET(_: Request, context: { params: Promise<{ cep: string }> }) {
  try {
    const { cep } = await context.params;
    const normalizedCep = onlyDigits(cep);

    if (normalizedCep.length !== 8) {
      return NextResponse.json({ error: 'CEP invalido.' }, { status: 400 });
    }

    const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao consultar CEP.' }, { status: 502 });
    }

    const payload = (await response.json()) as ViaCepResponse;
    if (payload.erro) {
      return NextResponse.json({ error: 'CEP nao encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      cep: formatCep(payload.cep || normalizedCep),
      address: buildAddress(payload),
      street: payload.logradouro || '',
      complement: payload.complemento || '',
      district: payload.bairro || '',
      city: payload.localidade || '',
      state: payload.uf || '',
    });
  } catch (error) {
    console.error('Erro ao consultar CEP:', error);
    return NextResponse.json({ error: 'Falha ao consultar CEP.' }, { status: 500 });
  }
}
