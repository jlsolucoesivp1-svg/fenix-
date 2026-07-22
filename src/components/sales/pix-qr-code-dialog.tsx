'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { CompanyInfo } from '@/types';
import { Check, Copy, Landmark, QrCode, ReceiptText } from 'lucide-react';
import { buildPixTxid, createPixPaymentData, extractCityFromAddress } from '@/lib/pix';

interface PixQrCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  companyInfo: CompanyInfo | null;
  sale: { total: number; id: string };
  onConfirm: (printReceipt: boolean) => void;
}

export function PixQrCodeDialog({
  isOpen,
  onOpenChange,
  companyInfo,
  sale,
  onConfirm,
}: PixQrCodeDialogProps) {
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState('');
  const [pixCopyPaste, setPixCopyPaste] = React.useState('');
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && companyInfo?.pixKey && sale.total > 0 && sale.id) {
      try {
        const pixPaymentData = createPixPaymentData({
          pixKey: companyInfo.pixKey,
          merchantName: companyInfo.name,
          merchantCity: extractCityFromAddress(companyInfo.address),
          amount: sale.total,
          txid: buildPixTxid(`SALE${sale.id.slice(-12)}`),
          description: `VENDA ${sale.id.slice(-6)}`,
          qrCodeWidth: 240,
        });

        setPixCopyPaste(pixPaymentData.payload);

        pixPaymentData.qrCodeDataUrlPromise
          .then((url) => {
            setQrCodeDataUrl(url);
          })
          .catch((err) => {
            console.error(err);
            toast({
              variant: 'destructive',
              title: 'Erro ao gerar QR Code',
              description: 'Nao foi possivel criar a imagem do QR Code.',
            });
          });
      } catch (error) {
        console.error('PIX Payload Error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de dados PIX',
          description: 'Verifique a chave PIX e o cadastro da empresa nas configuracoes.',
        });
      }
    } else if (!isOpen) {
      setQrCodeDataUrl('');
      setPixCopyPaste('');
      setHasCopied(false);
    }
  }, [isOpen, companyInfo, sale.id, sale.total, toast]);

  const handleCopyToClipboard = () => {
    if (!pixCopyPaste) {
      return;
    }

    navigator.clipboard.writeText(pixCopyPaste);
    setHasCopied(true);
    toast({
      title: 'Codigo copiado',
      description: 'O codigo PIX copia e cola foi enviado para a area de transferencia.',
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 px-6 py-6 text-left text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100">
                  <Landmark className="h-3.5 w-3.5" />
                  PIX
                </div>
                <DialogTitle className="text-2xl font-semibold tracking-tight">Pagamento via PIX</DialogTitle>
                <DialogDescription className="max-w-xl text-sm leading-6 text-slate-200">
                  Confira os dados abaixo, escaneie o QR Code ou use o codigo copia e cola para concluir o pagamento.
                </DialogDescription>
              </div>
              <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-3 text-white/80 md:block">
                <QrCode className="h-8 w-8" />
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 bg-slate-50 px-6 py-6 md:grid-cols-[260px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                <QrCode className="h-4 w-4" />
                QR Code de pagamento
              </div>

              {qrCodeDataUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                  <Image src={qrCodeDataUrl} alt="PIX QR Code" width={240} height={240} className="mx-auto h-auto w-full" />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 p-4 text-center">
                  <p className="text-sm text-slate-500">Gerando QR Code...</p>
                </div>
              )}

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Use a camera do celular ou o app do banco para ler o codigo.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <ReceiptText className="h-4 w-4" />
                  Resumo da cobranca
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total a pagar</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
                      {sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Referencia</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Venda #{sale.id.slice(-6)}</p>
                    <p className="mt-1 text-sm text-slate-500">{companyInfo?.name || 'Empresa nao informada'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Landmark className="h-4 w-4" />
                  Dados para pagamento
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Chave PIX</p>
                    <p className="mt-2 break-all text-sm font-medium text-slate-900">
                      {companyInfo?.pixKey || 'Nao configurada'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Codigo copia e cola</p>
                    <p className="mt-2 max-h-24 overflow-auto break-all font-mono text-xs leading-5 text-slate-700">
                      {pixCopyPaste || 'Gerando codigo PIX...'}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    disabled={!pixCopyPaste}
                    className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  >
                    {hasCopied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                    {hasCopied ? 'Codigo copiado' : 'Copiar codigo PIX'}
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
                <p className="font-medium text-slate-900">Como usar</p>
                <p className="mt-2">
                  1. Abra o app do banco. 2. Escolha pagar com PIX. 3. Escaneie o QR Code ou cole o codigo acima.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:justify-between">
            <Button variant="secondary" onClick={() => onConfirm(true)} className="rounded-xl">
              Confirmar e Imprimir Recibo
            </Button>
            <Button onClick={() => onConfirm(false)} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
