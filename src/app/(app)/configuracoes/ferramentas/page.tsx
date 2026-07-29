
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileUp, DatabaseZap, CheckCircle, AlertTriangle, Users, FileSpreadsheet, Shield, Building2, RefreshCcw } from 'lucide-react';
import { bootstrapSaasTenant, importCustomers, restoreBackup } from '@/lib/storage';
import type { Customer } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';

interface BackupDataSummary {
  customers: number;
  serviceOrders: number;
  sales: number;
  financialTransactions: number;
  users: number;
  stock: number;
  [key: string]: number;
}

export default function FerramentasPage() {
  const { toast } = useToast();
  const session = useCurrentAppSession();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [backupFile, setBackupFile] = React.useState<File | null>(null);
  const [backupContent, setBackupContent] = React.useState<any>(null);
  const [analysis, setAnalysis] = React.useState<{ summary: BackupDataSummary; metadata: any; error?: string } | null>(null);
  const [isConfirmImportOpen, setIsConfirmImportOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const maposFileInputRef = React.useRef<HTMLInputElement>(null);
  const [maposFile, setMaposFile] = React.useState<File | null>(null);
  const [maposCustomersPreview, setMaposCustomersPreview] = React.useState<Customer[]>([]);
  const [maposImportMode, setMaposImportMode] = React.useState<'merge' | 'replace'>('merge');
  const [isImportingMapos, setIsImportingMapos] = React.useState(false);
  const [bootstrapSecret, setBootstrapSecret] = React.useState('');
  const [supabaseUserId, setSupabaseUserId] = React.useState('');
  const [bootstrapCompanySlug, setBootstrapCompanySlug] = React.useState('');
  const [bootstrapTradeName, setBootstrapTradeName] = React.useState('');
  const [bootstrapLegalName, setBootstrapLegalName] = React.useState('');
  const [isBootstrappingSaas, setIsBootstrappingSaas] = React.useState(false);

  if (session.isLoading) {
    return (
      <ModuleLoadingState
        title="Carregando ferramentas"
        description="Verificando a sessao e a empresa ativa."
      />
    );
  }

  // These controls still write the legacy global app_records store. Do not
  // expose them to a SaaS tenant until their company-scoped replacement exists.
  if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
    return (
      <ModuleState
        title="Ferramentas em migracao para o tenant"
        description="Backup, restauracao e limpeza ainda nao podem ser executados porque o fluxo legado nao isola company_id. A versao SaaS sera liberada somente com transacao, auditoria e validacao do tenant do backup."
      />
    );
  }

  React.useEffect(() => {
    if (session.supabaseUser?.id) {
      setSupabaseUserId((current) => current || session.supabaseUser?.id || '');
    }
  }, [session.supabaseUser?.id]);

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    result.push(current.trim());
    return result;
  };

  const parseMaposCustomersCsv = (text: string): Customer[] => {
    const normalizedText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
    if (!normalizedText) {
      throw new Error('O arquivo CSV está vazio.');
    }

    const lines = normalizedText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('O CSV precisa ter cabeçalho e pelo menos uma linha de cliente.');
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^"|"$/g, '').trim().toLowerCase());
    const requiredHeaders = ['id', 'name', 'phone', 'email', 'address', 'document'];

    for (const requiredHeader of requiredHeaders) {
      if (!headers.includes(requiredHeader)) {
        throw new Error(`Coluna obrigatória ausente no CSV: ${requiredHeader}`);
      }
    }

    return lines.slice(1).map((line, index) => {
      const columns = parseCsvLine(line).map((value) => value.replace(/^"|"$/g, '').trim());
      const record = Object.fromEntries(headers.map((header, columnIndex) => [header, columns[columnIndex] || '']));

      return {
        id: record.id || `MAPOS-LINHA-${index + 1}`,
        name: record.name || '',
        phone: record.phone || '',
        email: record.email || '',
        address: record.address || '',
        document: record.document || '',
      } satisfies Customer;
    }).filter((customer) => customer.name.length > 0);
  };

  const handleMaposFileSelect = (file: File | null) => {
    if (!file) return;

    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    if (!isCsv) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Selecione um arquivo CSV exportado do MapOS.',
      });
      return;
    }

    setMaposFile(file);
    setMaposCustomersPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Não foi possível ler o arquivo CSV.');
        }

        const parsedCustomers = parseMaposCustomersCsv(text);
        setMaposCustomersPreview(parsedCustomers);
        toast({
          title: 'CSV analisado com sucesso',
          description: `${parsedCustomers.length} clientes prontos para importação.`,
        });
      } catch (error: any) {
        setMaposCustomersPreview([]);
        toast({
          variant: 'destructive',
          title: 'Erro ao ler CSV',
          description: error.message || 'Não foi possível interpretar o arquivo do MapOS.',
        });
      }
    };

    reader.readAsText(file);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        variant: 'destructive',
        title: 'Arquivo Inválido',
        description: 'Por favor, selecione um arquivo de backup no formato JSON.',
      });
      return;
    }
    setBackupFile(file);
    setAnalysis(null);
    setBackupContent(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Não foi possível ler o conteúdo do arquivo.');
        const data = JSON.parse(text);
        setBackupContent(data);
        analyzeBackup(data);
      } catch (error: any) {
        setAnalysis({ error: error.message || 'O arquivo JSON é inválido ou está corrompido.', summary: {} as BackupDataSummary, metadata: null });
      }
    };
    reader.readAsText(file);
  };

  const analyzeBackup = (data: any) => {
    if (!data.metadata || data.metadata.version !== 1 || !data.data) {
      setAnalysis({
        error: 'Este não parece ser um arquivo de backup válido ou a versão não é suportada.',
        summary: {} as BackupDataSummary,
        metadata: data.metadata || {}
      });
      return;
    }

    const summary: BackupDataSummary = {
      customers: data.data.customers?.length || 0,
      serviceOrders: data.data.serviceOrders?.length || 0,
      sales: data.data.sales?.length || 0,
      financialTransactions: data.data.financialTransactions?.length || 0,
      users: data.data.users?.length || 0,
      stock: data.data.stock?.length || 0,
      appointments: data.data.appointments?.length || 0,
      quotes: data.data.quotes?.length || 0,
      kits: data.data.kits?.length || 0,
    };
    
    setAnalysis({ summary, metadata: data.metadata });
  };


  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleImport = async () => {
    if (!backupContent) return;

    try {
        const result = await restoreBackup(backupContent);
        toast({
            title: 'Importação Concluída com Sucesso!',
            description: `Os dados foram restaurados. É recomendado recarregar o sistema. (${result.message})`,
        });
        setTimeout(() => window.location.reload(), 2000);
    } catch(err: any) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Importar Dados',
            description: err.message || 'Não foi possível salvar os dados no sistema.',
        });
    } finally {
        setIsConfirmImportOpen(false);
    }
  }

  const handleMaposImport = async () => {
    if (maposCustomersPreview.length === 0) return;

    try {
      setIsImportingMapos(true);
      const result = await importCustomers(maposCustomersPreview, maposImportMode);
      toast({
        title: 'Clientes importados com sucesso',
        description:
          maposImportMode === 'replace'
            ? `${result.imported} clientes importados substituindo a base atual.`
            : `${result.imported} clientes processados. Total atual: ${result.total}.`,
      });
      setMaposFile(null);
      setMaposCustomersPreview([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao importar clientes',
        description: error.message || 'Não foi possível importar os clientes do MapOS.',
      });
    } finally {
      setIsImportingMapos(false);
    }
  };

  const handleSaasBootstrap = async () => {
    if (!bootstrapSecret.trim()) {
      toast({
        variant: 'destructive',
        title: 'Segredo obrigatorio',
        description: 'Informe o SAAS_BOOTSTRAP_SECRET antes de executar o bootstrap.',
      });
      return;
    }

    if (!supabaseUserId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Usuario Supabase obrigatorio',
        description: 'Informe o supabaseUserId que sera vinculado como admin inicial.',
      });
      return;
    }

    try {
      setIsBootstrappingSaas(true);
      const result = await bootstrapSaasTenant({
        supabaseUserId,
        bootstrapSecret,
        companySlug: bootstrapCompanySlug,
        companyTradeName: bootstrapTradeName,
        companyLegalName: bootstrapLegalName,
        forceSetActiveCompany: true,
      });

      toast({
        title: 'Bootstrap SaaS concluido',
        description: `Empresa ${result.companySlug} vinculada ao usuario ${result.authUserId}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no bootstrap SaaS',
        description: error?.message || 'Nao foi possivel concluir o bootstrap.',
      });
    } finally {
      setIsBootstrappingSaas(false);
    }
  };


  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagnostico SaaS</CardTitle>
            <CardDescription>
              Inspecione a sessao atual do runtime SaaS e execute o bootstrap administrativo da primeira empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Auth Source
                </div>
                <Badge variant="outline">{session.authSource}</Badge>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Supabase User
                </div>
                <p className="break-all text-sm text-muted-foreground">
                  {session.supabaseUser?.id || 'nenhum'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Active Company
                </div>
                <p className="break-all text-sm text-muted-foreground">
                  {session.tenantContext?.activeCompanyId || 'nenhuma'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <RefreshCcw className="h-4 w-4" />
                  Tenant Access
                </div>
                <Badge variant={session.tenantAccess?.canAccessTenant ? 'default' : 'secondary'}>
                  {session.tenantAccess?.status || 'indisponivel'}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium">Estado detalhado da sessao</p>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {JSON.stringify(
                  {
                    user: session.user
                      ? {
                          id: session.user.id,
                          name: session.user.name,
                          login: session.user.login,
                        }
                      : null,
                    authSource: session.authSource,
                    supabaseUser: session.supabaseUser,
                    tenantContext: session.tenantContext,
                    tenantAccess: session.tenantAccess,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bootstrap Inicial da Empresa</CardTitle>
                <CardDescription>
                  Vincula um usuario existente no Supabase Auth como admin inicial da empresa bootstrapada.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bootstrap-secret">Segredo de Bootstrap</Label>
                  <Input
                    id="bootstrap-secret"
                    type="password"
                    value={bootstrapSecret}
                    onChange={(e) => setBootstrapSecret(e.target.value)}
                    placeholder="SAAS_BOOTSTRAP_SECRET"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supabase-user-id">Supabase User ID</Label>
                  <Input
                    id="supabase-user-id"
                    value={supabaseUserId}
                    onChange={(e) => setSupabaseUserId(e.target.value)}
                    placeholder="UUID do auth.users"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-company-slug">Slug da Empresa</Label>
                  <Input
                    id="bootstrap-company-slug"
                    value={bootstrapCompanySlug}
                    onChange={(e) => setBootstrapCompanySlug(e.target.value)}
                    placeholder="opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-trade-name">Nome Fantasia</Label>
                  <Input
                    id="bootstrap-trade-name"
                    value={bootstrapTradeName}
                    onChange={(e) => setBootstrapTradeName(e.target.value)}
                    placeholder="opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-legal-name">Razao Social</Label>
                  <Input
                    id="bootstrap-legal-name"
                    value={bootstrapLegalName}
                    onChange={(e) => setBootstrapLegalName(e.target.value)}
                    placeholder="opcional"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t px-6 py-4">
                <Button onClick={handleSaasBootstrap} disabled={isBootstrappingSaas}>
                  <Shield className="mr-2 h-4 w-4" />
                  {isBootstrappingSaas ? 'Executando bootstrap...' : 'Executar Bootstrap SaaS'}
                </Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importar Clientes do MapOS</CardTitle>
            <CardDescription>
              Importe somente os clientes do MapOS a partir de um arquivo CSV. Você pode mesclar com a base atual ou substituir todos os clientes existentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-medium">Exporte do MapOS com esta consulta SQL:</p>
              <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">
{`SELECT
  CONCAT('MAPOS-', idClientes) AS id,
  nomeCliente AS name,
  COALESCE(NULLIF(celular, ''), telefone, '') AS phone,
  COALESCE(email, '') AS email,
  TRIM(CONCAT_WS(', ', rua, numero, complemento, bairro, cidade, estado, cep)) AS address,
  COALESCE(documento, '') AS document
FROM clientes
WHERE fornecedor = 0;`}
              </pre>
              <p className="mt-3 text-muted-foreground">
                Salve o resultado em CSV e importe aqui.
              </p>
            </div>

            <div className="rounded-lg border-2 border-dashed p-6 text-center space-y-3">
              <div className="mx-auto w-fit rounded-full bg-muted p-4">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                {maposFile ? `Arquivo carregado: ${maposFile.name}` : 'Selecione o CSV de clientes do MapOS'}
              </h3>
              <Button variant="outline" onClick={() => maposFileInputRef.current?.click()}>
                Selecionar CSV
              </Button>
              <input
                type="file"
                ref={maposFileInputRef}
                className="hidden"
                accept=".csv,text/csv"
                onChange={(e) => handleMaposFileSelect(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            {maposCustomersPreview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prévia da Importação</CardTitle>
                  <CardDescription>
                    {maposCustomersPreview.length} clientes encontrados no arquivo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={maposImportMode} onValueChange={(value: 'merge' | 'replace') => setMaposImportMode(value)}>
                    <div className="flex items-start space-x-3 rounded-md border p-3">
                      <RadioGroupItem value="merge" id="merge-customers" />
                      <div className="space-y-1">
                        <Label htmlFor="merge-customers">Mesclar com clientes atuais</Label>
                        <p className="text-sm text-muted-foreground">
                          Recomendado. Atualiza clientes parecidos e adiciona os novos.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 rounded-md border p-3">
                      <RadioGroupItem value="replace" id="replace-customers" />
                      <div className="space-y-1">
                        <Label htmlFor="replace-customers">Substituir todos os clientes</Label>
                        <p className="text-sm text-muted-foreground">
                          Apaga a lista atual de clientes e grava somente os do CSV.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="rounded-md bg-muted p-4 text-sm">
                    <p className="font-medium">Primeiros clientes encontrados:</p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {maposCustomersPreview.slice(0, 5).map((customer) => (
                        <li key={customer.id}>
                          {customer.name} | {customer.phone || 'sem telefone'} | {customer.document || 'sem documento'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t px-6 py-4">
                  <Button onClick={handleMaposImport} disabled={isImportingMapos}>
                    <Users className="mr-2 h-4 w-4" />
                    {isImportingMapos ? 'Importando...' : 'Importar Clientes'}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ferramenta de Importação de Dados</CardTitle>
            <CardDescription>
              Restaure o sistema a partir de um arquivo de backup. Esta ação substituirá todos os dados existentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-3"
              onDragEnter={() => setIsDragOver(true)}
              onDragLeave={() => setIsDragOver(false)}
              onDragOver={handleDragEvents}
              onDrop={handleDrop}
              style={{ backgroundColor: isDragOver ? 'var(--accent)' : 'transparent' }}
            >
              <div className="mx-auto bg-muted p-4 rounded-full w-fit">
                <FileUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                {backupFile ? `Arquivo Carregado: ${backupFile.name}` : "Arraste e solte o arquivo de backup (.json) aqui"}
              </h3>
              <p className="text-muted-foreground">ou</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Selecione um arquivo
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
              />
            </div>
            
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise do Backup</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.error ? (
                    <div className="p-4 border-l-4 border-destructive bg-destructive/10 text-destructive rounded-r-md">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-1" />
                        <div>
                          <h4 className="font-semibold">Arquivo Inválido</h4>
                          <p className="text-sm">{analysis.error}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-l-4 border-green-500 bg-green-500/10 text-green-700 rounded-r-md">
                       <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 mt-1" />
                        <div>
                           <h4 className="font-semibold">Backup Válido Encontrado!</h4>
                            <p className="text-sm">Criado em: {new Date(analysis.metadata.createdAt).toLocaleString('pt-BR')}</p>
                            <ul className="list-disc list-inside mt-2 text-xs grid grid-cols-2 gap-x-4">
                                {Object.entries(analysis.summary).map(([key, value]) => value > 0 && (
                                  <li key={key}>{value} {key}</li>
                                ))}
                            </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                {analysis && !analysis.error && (
                    <CardFooter className="border-t px-6 py-4 justify-end">
                        <Button onClick={() => setIsConfirmImportOpen(true)}>
                            <DatabaseZap className="mr-2 h-4 w-4"/>
                            Restaurar Dados para o Sistema
                        </Button>
                    </CardFooter>
                )}
              </Card>
            )}

          </CardContent>
        </Card>
      </div>

       <AlertDialog open={isConfirmImportOpen} onOpenChange={setIsConfirmImportOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Restauração?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível e substituirá permanentemente todos os dados do sistema pelos dados do arquivo de backup.
                Você tem certeza que deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleImport}>
                Sim, Restaurar e Substituir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

    
