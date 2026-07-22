import { NextResponse } from 'next/server';
import type { CompanyInfo } from '@/types';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import {
  getSaasCompanyInfo,
  saveSaasCompanyInfo,
} from '@/lib/server/saas-company-settings';

const validateCompanyInfoPayload = (payload: unknown): CompanyInfo => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de dados da empresa invalido.');
  }

  const companyInfo = payload as Partial<CompanyInfo>;
  return {
    name: companyInfo.name?.trim() || '',
    address: companyInfo.address?.trim() || '',
    phone: companyInfo.phone?.trim() || '',
    emailOrSite: companyInfo.emailOrSite?.trim() || '',
    document: companyInfo.document?.trim() || '',
    logoUrl: companyInfo.logoUrl?.trim() || '',
    logoStoragePath: companyInfo.logoStoragePath?.trim() || '',
    pixKey: companyInfo.pixKey?.trim() || '',
    notificationSoundUrl: companyInfo.notificationSoundUrl?.trim() || '',
    notificationSoundStoragePath: companyInfo.notificationSoundStoragePath?.trim() || '',
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

    const companyInfo = await getSaasCompanyInfo({
      accessToken: context.accessToken,
      companyId: context.companyId,
      companyTradeName: context.supabaseSession.tenantAccess.company?.tradeName || null,
    });
    return NextResponse.json(companyInfo);
  } catch (error) {
    console.error('Erro ao carregar dados da empresa SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar dados da empresa SaaS.' },
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

    const companyInfo = validateCompanyInfoPayload(await request.json());
    const savedCompanyInfo = await saveSaasCompanyInfo({
      accessToken: context.accessToken,
      companyId: context.companyId,
      companyInfo,
    });

    return NextResponse.json(savedCompanyInfo);
  } catch (error) {
    console.error('Erro ao salvar dados da empresa SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao salvar dados da empresa SaaS.' },
      { status: 500 }
    );
  }
}
