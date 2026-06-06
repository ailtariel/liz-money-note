import type { ComposerTranslation } from 'vue-i18n';
import type { AccountType } from '@/modules/accounts/account.types';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import type { RepeatType } from '@/modules/recurring/recurring.types';

export function transactionTypeOptions(t: ComposerTranslation) {
  return [
    { title: t('transaction.expense'), value: 'expense' as TransactionType, icon: '$expense' },
    { title: t('transaction.income'), value: 'income' as TransactionType, icon: '$income' },
    { title: t('transaction.transfer'), value: 'transfer' as TransactionType, icon: '$transfer' }
  ];
}

export function accountTypeLabel(type: AccountType, t: ComposerTranslation) {
  const labels: Record<AccountType, string> = {
    cash: t('account.cash'),
    bank_card: t('account.bankCard'),
    credit_card: t('account.creditCard'),
    alipay: t('account.alipay'),
    wechat: t('account.wechat'),
    other: t('account.other')
  };

  return labels[type];
}

export function accountTypeIcon(type: AccountType) {
  const icons: Record<AccountType, string> = {
    cash: '$cash',
    bank_card: '$bank',
    credit_card: '$account',
    alipay: '$wallet',
    wechat: '$wechat',
    other: '$assets'
  };

  return icons[type];
}

export function repeatTypeOptions(t: ComposerTranslation) {
  return [
    { title: t('recurring.daily'), value: 'daily' as RepeatType },
    { title: t('recurring.weekly'), value: 'weekly' as RepeatType },
    { title: t('recurring.monthly'), value: 'monthly' as RepeatType },
    { title: t('recurring.yearly'), value: 'yearly' as RepeatType }
  ];
}

export function formatShortDate(value: string, t: ComposerTranslation) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dateKey = date.toISOString().slice(0, 10);
  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dateKey === todayKey) {
    return t('common.today');
  }

  if (dateKey === yesterdayKey) {
    return t('common.yesterday');
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

export function formatTime(value: string) {
  const time = value.includes('T') ? value.split('T')[1] : value.split(' ')[1];
  return time?.slice(0, 5) || '00:00';
}
