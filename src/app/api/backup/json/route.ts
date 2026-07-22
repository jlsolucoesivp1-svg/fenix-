import { requirePermission } from '@/lib/server/authz';
import { getSingleton, listCollection } from '@/lib/server/postgres';

export async function GET() {
  try {
    const authResult = await requirePermission(
      'accessDangerZone',
      'Voce nao tem permissao para exportar o backup completo.'
    );
    if (authResult instanceof Response) {
      return authResult;
    }

    const [
      customers,
      serviceOrders,
      sales,
      financialTransactions,
      users,
      companyInfo,
      settings,
      quotes,
      appointments,
      kits,
      stock,
    ] = await Promise.all([
      listCollection('customers'),
      listCollection('serviceOrders'),
      listCollection('sales'),
      listCollection('financialTransactions'),
      listCollection('users'),
      getSingleton('companyInfo'),
      getSingleton('settings'),
      listCollection('quotes'),
      listCollection('appointments'),
      listCollection('kits'),
      listCollection('stock'),
    ]);

    const payload = {
      metadata: {
        version: 1,
        createdAt: new Date().toISOString(),
        appName: 'Sistema Fenix',
      },
      data: {
        customers,
        serviceOrders,
        sales,
        financialTransactions,
        users,
        companyInfo,
        settings,
        quotes,
        appointments,
        kits,
        stock,
      },
    };

    return Response.json(payload, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao exportar backup JSON:', error);
    return Response.json({ error: 'Falha ao exportar backup completo.' }, { status: 500 });
  }
}
