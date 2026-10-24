import { redirect } from 'next/navigation';

export default function CustomerOrdersPageRedirect() {
  redirect('/admin/customer/orders');
}