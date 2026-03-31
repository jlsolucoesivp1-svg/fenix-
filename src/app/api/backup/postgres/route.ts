import { exportSqlSnapshot } from '@/lib/server/postgres';

export async function GET() {
  try {
    const sql = await exportSqlSnapshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return new Response(sql, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="backup-sistema-fenix-${timestamp}.sql"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao exportar backup SQL do PostgreSQL:', error);
    return Response.json({ error: 'Falha ao exportar backup SQL.' }, { status: 500 });
  }
}
