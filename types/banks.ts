export interface Bank {
  _id: string;
  name: string;
  code: string;
  type: 'bank' | 'wallet';
  isActive: boolean;
}

export interface AccountantAccount {
  _id: string;
  bankId: string | Bank;
  bankName: string;
  bankCode: string;
  accountHolderName: string;
  accountNumber: string;
  isBlocked: boolean;
}

export interface Accountant {
  _id: string;
  ownerId: string;
  agentId: string;
  createdBy: string;
  isBlocked: boolean;
  accounts: AccountantAccount[];
  accountsCount?: number;
  createdAt: string;
  updatedAt: string;
}