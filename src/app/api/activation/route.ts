import { NextResponse } from 'next/server';
import { activateSystem, getPublicSystemActivation } from '@/lib/server/activation';

export async function GET() {
  try {
    const activation = await getPublicSystemActivation();
    return NextResponse.json(activation);
  } catch (error) {
    console.error('Erro ao buscar status de ativação:', error);
    return NextResponse.json(
      { error: 'Não foi possível recuperar o status de ativação.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { serial } = await request.json();
    if (typeof serial !== 'string' || !serial.trim()) {
      return NextResponse.json({ error: 'Serial obrigatório.' }, { status: 400 });
    }

    const activation = await activateSystem(serial.trim());
    return NextResponse.json({
      success: true,
      activation: {
        machineKey: activation.machineKey,
        createdAt: activation.createdAt,
        status: activation.status,
        activatedAt: activation.activatedAt,
        serialMetadata: activation.serialMetadata,
      },
    });
  } catch (error: any) {
    console.error('Erro ao ativar o sistema:', error);
    return NextResponse.json(
      { error: error?.message || 'Serial inválido.' },
      { status: 400 }
    );
  }
}
