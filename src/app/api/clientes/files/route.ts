import { NextRequest, NextResponse } from 'next/server';
import {
  deleteSaasCustomerFile,
  downloadSaasCustomerFile,
  listSaasCustomerFiles,
  uploadSaasCustomerFile,
} from '@/lib/server/saas-storage';
import { requireSaasPermission } from '@/lib/server/saas-authz';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessClients',
      'Sessao SaaS invalida para arquivos de clientes.',
      'Voce nao tem permissao para acessar arquivos de clientes.'
    );
    if (session instanceof NextResponse) {
      return session;
    }
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId')?.trim();
    const path = searchParams.get('path')?.trim();
    const shouldDownload = searchParams.get('download') === '1';

    if (shouldDownload) {
      if (!path) {
        return NextResponse.json({ error: 'Caminho do arquivo nao informado.' }, { status: 400 });
      }

      const response = await downloadSaasCustomerFile({
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

      return new NextResponse(response.body, { headers });
    }

    if (!customerId) {
      return NextResponse.json({ error: 'customerId nao informado.' }, { status: 400 });
    }

    const files = await listSaasCustomerFiles({
      accessToken: session.accessToken,
      companyId: session.companyId,
      customerId,
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao listar arquivos do cliente.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessClients',
      'Sessao SaaS invalida para arquivos de clientes.',
      'Voce nao tem permissao para alterar arquivos de clientes.'
    );
    if (session instanceof NextResponse) {
      return session;
    }
    const formData = await request.formData();
    const customerId = String(formData.get('customerId') || '').trim();
    const file = formData.get('file');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId nao informado.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo invalido.' }, { status: 400 });
    }

    await uploadSaasCustomerFile({
      accessToken: session.accessToken,
      companyId: session.companyId,
      customerId,
      file,
    });

    const files = await listSaasCustomerFiles({
      accessToken: session.accessToken,
      companyId: session.companyId,
      customerId,
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao enviar arquivo do cliente.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSaasPermission(
      'accessClients',
      'Sessao SaaS invalida para arquivos de clientes.',
      'Voce nao tem permissao para excluir arquivos de clientes.'
    );
    if (session instanceof NextResponse) {
      return session;
    }
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId')?.trim();
    const path = searchParams.get('path')?.trim();

    if (!customerId || !path) {
      return NextResponse.json({ error: 'Parametros obrigatorios nao informados.' }, { status: 400 });
    }

    await deleteSaasCustomerFile({
      accessToken: session.accessToken,
      path,
    });

    const files = await listSaasCustomerFiles({
      accessToken: session.accessToken,
      companyId: session.companyId,
      customerId,
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao excluir arquivo do cliente.',
      },
      { status: 500 }
    );
  }
}
