export type Role =
  | 'user' | 'accountant' | 'admin' | 'customer'
  | 'manager' | 'owner' | 'agent';

export const ALL_ROLES: Role[] = [
  'admin', 'owner', 'manager', 'accountant', 'agent', 'customer', 'user',
];

export type MenuType = 'web' | 'mobile';

export interface MenuDoc {
  _id: string;
  name: string;
  href: string;
  icon: string;
  type?: MenuType;
  allowedRoles: Role[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}