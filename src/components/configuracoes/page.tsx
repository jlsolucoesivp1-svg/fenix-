
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Upload, AlertTriangle, Trash2, PlusCircle, Users, KeyRound, Phone, User as UserIcon, Building, Image as ImageIcon, X, Wrench, ShieldCheck, QrCode, Calendar, Music, FileQuote, Package, PackagePlus, Paintbrush, ExternalLink, FileSignature } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getUsers, saveUsers, getCompanyInfo, saveCompanyInfo, saveSettings, getSettings, getSales, getQuotes, getAppointments, getFinancialTransactions, saveSales, saveQuotes, saveAppointments, saveFinancialTransactions, getCustomers, saveCustomers, getServiceOrders, saveServiceOrders, getKits, saveKits, getStock, saveStock, restoreBackup } from '@/lib/storage';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { User, CompanyInfo, UserPermissions } from '@/types';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface AppSettings {
  defaultWarrantyDays: number;
}

const initialNewUser: Partial<User> = {
  name: '',
  login: '',
  password: '',
  permissions: {
    accessDashboard: true,
    accessClients: true,
    accessServiceOrders: true,
    accessInventory: true,
    accessSales: true,
    accessFinancials: true,
    accessSettings: true,
    accessDangerZone: true,
    accessAgenda: true,
    accessQuotes: true,
    accessLaudos: true,
    canEdit: true,
    canDelete: true,
    canViewPasswords: true,
    canManageUsers: true,
  },
};

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const [settings, setSettings] = React.useState<AppSettings>({ defaultWarrantyDays: 90 });
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo>({ name: '', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '', notificationSoundUrl: '' });
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isClearAlertOpen, setIsClearAlertOpen] = React.useState(false);

  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [newUser, setNewUser] = React.useState<Partial<User>>(initialNewUser);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const soundInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [savedSettings, companyInfoData, usersData] = await Promise.all([
            getSettings(),
            getCompanyInfo(),
            getUsers(),
        ]);
        
        setSettings(savedSettings);
        setCompanyInfo(companyInfoData || { name: '', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '' });
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to load settings", error);
        toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: 'Não foi possível buscar as informações do servidor.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);
  
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewUser(prev => ({ ...prev, [id]: value }));
  };
  
  const handlePermissionChange = (permission: keyof UserPermissions, checked: boolean) => {
    setNewUser(prev => ({
      ...prev,
      permissions: {
        ...prev?.permissions,
        [permission]: checked
      }
    }));
  };

  const handleSelectAllPermissions = () => {
    if (!newUser.permissions) return;
    const allPermissions = Object.keys(newUser.permissions).reduce((acc, key) => {
      acc[key as keyof UserPermissions] = true;
      return acc;
    }, {} as UserPermissions);

    setNewUser(prev => ({
      ...prev,
      permissions: allPermissions,
    }));
  }

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSaveCompanyInfo = async () => {
    await saveCompanyInfo(companyInfo);
    toast({
        title: "Dados da Empresa Salvos!",
        description: "As informações da sua empresa foram atualizadas.",
    });
  };
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione uma imagem com menos de 1MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo(prev => ({...prev, logoUrl: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSoundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          variant: 'destructive',
          title: 'Arquivo de áudio muito grande',
          description: 'Por favor, selecione um arquivo com menos de 1MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo(prev => ({...prev, notificationSoundUrl: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setCompanyInfo(prev => ({...prev, logoUrl: ''}));
    if(logoInputRef.current) logoInputRef.current.value = '';
  };
  
  const handleRemoveSound = () => {
    setCompanyInfo(prev => ({...prev, notificationSoundUrl: ''}));
    if (soundInputRef.current) soundInputRef.current.value = '';
  };


  const handleSaveSettings = async () => {
    try {
      await saveSettings(settings);
      toast({
        title: "Configurações Salvas!",
        description: "Suas alterações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações.",
      });
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: Number(value) }));
  };

  const handleBackup = async () => {
    try {
      const dataTypes = ['customers', 'serviceOrders', 'sales', 'financialTransactions', 'users', 'companyInfo', 'settings', 'quotes', 'appointments', 'kits', 'stock'];
      const dataPromises = dataTypes.map(async (type) => {
        switch(type) {
            case 'customers': return { key: type, data: await getCustomers() };
            case 'serviceOrders': return { key: type, data: await getServiceOrders() };
            case 'sales': return { key: type, data: await getSales() };
            case 'financialTransactions': return { key: type, data: await getFinancialTransactions() };
            case 'users': return { key: type, data: await getUsers() };
            case 'companyInfo': return { key: type, data: await getCompanyInfo() };
            case 'settings': return { key: type, data: await getSettings() };
            case 'quotes': return { key: type, data: await getQuotes() };
            case 'appointments': return { key: type, data: await getAppointments() };
            case 'kits': return { key: type, data: await getKits() };
            case 'stock': return { key: type, data: await getStock() };
            default: return null;
        }
      });
      
      const resolvedData = (await Promise.all(dataPromises)).filter(Boolean);
      const backupData = resolvedData.reduce((acc, item) => {
        if(item) acc[item.key] = item.data;
        return acc;
      }, {} as Record<string, any>);

      const fullBackup = {
        metadata: {
            version: 1,
            createdAt: new Date().toISOString(),
            appName: 'Assistec Now'
        },
        data: backupData
      };

      const jsonString = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup-assistec-now-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Backup Realizado!', description: 'O download do arquivo de backup foi iniciado.' });
    } catch (error) {
      console.error("Backup error:", error);
      toast({ variant: 'destructive', title: 'Erro no Backup', description: 'Não foi possível gerar o arquivo de backup.' });
    }
  };

  const handleClearSystem = async () => {
    try {
      const savePromises = [
        saveCustomers([]),
        saveServiceOrders([]),
        saveSales([]),
        saveFinancialTransactions([]),
        saveUsers([]),
        saveAppointments([]),
        saveQuotes([]),
        saveKits([]),
        saveStock([]),
        saveCompanyInfo({} as CompanyInfo),
        saveSettings({ defaultWarrantyDays: 90 })
      ];
      await Promise.all(savePromises);
      
      toast({ title: 'Sistema Limpo!', description: 'Todos os dados foram removidos. A página será recarregada.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível limpar os dados do sistema.' });
    }
    setIsClearAlertOpen(false);
  };

  const handleOpenUserDialog = (user: User | null) => {
    setEditingUser(user);
    if (user) {
      setNewUser({ ...user, password: '' });
    } else {
      setNewUser(JSON.parse(JSON.stringify(initialNewUser)));
    }
    setIsUserDialogOpen(true);
  }

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.login || (!newUser.password && !editingUser)) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Nome, Login e Senha são obrigatórios.' });
      return;
    }

    let updatedUsers: User[];
    if (editingUser) {
      const userToUpdate: User = { ...editingUser, ...newUser };
      if (newUser.password) {
        // Encode password only if it has changed
        userToUpdate.password = btoa(newUser.password);
      } else {
        // Keep the old encoded password
        userToUpdate.password = editingUser.password;
      }
      updatedUsers = users.map(u => u.id === editingUser.id ? userToUpdate : u);
      toast({ title: 'Usuário Atualizado!', description: `Os dados de ${newUser.name} foram salvos.` });
    } else {
      const userToAdd: User = {
        id: `USER-${Date.now()}`,
        name: newUser.name!,
        login: newUser.login!,
        password: btoa(newUser.password!), // Always encode for new users
        permissions: newUser.permissions!,
      };
      updatedUsers = [...users, userToAdd];
      toast({ title: 'Usuário Adicionado!', description: `${newUser.name} foi adicionado ao sistema.` });
    }

    setUsers(updatedUsers);
    await saveUsers(updatedUsers);
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };
  
  const canManageUsers = currentUser?.permissions.canManageUsers;
  const isEditingSelf = editingUser?.id === currentUser?.id;

  if (isLoading) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Ajuste as configurações gerais do sistema.</CardDescription>
        </CardHeader>
        <CardContent><div className="h-48 flex items-center justify-center">Carregando...</div></CardContent>
      </Card>
    )
  }
  
  const renderPermission = (key: keyof UserPermissions, label: string) => (
    <div key={key} className="flex items-center space-x-2">
        <Checkbox
            id={key}
            checked={newUser.permissions?.[key]}
            onCheckedChange={(checked) => handlePermissionChange(key, Boolean(checked))}
            disabled={!canManageUsers}
        />
        <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
        </label>
    </div>
  );
  
  return (
    <div className="space-y-6">
    <Card>
        <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>Informações que aparecerão nos documentos e no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="name">Nome da Empresa</Label><Input id="name" value={companyInfo.name || ''} onChange={handleCompanyInfoChange} disabled={!canManageUsers} /></div>
                <div className="space-y-1"><Label htmlFor="document">CNPJ / CPF</Label><Input id="document" value={companyInfo.document || ''} onChange={handleCompanyInfoChange} disabled={!canManageUsers} /></div>
            </div>
             <div className="space-y-1"><Label htmlFor="address">Endereço</Label><Input id="address" value={companyInfo.address || ''} onChange={handleCompanyInfoChange} disabled={!canManageUsers} /></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="phone">Telefone de Contato</Label><Input id="phone" value={companyInfo.phone || ''} onChange={handleCompanyInfoChange} disabled={!canManageUsers} /></div>
                <div className="space-y-1"><Label htmlFor="emailOrSite">E-mail ou Website</Label><Input id="emailOrSite" value={companyInfo.emailOrSite || ''} onChange={handleCompanyInfoChange} disabled={!canManageUsers} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="pixKey">Chave PIX</Label><Input id="pixKey" placeholder="CNPJ, E-mail, Telefone ou Chave Aleatória" value={companyInfo.pixKey || ''} onChange={handleCompanyInfoChange} disabled={!canManageUsers} /></div>
            </div>
             <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-md border flex items-center justify-center bg-muted/30 overflow-hidden">
                    {companyInfo.logoUrl ? <Image src={companyInfo.logoUrl} alt="Logo Preview" width={80} height={80} className="object-contain" /> : <ImageIcon className="w-10 h-10 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-col gap-2">
                     <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={!canManageUsers}>Escolher Arquivo</Button>
                    <input ref={logoInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload}/>
                     {companyInfo.logoUrl && <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveLogo} disabled={!canManageUsers}><X className="w-4 h-4 mr-1" />Remover Logo</Button>}
                    <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG, até 1MB.</p>
                  </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSaveCompanyInfo} disabled={!canManageUsers}><Building className="mr-2 h-4 w-4" />Salvar Dados da Empresa</Button>
        </CardFooter>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
        <CardDescription>Ajuste as configurações gerais do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg">
           <h3 className="text-lg font-semibold mb-2">Garantia</h3>
           <div className="space-y-2">
             <Label htmlFor="defaultWarrantyDays">Prazo de Garantia Padrão (em dias)</Label>
             <Input id="defaultWarrantyDays" type="number" className="max-w-xs" value={settings.defaultWarrantyDays || ''} onChange={handleSettingsChange} disabled={!canManageUsers} />
             <p className="text-sm text-muted-foreground">Este valor será usado como padrão para os serviços que não tiverem uma garantia específica.</p>
           </div>
        </div>
        <div className="p-4 border rounded-lg">
           <h3 className="text-lg font-semibold mb-2">Sons e Notificações</h3>
            <div className="space-y-2">
                <Label>Som de Notificação da Agenda</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-md border flex items-center justify-center bg-muted/30 overflow-hidden">
                    {companyInfo.notificationSoundUrl ? (
                      <audio controls src={companyInfo.notificationSoundUrl} className="h-full w-full"></audio>
                    ) : (
                      <Music className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                     <Button variant="outline" size="sm" onClick={() => soundInputRef.current?.click()} disabled={!canManageUsers}>Escolher Som</Button>
                    <input ref={soundInputRef} type="file" className="hidden" accept="audio/mpeg, audio/wav, audio/ogg" onChange={handleSoundUpload}/>
                     {companyInfo.notificationSoundUrl && <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveSound} disabled={!canManageUsers}><X className="w-4 h-4 mr-1" />Remover Som</Button>}
                    <p className="text-xs text-muted-foreground">Recomendado: MP3 ou WAV, até 1MB.</p>
                  </div>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4"><Button onClick={handleSaveSettings} disabled={!canManageUsers}><Save className="mr-2 h-4 w-4" />Salvar Alterações</Button></CardFooter>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Adicione, edite ou desative contas de usuário.</CardDescription>
        </div>
        <Button size="sm" onClick={() => handleOpenUserDialog(null)} disabled={!canManageUsers}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Usuário</Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Login</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.login}</TableCell>
                <TableCell className="text-right space-x-2">
                   <Button variant="outline" size="sm" onClick={() => handleOpenUserDialog(user)}>Editar</Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={!canManageUsers || user.id === currentUser?.id}>Excluir</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário {user.name}.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => {
                            const updatedUsers = users.filter(u => u.id !== user.id);
                            setUsers(updatedUsers);
                            saveUsers(updatedUsers);
                            toast({ title: 'Usuário Excluído!', description: 'O usuário foi removido.' });
                          }}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={3} className="h-24 text-center">Nenhum usuário cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>

    <Card>
        <CardHeader><CardTitle>Ferramentas</CardTitle><CardDescription>Recursos adicionais para gerenciamento de dados.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
             <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-semibold">Importação de Dados</h4>
                    <p className="text-sm text-muted-foreground">Importe clientes, OS e outros dados a partir de um arquivo de backup.</p>
                </div>
                <Button variant="secondary" asChild disabled={!currentUser?.permissions.accessDangerZone}><Link href="/configuracoes/ferramentas"><Wrench className="mr-2 h-4 w-4"/>Abrir Ferramenta</Link></Button>
            </div>
        </CardContent>
    </Card>

    <Card className="border-2 border-destructive bg-destructive/5">
        <CardHeader>
             <div className="flex items-start gap-4">
                <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
                <div>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription className="text-destructive/80">As ações abaixo são irreversíveis e só podem ser executadas por administradores com a permissão adequada.</CardDescription>
                </div>
             </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-destructive/10">
                <div><h4 className="font-semibold text-destructive">Backup do Sistema</h4><p className="text-sm text-destructive/80">Salve uma cópia de segurança completa de todos os dados do sistema.</p></div>
                 <div className="flex-shrink-0 flex items-center gap-2">
                    <Button variant="outline" onClick={handleBackup} disabled={!currentUser?.permissions.accessDangerZone}>
                        <Download className="mr-2 h-4 w-4"/>Fazer Backup Agora
                    </Button>
                </div>
            </div>
             <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div><h4 className="font-semibold text-destructive">Limpar Sistema</h4><p className="text-sm text-muted-foreground">Exclui permanentemente todos os clientes, OS, vendas e finanças.</p></div>
                 <div className="flex-shrink-0">
                    <Button variant="destructive" onClick={() => setIsClearAlertOpen(true)} disabled={!currentUser?.permissions.accessDangerZone}><Trash2 className="mr-2 h-4 w-4" />Limpar Todos os Dados</Button>
                </div>
            </div>
        </CardContent>
    </Card>

    <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível e excluirá permanentemente TODOS os dados do sistema, incluindo clientes, ordens de serviço e registros financeiros. Não há como desfazer.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleClearSystem}>Sim, excluir tudo</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
          <DialogDescription>Preencha os dados e defina as permissões de acesso do usuário.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2 space-y-4">
                 <h3 className="text-lg font-semibold flex items-center"><UserIcon className="mr-2 h-5 w-5" /> Dados Pessoais e de Acesso</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">Nome Completo</Label><Input id="name" placeholder="John Doe" value={newUser.name || ''} onChange={handleUserInputChange} disabled={!canManageUsers && !isEditingSelf}/></div>
                    <div className="space-y-2"><Label htmlFor="login">Login de Acesso</Label><Input id="login" placeholder="joao.silva" value={newUser.login || ''} onChange={handleUserInputChange} disabled={!canManageUsers && !isEditingSelf}/></div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" placeholder={editingUser ? 'Deixe em branco para não alterar' : 'Senha forte'} value={newUser.password || ''} onChange={handleUserInputChange} disabled={!canManageUsers && !isEditingSelf}/></div>
                 </div>
              </div>
              <Separator className="md:col-span-2" />
               <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center"><ShieldCheck className="mr-2 h-5 w-5" /> Permissões do Usuário</h3>
                    <Button variant="outline" size="sm" onClick={handleSelectAllPermissions} disabled={!canManageUsers}>Selecionar Tudo</Button>
                </div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-primary">Acesso a Módulos</h4>
                    {renderPermission('accessDashboard', 'Dashboard')}
                    {renderPermission('accessClients', 'Clientes')}
                    {renderPermission('accessServiceOrders', 'Ordens de Serviço')}
                    {renderPermission('accessSales', 'Vendas')}
                    {renderPermission('accessAgenda', 'Agenda')}
                    {renderPermission('accessQuotes', 'Orçamentos')}
                    {renderPermission('accessLaudos', 'Laudos')}
                  </div>
                   <div className="space-y-3">
                    <h4 className="font-medium text-sm text-primary">Ações Gerais</h4>
                    {renderPermission('canEdit', 'Pode Editar (OS, etc)')}
                    {renderPermission('canDelete', 'Pode Excluir (OS, etc)')}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-primary">Permissões Avançadas</h4>
                    {renderPermission('accessFinancials', 'Acesso ao Financeiro')}
                    {renderPermission('accessSettings', 'Acesso às Configurações')}
                    {renderPermission('canManageUsers', 'Gerenciar Usuários')}
                    {renderPermission('canViewPasswords', 'Visualizar Senhas')}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-destructive">Zona de Perigo</h4>
                    {renderPermission('accessDangerZone', 'Acesso à Zona de Perigo')}
                  </div>
                </div>
              </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 border-t"><Button variant="ghost" onClick={() => setIsUserDialogOpen(false)}>Cancelar</Button><Button onClick={handleSaveUser}>Salvar Usuário</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    </div>
  )
}
