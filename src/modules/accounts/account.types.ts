import type { CurrencyCode } from '@/modules/shared/money';

export type AccountType =
  | 'cash'
  | 'bank_card'
  | 'credit_card'
  | 'alipay'
  | 'wechat'
  | 'other';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  initialBalance: number;
  currentBalance: number;
  isIncludedInAssets: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  initialBalance: number;
  isIncludedInAssets?: boolean;
  sortOrder?: number;
}

export type AccountDeleteBlockReason =
  | 'transaction_history'
  | 'recurring_event'
  | 'book_replacement_required';

export type AccountDeleteResult =
  | { deleted: true }
  | { deleted: false; reason: AccountDeleteBlockReason };

export const accountTypeOptions: Array<{ title: string; value: AccountType }> = [
  { title: '现金', value: 'cash' },
  { title: '银行卡', value: 'bank_card' },
  { title: '信用卡', value: 'credit_card' },
  { title: '支付宝', value: 'alipay' },
  { title: '微信', value: 'wechat' },
  { title: '其他', value: 'other' }
];
