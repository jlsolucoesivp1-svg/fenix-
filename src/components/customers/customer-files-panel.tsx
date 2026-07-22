'use client';

import * as React from 'react';
import { FileText, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import type { ServiceOrderFileSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  deleteTenantCustomerFile,
  listTenantCustomerFiles,
  uploadTenantCustomerFile,
} from '@/lib/storage';

type CustomerFilesPanelProps = {
  customerId?: string;
  enabled: boolean;
};

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
};

export function CustomerFilesPanel({ customerId, enabled }: CustomerFilesPanelProps) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<ServiceOrderFileSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [deletingPath, setDeletingPath] = React.useState<string | null>(null);

  const loadFiles = React.useCallback(async () => {
    if (!enabled || !customerId) {
      setFiles([]);
      return;
    }

    try {
      setIsLoading(true);
      const nextFiles = await listTenantCustomerFiles(customerId);
      setFiles(nextFiles);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar documentos',
        description: error instanceof Error ? error.message : 'Nao foi possivel carregar os arquivos.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [customerId, enabled, toast]);

  React.useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !customerId) {
      return;
    }

    try {
      setIsUploading(true);
      const nextFiles = await uploadTenantCustomerFile(customerId, file);
      setFiles(nextFiles);
      toast({
        title: 'Arquivo enviado!',
        description: `${file.name} foi anexado ao cliente.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar arquivo',
        description: error instanceof Error ? error.message : 'Nao foi possivel enviar o arquivo.',
      });
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (path: string) => {
    if (!customerId) {
      return;
    }

    try {
      setDeletingPath(path);
      const nextFiles = await deleteTenantCustomerFile(customerId, path);
      setFiles(nextFiles);
      toast({
        title: 'Arquivo removido!',
        description: 'O documento foi excluido do cliente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover arquivo',
        description: error instanceof Error ? error.message : 'Nao foi possivel excluir o arquivo.',
      });
    } finally {
      setDeletingPath(null);
    }
  };

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Documentos de clientes disponiveis apenas no runtime SaaS.
      </div>
    );
  }

  if (!customerId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div>
          <p className="font-medium">Documentos do Cliente</p>
          <p className="text-sm text-muted-foreground">
            Envie PDFs ou imagens para este cadastro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,application/pdf"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? 'Enviando...' : 'Anexar Documento'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-lg border p-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando documentos...
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum documento anexado a este cliente.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.path}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                    {file.updatedAt
                      ? ` • ${new Date(file.updatedAt).toLocaleString('pt-BR')}`
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Abrir
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete(file.path)}
                  disabled={deletingPath === file.path}
                >
                  {deletingPath === file.path ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
