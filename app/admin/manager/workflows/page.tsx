import { redirect } from 'next/navigation';

export default function ManagerWorkflowsRedirect() {
  redirect('/admin/workflows');
}
