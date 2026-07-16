import { NextResponse } from 'next/server';
import type { User } from '@/types';
import {
  createCompanyFromPanel,
  listCompaniesForSuperAdmin,
  setCompanyStatusFromPanel,
  updateCompanyFromPanel,
} from '@/lib/server/saas-control-plane';
import { SaasBootstrapError } from '@/lib/server/saas-bootstrap';
import { insertAuditLogs } from '@/lib/server/audit';
import { requireSuperAdminApiSession } from '@/lib/server/superadmin';
import { ALL_USER_PERMISSIONS } from '@/lib/permissions';

const getRequestMetadata = (request: Request) => ({
  requestId: request.headers.get('x-request-id') || null,
  ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
  userAgent: request.headers.get('user-agent') || null,
});

export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const companies = await listCompaniesForSuperAdmin();
    await insertAuditLogs([
      {
        actorUserId: auth.session.supabaseUser?.id || null,
        action: 'superadmin_companies_list',
        entity: 'platform_admin',
        entityId: auth.platformAdmin.id,
        success: true,
        severity: 'info',
        metadata: {
          platform_admin_id: auth.platformAdmin.id,
          total_companies_returned: companies.length,
        },
        ...getRequestMetadata(request),
      },
    ]);

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Erro ao listar empresas no painel JL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar empresas.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = (await request.json()) as Record<string, unknown>;
    const requestMetadata = {
      ...getRequestMetadata(request),
      platformAdminId: auth.platformAdmin.id,
    };
    const actor: User =
      auth.session.user ??
      {
        id: auth.session.supabaseUser?.id || auth.platformAdmin.id,
        name:
          auth.platformAdmin.displayName ||
          auth.session.supabaseUser?.loginName ||
          auth.session.supabaseUser?.email ||
          'JL Superadmin',
        login:
          auth.session.supabaseUser?.loginName ||
          auth.session.supabaseUser?.email ||
          auth.platformAdmin.email ||
          auth.platformAdmin.id,
        email: auth.session.supabaseUser?.email || auth.platformAdmin.email || undefined,
        permissions: ALL_USER_PERMISSIONS,
      };

    const result = await createCompanyFromPanel({
      actor,
      actorSupabaseUserId: auth.session.supabaseUser?.id || null,
      companyTradeName: String(body.companyTradeName || ''),
      companyLegalName: typeof body.companyLegalName === 'string' ? body.companyLegalName : null,
      companySlug: typeof body.companySlug === 'string' ? body.companySlug : null,
      documentNumber: typeof body.documentNumber === 'string' ? body.documentNumber : null,
      phone: typeof body.phone === 'string' ? body.phone : null,
      email: typeof body.email === 'string' ? body.email : null,
      addressLine: typeof body.addressLine === 'string' ? body.addressLine : null,
      city: typeof body.city === 'string' ? body.city : null,
      stateCode: typeof body.stateCode === 'string' ? body.stateCode : null,
      zipCode: typeof body.zipCode === 'string' ? body.zipCode : null,
      status: String(body.status || 'trial') as 'active' | 'inactive' | 'suspended' | 'trial',
      adminFullName: String(body.adminFullName || ''),
      adminEmail: String(body.adminEmail || ''),
      adminPassword: String(body.adminPassword || ''),
      adminLoginName: typeof body.adminLoginName === 'string' ? body.adminLoginName : null,
      defaultWarrantyDays: typeof body.defaultWarrantyDays === 'number' ? body.defaultWarrantyDays : 90,
      planName: typeof body.planName === 'string' ? body.planName : null,
      trialStartsAt: typeof body.trialStartsAt === 'string' ? body.trialStartsAt : null,
      trialEndsAt: typeof body.trialEndsAt === 'string' ? body.trialEndsAt : null,
      internalNotes: typeof body.internalNotes === 'string' ? body.internalNotes : null,
      requirePasswordChange: Boolean(body.requirePasswordChange),
      requestMetadata,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Erro ao criar empresa no painel JL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao criar empresa.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = (await request.json()) as Record<string, unknown>;
    const operation = String(body.operation || 'update');
    const requestMetadata = {
      ...getRequestMetadata(request),
      platformAdminId: auth.platformAdmin.id,
    };

    if (operation === 'set-status') {
      const result = await setCompanyStatusFromPanel({
        actorSupabaseUserId: auth.session.supabaseUser?.id || null,
        companyId: String(body.companyId || ''),
        status: String(body.status || 'inactive') as 'active' | 'inactive' | 'suspended' | 'trial',
        requestMetadata,
      });

      return NextResponse.json({ success: true, result });
    }

    const result = await updateCompanyFromPanel(
      auth.session.supabaseUser?.id || null,
      {
        companyId: String(body.companyId || ''),
        companyTradeName: String(body.companyTradeName || ''),
        companyLegalName: typeof body.companyLegalName === 'string' ? body.companyLegalName : null,
        documentNumber: typeof body.documentNumber === 'string' ? body.documentNumber : null,
        phone: typeof body.phone === 'string' ? body.phone : null,
        email: typeof body.email === 'string' ? body.email : null,
        addressLine: typeof body.addressLine === 'string' ? body.addressLine : null,
        city: typeof body.city === 'string' ? body.city : null,
        stateCode: typeof body.stateCode === 'string' ? body.stateCode : null,
        zipCode: typeof body.zipCode === 'string' ? body.zipCode : null,
        status: String(body.status || 'trial') as 'active' | 'inactive' | 'suspended' | 'trial',
        defaultWarrantyDays: typeof body.defaultWarrantyDays === 'number' ? body.defaultWarrantyDays : 90,
        planName: typeof body.planName === 'string' ? body.planName : null,
        trialStartsAt: typeof body.trialStartsAt === 'string' ? body.trialStartsAt : null,
        trialEndsAt: typeof body.trialEndsAt === 'string' ? body.trialEndsAt : null,
        internalNotes: typeof body.internalNotes === 'string' ? body.internalNotes : null,
        requirePasswordChange: Boolean(body.requirePasswordChange),
      },
      requestMetadata
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Erro ao atualizar empresa no painel JL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar empresa.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}
