import { redirect } from 'next/navigation';

export default function LegacyPainelAdminRedirect() {
  redirect('/admin');
}
