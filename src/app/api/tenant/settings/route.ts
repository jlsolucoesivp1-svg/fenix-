import { NextResponse } from 'next/server';
import type { AppSettings, ReceiptPrintFormat } from '@/types';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import {
  getSaasAppSettings,
  saveSaasAppSettings,
} from '@/lib/server/saas-company-settings';

const validateSettingsPayload = (payload: unknown): AppSettings => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de configuracoes invalido.');
  }

  const settings = payload as Partial<AppSettings>;
  const defaultWarrantyDays = Number(settings.defaultWarrantyDays);
  const receiptPrintFormat = settings.receiptPrintFormat;

  if (!Number.isFinite(defaultWarrantyDays) || defaultWarrantyDays <= 0) {
    throw new Error('Prazo padrao de garantia invalido.');
  }

  if (receiptPrintFormat !== 'a4' && receiptPrintFormat !== 'thermal_80mm') {
    throw new Error('Formato padrao de comprovante invalido.');
  }

  return {
    defaultWarrantyDays: Math.floor(defaultWarrantyDays),
    receiptPrintFormat: receiptPrintFormat as ReceiptPrintFormat,
  };
};

export async function GET() {
  try {
    const context = await requireSaasPermission(
      'accessSettings',
      'Configuracoes SaaS indisponiveis para a sessao atual.',
      'Voce nao tem permissao para acessar configuracoes.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const settings = await getSaasAppSettings(context);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao carregar configuracoes SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar configuracoes SaaS.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessSettings',
      'Configuracoes SaaS indisponiveis para a sessao atual.',
      'Voce nao tem permissao para alterar configuracoes.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const settings = validateSettingsPayload(await request.json());
    const savedSettings = await saveSaasAppSettings({
      accessToken: context.accessToken,
      companyId: context.companyId,
      settings,
    });

    return NextResponse.json(savedSettings);
  } catch (error) {
    console.error('Erro ao salvar configuracoes SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao salvar configuracoes SaaS.' },
      { status: 500 }
    );
  }
}
