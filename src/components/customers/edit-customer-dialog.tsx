'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Customer } from '@/types';
import { CustomerFormFields } from '@/components/customers/customer-form-fields';

interface EditCustomerDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (customer: Customer) => void;
}

export function EditCustomerDialog({ customer, isOpen, onOpenChange, onSave }: EditCustomerDialogProps) {
  const [formData, setFormData] = React.useState<Omit<Customer, 'id'> | null>(null);

  React.useEffect(() => {
    if (customer) {
      const { id: _id, ...rest } = customer;
      setFormData({
        ...rest,
        cep: rest.cep || '',
      });
    }
  }, [customer]);

  const handleSave = () => {
    if (customer && formData) {
      onSave({ ...customer, ...formData });
    }
  };

  if (!customer || !formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Altere os dados de {customer.name}.
          </DialogDescription>
        </DialogHeader>
        <CustomerFormFields value={formData} onChange={setFormData} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alteracoes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
