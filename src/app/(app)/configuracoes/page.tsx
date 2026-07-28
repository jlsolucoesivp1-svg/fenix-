'use client';

import * as React from 'react';
import {
  Building,
  FileAudio2,
  FileImage,
  Image as ImageIcon,
  Music,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import LegacyConfiguracoesPage from '@/components/configuracoes/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleLoadingState } from '@/components/ui/module-state';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useToast } from '@/hooks/use-toast';
import type { AppSettings, CompanyAssetKind, CompanyAssetSummary, CompanyInfo } from '@/types';
import {
  deleteTenantCompanyAsset,
  listTenantCompanyAssets,
  getTenantCompanyInfo,
  getTenantSettings,
  saveTenantCompanyInfo,
  saveTenantSettings,
  uploadTenantCompanyAsset,
} from '@/lib/storage';

const DEFAULT_SETTINGS: AppSettings = {
  defaultWarrantyDays: 90,
  receiptPrintFormat: 'a4',
};

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: '',
  address: '',
  phone: '',
  emailOrSite: '',
  document: '',
  logoUrl: '',
  logoStoragePath: '',
  pixKey: '',
  notificationSoundUrl: '',
  notificationSoundStoragePath: '',
};

function SaaSCompanySettingsPage() {
  const { toast } = useToast();
  const session = useCurrentAppSession();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingCompany, setIsSavingCompany] = React.useState(false);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = React.useState<CompanyAssetKind | null>(null);
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [assets, setAssets] = React.useState<CompanyAssetSummary[]>([]);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const soundInputRef = React.useRef<HTMLInputElement>(null);
  const brandMediaInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [settingsData, companyInfoData, assetsData] = await Promise.all([
          getTenantSettings(),
          getTenantCompanyInfo(),
          listTenantCompanyAssets(),
        ]);

        if (cancelled) return;
        setSettings(settingsData);
        setCompanyInfo(companyInfoData);
        setAssets(assetsData);
      } catch (error) {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar configuracoes',
            description: error instanceof Error ? error.message : 'Nao foi possivel carregar as configuracoes SaaS.',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [session.isLoading, toast]);

  const handleCompanyInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setCompanyInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setSettings((prev) => ({ ...prev, [id]: Number(value) }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'Por favor, selecione uma imagem com menos de 1MB.',
      });
      return;
    }

    try {
      setIsUploadingAsset('logo');
      const nextAssets = await uploadTenantCompanyAsset('logo', file);
      setAssets(nextAssets);
      const latestLogo = nextAssets.find((asset) => asset.kind === 'logo');
      if (latestLogo) {
        setCompanyInfo((prev) => ({
          ...prev,
          logoUrl: latestLogo.downloadUrl,
          logoStoragePath: latestLogo.path,
        }));
      }
      toast({
        title: 'Logo enviada!',
        description: 'A logo foi salva no bucket company-assets.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar logo',
        description: error instanceof Error ? error.message : 'Nao foi possivel enviar a logo.',
      });
    } finally {
      setIsUploadingAsset(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSoundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'Por favor, selecione um audio com menos de 1MB.',
      });
      return;
    }

    try {
      setIsUploadingAsset('notification-sound');
      const nextAssets = await uploadTenantCompanyAsset('notification-sound', file);
      setAssets(nextAssets);
      const latestSound = nextAssets.find((asset) => asset.kind === 'notification-sound');
      if (latestSound) {
        setCompanyInfo((prev) => ({
          ...prev,
          notificationSoundUrl: latestSound.downloadUrl,
          notificationSoundStoragePath: latestSound.path,
        }));
      }
      toast({
        title: 'Som enviado!',
        description: 'O audio foi salvo no bucket company-assets.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar som',
        description: error instanceof Error ? error.message : 'Nao foi possivel enviar o audio.',
      });
    } finally {
      setIsUploadingAsset(null);
      if (soundInputRef.current) soundInputRef.current.value = '';
    }
  };

  const handleBrandMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAsset('brand-media');
      const nextAssets = await uploadTenantCompanyAsset('brand-media', file);
      setAssets(nextAssets);
      toast({
        title: 'Asset enviado!',
        description: 'O arquivo foi adicionado a biblioteca de marca.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar asset',
        description: error instanceof Error ? error.message : 'Nao foi possivel enviar o asset.',
      });
    } finally {
      setIsUploadingAsset(null);
      if (brandMediaInputRef.current) brandMediaInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setCompanyInfo((prev) => ({ ...prev, logoUrl: '', logoStoragePath: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleRemoveSound = () => {
    setCompanyInfo((prev) => ({ ...prev, notificationSoundUrl: '', notificationSoundStoragePath: '' }));
    if (soundInputRef.current) soundInputRef.current.value = '';
  };

  const handleApplyAsset = (asset: CompanyAssetSummary) => {
    if (asset.kind === 'logo') {
      setCompanyInfo((prev) => ({
        ...prev,
        logoUrl: asset.downloadUrl,
        logoStoragePath: asset.path,
      }));
      return;
    }

    if (asset.kind === 'notification-sound') {
      setCompanyInfo((prev) => ({
        ...prev,
        notificationSoundUrl: asset.downloadUrl,
        notificationSoundStoragePath: asset.path,
      }));
    }
  };

  const handleDeleteAsset = async (asset: CompanyAssetSummary) => {
    try {
      const nextAssets = await deleteTenantCompanyAsset(asset.path);
      setAssets(nextAssets);
      setCompanyInfo((prev) => ({
        ...prev,
        logoUrl: prev.logoStoragePath === asset.path ? '' : prev.logoUrl,
        logoStoragePath: prev.logoStoragePath === asset.path ? '' : prev.logoStoragePath,
        notificationSoundUrl:
          prev.notificationSoundStoragePath === asset.path ? '' : prev.notificationSoundUrl,
        notificationSoundStoragePath:
          prev.notificationSoundStoragePath === asset.path ? '' : prev.notificationSoundStoragePath,
      }));
      toast({
        title: 'Asset excluido!',
        description: 'O arquivo foi removido da biblioteca de marca.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir asset',
        description: error instanceof Error ? error.message : 'Nao foi possivel excluir o asset.',
      });
    }
  };

  const groupedAssets = React.useMemo(
    () => ({
      logo: assets.filter((asset) => asset.kind === 'logo'),
      notificationSound: assets.filter((asset) => asset.kind === 'notification-sound'),
      brandMedia: assets.filter((asset) => asset.kind === 'brand-media'),
    }),
    [assets]
  );

  const handleSaveCompanyInfo = async () => {
    try {
      setIsSavingCompany(true);
      const savedCompanyInfo = await saveTenantCompanyInfo(companyInfo);
      setCompanyInfo(savedCompanyInfo);
      toast({
        title: 'Dados da empresa salvos!',
        description: 'As configuracoes da empresa do tenant atual foram atualizadas.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar dados da empresa',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar os dados da empresa.',
      });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      const savedSettings = await saveTenantSettings(settings);
      setSettings(savedSettings);
      toast({
        title: 'Configuracoes salvas!',
        description: 'As configuracoes gerais do tenant atual foram atualizadas.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar configuracoes',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar as configuracoes.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (session.isLoading || isLoading) {
    return (
      <ModuleLoadingState
        title="Carregando configuracoes SaaS"
        description="Sincronizando dados da empresa, branding e assets do tenant atual."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
          <CardDescription>
            Informacoes da empresa ativa no tenant SaaS atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input id="name" value={companyInfo.name || ''} onChange={handleCompanyInfoChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="document">CNPJ / CPF</Label>
              <Input id="document" value={companyInfo.document || ''} onChange={handleCompanyInfoChange} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Endereco</Label>
            <Input id="address" value={companyInfo.address || ''} onChange={handleCompanyInfoChange} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone de Contato</Label>
              <Input id="phone" value={companyInfo.phone || ''} onChange={handleCompanyInfoChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="emailOrSite">E-mail ou Website</Label>
              <Input id="emailOrSite" value={companyInfo.emailOrSite || ''} onChange={handleCompanyInfoChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input id="pixKey" value={companyInfo.pixKey || ''} onChange={handleCompanyInfoChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                {companyInfo.logoUrl ? (
                  <Image src={companyInfo.logoUrl} alt="Logo Preview" width={80} height={80} className="object-contain" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                  {isUploadingAsset === 'logo' ? 'Enviando...' : 'Escolher Arquivo'}
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                />
                {companyInfo.logoUrl ? (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveLogo}>
                    <X className="mr-1 h-4 w-4" />
                    Remover Logo
                  </Button>
                ) : null}
                <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG, ate 1MB.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveCompanyInfo} disabled={isSavingCompany}>
            <Building className="mr-2 h-4 w-4" />
            Salvar Dados da Empresa
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuracoes Gerais</CardTitle>
          <CardDescription>
            Parametros gerais da empresa ativa no tenant SaaS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-semibold">Garantia</h3>
            <div className="space-y-2">
              <Label htmlFor="defaultWarrantyDays">Prazo de Garantia Padrao (em dias)</Label>
              <Input
                id="defaultWarrantyDays"
                type="number"
                className="max-w-xs"
                value={settings.defaultWarrantyDays || ''}
                onChange={handleSettingsChange}
              />
              <p className="text-sm text-muted-foreground">
                Este valor sera usado como padrao para servicos que nao tiverem garantia especifica.
              </p>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-semibold">Comprovante de Venda</h3>
            <div className="space-y-2">
              <Label htmlFor="receiptPrintFormat">Formato padrao do comprovante de venda</Label>
              <Select
                value={settings.receiptPrintFormat}
                onValueChange={(value) =>
                  setSettings((previous) => ({
                    ...previous,
                    receiptPrintFormat: value === 'thermal_80mm' ? 'thermal_80mm' : 'a4',
                  }))
                }
              >
                <SelectTrigger id="receiptPrintFormat" className="max-w-sm">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="thermal_80mm">Termica 80 mm</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                O operador ainda pode escolher o outro formato ao imprimir uma venda.
              </p>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-semibold">Sons e Notificacoes</h3>
            <div className="space-y-2">
              <Label>Som de Notificacao da Agenda</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                  {companyInfo.notificationSoundUrl ? (
                    <audio controls src={companyInfo.notificationSoundUrl} className="h-full w-full" />
                  ) : (
                    <Music className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => soundInputRef.current?.click()}>
                    {isUploadingAsset === 'notification-sound' ? 'Enviando...' : 'Escolher Som'}
                  </Button>
                  <input
                    ref={soundInputRef}
                    type="file"
                    className="hidden"
                    accept="audio/mpeg, audio/wav, audio/ogg"
                    onChange={handleSoundUpload}
                  />
                  {companyInfo.notificationSoundUrl ? (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveSound}>
                      <X className="mr-1 h-4 w-4" />
                      Remover Som
                    </Button>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Recomendado: MP3 ou WAV, ate 1MB.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Biblioteca de Marca</h3>
                <p className="text-sm text-muted-foreground">
                  Assets adicionais da empresa no bucket <code>company-assets</code>.
                </p>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => brandMediaInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploadingAsset === 'brand-media' ? 'Enviando...' : 'Adicionar Midia'}
                </Button>
                <input
                  ref={brandMediaInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,audio/*"
                  onChange={handleBrandMediaUpload}
                />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { title: 'Logos', icon: FileImage, items: groupedAssets.logo },
                { title: 'Sons', icon: FileAudio2, items: groupedAssets.notificationSound },
                { title: 'Midia de Marca', icon: ImageIcon, items: groupedAssets.brandMedia },
              ].map((group) => (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{group.title}</h4>
                  </div>
                  {group.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum item nesta categoria.</p>
                  ) : (
                    <div className="space-y-2">
                      {group.items.map((asset) => (
                        <div key={asset.path} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {asset.mimeType || 'tipo nao informado'} • {(asset.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={asset.downloadUrl} target="_blank" rel="noreferrer">
                                Abrir
                              </a>
                            </Button>
                            {asset.kind !== 'brand-media' ? (
                              <Button variant="secondary" size="sm" onClick={() => handleApplyAsset(asset)}>
                                Usar neste campo
                              </Button>
                            ) : null}
                            <Button variant="destructive" size="sm" onClick={() => void handleDeleteAsset(asset)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configuracoes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const session = useCurrentAppSession();

  if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
    return <SaaSCompanySettingsPage />;
  }

  return <LegacyConfiguracoesPage />;
}
