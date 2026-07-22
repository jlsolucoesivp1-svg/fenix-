import { NextRequest, NextResponse } from 'next/server';
import { downloadSaasServiceOrderFile, listSaasServiceOrderFiles, uploadSaasServiceOrderFile, deleteSaasServiceOrderFile } from '@/lib/server/saas-storage';
import { requireSaasPermission } from '@/lib/server/saas-authz';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessServiceOrders',
      'Sessao SaaS invalida para arquivos de OS.',
      'Voce nao tem permissao para acessar arquivos de ordens de servico.'
    );
    if (session instanceof NextResponse) {
      return session;
    }
    const { searchParams } = new URL(request.url);
    const serviceOrderId = searchParams.get('serviceOrderId')?.trim();
    const path = searchParams.get('path')?.trim();
    const shouldDownload = searchParams.get('download') === '1';

    if (shouldDownload) {
      if (!path) {
        return NextResponse.json({ error: 'Caminho do arquivo nao informado.' }, { status: 400 });
      }

      const response = await downloadSaasServiceOrderFile({
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
          `inline; filename="${path.split('/').pop() || 'arquivo'}"`
      );

      return new NextResponse(response.body, {
        headers,
      });
    }

    if (!serviceOrderId) {
      return NextResponse.json({ error: 'serviceOrderId nao informado.' }, { status: 400 });
    }

    const files = await listSaasServiceOrderFiles({
      accessToken: session.accessToken,
      companyId: session.companyId,
      serviceOrderId,
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao listar arquivos da OS.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessServiceOrders',
      'Sessao SaaS invalida para arquivos de OS.',
      'Voce nao tem permissao para alterar arquivos de ordens de servico.'
    );
    if (session instanceof NextResponse) {
      return session;
    }
    const formData = await request.formData();
    const serviceOrderId = String(formData.get('serviceOrderId') || '').trim();
    const file = formData.get('file');

    if (!serviceOrderId) {
      return NextResponse.json({ error: 'serviceOrderId nao informado.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo invalido.' }, { status: 400 });
    }

    await uploadSaasServiceOrderFile({
      accessToken: session.accessToken,
      companyId: session.companyId,
      serviceOrderId,
      file,
    });

    const files = await listSaasServiceOrderFiles({
      accessToken: session.accessToken,
      companyId: session.companyId,
      serviceOrderId,
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao enviar arquivo da OS.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessServiceOrders',
      'Sessao SaaS invalida para arquivos de OS.',
      'Voce nao tem permissao para excluir arquivos de ordens de servico.'
    );
    if (session instanceof NextResponse) {
      return session;
    }
    const { searchParams } = new URL(request.url);
    const serviceOrderId = searchParams.get('serviceOrderId')?.trim();
    const path = searchParams.get('path')?.trim();

    if (!serviceOrderId || !path) {
      return NextResponse.json({ error: 'Parametros obrigatorios nao informados.' }, { status: 400 });
    }

    await deleteSaasServiceOrderFile({
      accessToken: session.accessToken,
      path,
    });

    const files = await listSaasServiceOrderFiles({
      accessToken: session.accessToken,
      companyId: session.companyId,
      serviceOrderId,
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao excluir arquivo da OS.',
      },
      { status: 500 }
    );
  }
}
