'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Customer } from '@/types';

type CustomerFormData = Omit<Customer, 'id'>;

interface CustomerFormFieldsProps {
  value: CustomerFormData;
  onChange: (nextValue: CustomerFormData) => void;
}

type LookupState = {
  loading: boolean;
  message: string | null;
  error: boolean;
};

const initialLookupState: LookupState = {
  loading: false,
  message: null,
  error: false,
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatDocument = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length <= 11) return digits;
  return formatCnpj(digits);
};

const mergeAddress = (currentValue: CustomerFormData, payload: Partial<CustomerFormData>): CustomerFormData => ({
  ...currentValue,
  ...payload,
  phone: payload.phone || currentValue.phone,
  email: payload.email || currentValue.email,
  name: payload.name || currentValue.name,
});

export function CustomerFormFields({ value, onChange }: CustomerFormFieldsProps) {
  const [cepLookup, setCepLookup] = React.useState<LookupState>(initialLookupState);
  const [cnpjLookup, setCnpjLookup] = React.useState<LookupState>(initialLookupState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value: nextValue } = e.target;

    if (id === 'cep') {
      onChange({ ...value, cep: formatCep(nextValue) });
      return;
    }

    if (id === 'document') {
      onChange({ ...value, document: formatDocument(nextValue) });
      return;
    }

    onChange({ ...value, [id]: nextValue });
  };

  const handleCepBlur = async () => {
    const cepDigits = onlyDigits(value.cep || '');
    if (!cepDigits) {
      setCepLookup(initialLookupState);
      return;
    }

    if (cepDigits.length !== 8) {
      setCepLookup({ loading: false, message: 'Informe um CEP com 8 digitos.', error: true });
      return;
    }

    setCepLookup({ loading: true, message: null, error: false });

    try {
      const response = await fetch(`/api/lookups/cep/${cepDigits}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao consultar CEP.');
      }

      onChange({
        ...value,
        cep: payload.cep,
        address: payload.address || value.address,
      });

      setCepLookup({ loading: false, message: 'Endereco preenchido a partir do CEP.', error: false });
    } catch (error: any) {
      setCepLookup({ loading: false, message: error?.message || 'Falha ao consultar CEP.', error: true });
    }
  };

  const handleDocumentBlur = async () => {
    const documentDigits = onlyDigits(value.document || '');
    if (!documentDigits) {
      setCnpjLookup(initialLookupState);
      return;
    }

    if (documentDigits.length !== 14) {
      setCnpjLookup(initialLookupState);
      return;
    }

    setCnpjLookup({ loading: true, message: null, error: false });

    try {
      const response = await fetch(`/api/lookups/cnpj/${documentDigits}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao consultar CNPJ.');
      }

      onChange(
        mergeAddress(value, {
          document: payload.document || value.document,
          name: payload.name || value.name,
          phone: payload.phone || value.phone,
          email: payload.email || value.email,
          cep: payload.cep || value.cep || '',
          address: payload.address || value.address,
        })
      );

      setCnpjLookup({ loading: false, message: 'Dados da empresa preenchidos a partir do CNPJ.', error: false });
    } catch (error: any) {
      setCnpjLookup({ loading: false, message: error?.message || 'Falha ao consultar CNPJ.', error: true });
    }
  };

  return (
    <div className="grid gap-6 py-4">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" placeholder="John Doe" value={value.name} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(99) 99999-9999" value={value.phone} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="email">E-mail (Opcional)</Label>
          <Input id="email" type="email" placeholder="email@exemplo.com" value={value.email} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="document">CPF / CNPJ</Label>
          <Input id="document" placeholder="CPF ou CNPJ" value={value.document} onChange={handleChange} onBlur={handleDocumentBlur} />
          <p className={`mt-2 text-xs ${cnpjLookup.error ? 'text-destructive' : 'text-muted-foreground'}`}>
            {cnpjLookup.loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Consultando CNPJ...
              </span>
            ) : (
              cnpjLookup.message || 'Ao informar um CNPJ valido, os dados da empresa sao preenchidos automaticamente.'
            )}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" placeholder="00000-000" value={value.cep || ''} onChange={handleChange} onBlur={handleCepBlur} />
          <p className={`mt-2 text-xs ${cepLookup.error ? 'text-destructive' : 'text-muted-foreground'}`}>
            {cepLookup.loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Consultando CEP...
              </span>
            ) : (
              cepLookup.message || 'Ao informar um CEP valido, o endereco e sugerido automaticamente.'
            )}
          </p>
        </div>
        <div>
          <Label htmlFor="address">Endereco</Label>
          <Input id="address" placeholder="Rua Exemplo, 123" value={value.address} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}
