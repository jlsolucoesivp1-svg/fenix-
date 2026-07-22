import { NextRequest, NextResponse } from 'next/server';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import {
  deleteSaasCompanyAsset,
  downloadSaasCompanyAsset,
  listSaasCompanyAssets,
  uploadSaasCompanyAsset,
} from '@/lib/server/saas-storage';
import type { CompanyAssetKind } from '@/types';

const isValidCompanyAssetKind = (value: string): value is CompanyAssetKind =>
  value === 'logo' || value === 'notification-sound' || value === 'brand-media';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessSettings',
      'Sessao SaaS invalida para assets da empresa.',
      'Voce nao tem permissao para acessar assets da empresa.'
    );
    if (session instanceof NextResponse) {
      return session;
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path')?.trim();
    const shouldDownload = searchParams.get('download') === '1';

    if (shouldDownload) {
      if (!path) {
        return NextResponse.json({ error: 'Caminho do asset nao informado.' }, { status: 400 });
      }

      const response = await downloadSaasCompanyAsset({
        accessToken: session.accessToken,
        path,
      });

      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        headers.set('Content-Length', contentLength);
      }
      headers.set(
        'Content-Disposition',
        response.headers.get('Content-Disposition') ||
          `inline; filename="${path.split('/').pop() || 'asset'}"`
      );

      return new NextResponse(response.body, { headers });
    }

    const assets = await listSaasCompanyAssets({
      accessToken: session.accessToken,
      companyId: session.companyId,
    });

    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar assets da empresa.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessSettings',
      'Sessao SaaS invalida para assets da empresa.',
      'Voce nao tem permissao para alterar assets da empresa.'
    );
    if (session instanceof NextResponse) {
      return session;
    }

    const formData = await request.formData();
    const kind = String(formData.get('kind') || '').trim();
    const file = formData.get('file');

    if (!isValidCompanyAssetKind(kind)) {
      return NextResponse.json({ error: 'Tipo de asset invalido.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo invalido.' }, { status: 400 });
    }

    await uploadSaasCompanyAsset({
      accessToken: session.accessToken,
      companyId: session.companyId,
      kind,
      file,
    });

    const assets = await listSaasCompanyAssets({
      accessToken: session.accessToken,
      companyId: session.companyId,
    });

    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao enviar asset da empresa.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessSettings',
      'Sessao SaaS invalida para assets da empresa.',
      'Voce nao tem permissao para excluir assets da empresa.'
    );
    if (session instanceof NextResponse) {
      return session;
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path')?.trim();

    if (!path) {
      return NextResponse.json({ error: 'Path do asset nao informado.' }, { status: 400 });
    }

    await deleteSaasCompanyAsset({
      accessToken: session.accessToken,
      path,
    });

    const assets = await listSaasCompanyAssets({
      accessToken: session.accessToken,
      companyId: session.companyId,
    });

    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir asset da empresa.' },
      { status: 500 }
    );
  }
}
