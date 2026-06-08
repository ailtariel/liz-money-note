import { useAccountStore } from '@/modules/accounts/account.store';
import { useCurrencyStore } from '@/modules/currency/currency.store';
import { useExchangeRateStore } from '@/modules/exchange-rate/exchange-rate.store';
import { useRecurringStore } from '@/modules/recurring/recurring.store';

export async function loadSystemDatabaseState() {
  const accountStore = useAccountStore();
  const currencyStore = useCurrencyStore();

  await Promise.all([accountStore.load(), currencyStore.load()]);
}

export async function refreshSystemExchangeRates(force = false) {
  const currencyStore = useCurrencyStore();
  const exchangeRateStore = useExchangeRateStore();

  await currencyStore.load();
  await exchangeRateStore.refreshOnline(
    currencyStore.currencies,
    currencyStore.currency,
    force
  );
}

export async function loadSystemDueRecurringEvents() {
  const recurringStore = useRecurringStore();

  await recurringStore.loadDue();
  return recurringStore.dueEvents.length;
}
