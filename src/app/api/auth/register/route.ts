import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Cadastro legado desativado. Usuarios sao criados pelo administrador da empresa.' }, { status: 410 });
}
