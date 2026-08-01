export default {
  app: {
    title: 'Liz Money Note',
    language: 'Language'
  },
  nav: {
    transactions: 'Transactions',
    stats: 'Stats',
    assets: 'Assets',
    more: 'More',
    newTransaction: 'New Transaction',
    books: 'Books',
    accounts: 'Accounts',
    tags: 'Tags',
    recurring: 'Recurring',
    data: 'Data'
  },
  common: {
    all: 'All',
    allBooks: 'All books',
    allAccounts: 'All accounts',
    allTypes: 'All types',
    allPeriods: 'All periods',
    unlimited: 'Unlimited',
    thisMonth: 'This month',
    thisYear: 'This year',
    custom: 'Custom',
    today: 'Today',
    yesterday: 'Yesterday',
    save: 'Save',
    loading: 'Loading',
    cancel: 'Cancel',
    edit: 'Edit',
    copy: 'Copy',
    delete: 'Delete',
    clear: 'Clear',
    archive: 'Archive',
    restore: 'Restore',
    active: 'Active',
    archived: 'Archived',
    disabled: 'Disabled',
    confirm: 'OK',
    later: 'Later',
    skip: 'Skip',
    approve: 'Approve',
    disable: 'Disable',
    add: 'Add',
    name: 'Name',
    description: 'Description',
    color: 'Color',
    sortOrder: 'Sort',
    status: 'Status',
    actions: 'Actions',
    note: 'Note',
    date: 'Date',
    time: 'Time',
    optional: 'Optional',
    empty: 'No data'
  },
  language: {
    zhCn: '中文',
    en: 'English'
  },
  transaction: {
    monthlyOverview: 'Monthly overview',
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
    balance: 'Balance',
    detail: 'Transaction detail',
    editTitle: 'Edit transaction',
    account: 'Account',
    book: 'Book',
    tags: 'Tags',
    amount: 'Amount',
    category: 'Category',
    noRecords: 'No transactions yet',
    template: 'Template',
    amountPlaceholder: '0.00',
    addTag: 'Add tag',
    fromAccount: 'From account',
    toAccount: 'To account',
    occurredAt: 'Occurred at',
    needBookAccount: 'Please choose a book and account.',
    saveFailed: 'Failed to save transaction.',
    notFound: 'The transaction does not exist or has been deleted.',
    deleteFailed: 'Failed to delete transaction.',
    search: {
      title: 'Search transactions',
      placeholder: 'Tag, amount, title, or description'
    },
    filters: {
      title: 'Filters',
      book: 'Book',
      account: 'Account',
      type: 'Transaction type',
      month: 'Month'
    }
  },
  category: {
    food: 'Food',
    shopping: 'Shopping',
    transport: 'Transport',
    car: 'Car',
    daily: 'Daily',
    entertainment: 'Fun',
    salary: 'Salary',
    family: 'Family',
    coffee: 'Coffee',
    more: 'More'
  },
  account: {
    cash: 'Cash',
    bankCard: 'Bank card',
    creditCard: 'Credit card',
    alipay: 'Alipay',
    wechat: 'WeChat',
    other: 'Other',
    balance: 'Balance',
    initialBalance: 'Initial balance',
    includeInAssets: 'Include in assets',
    saveFailed: 'Failed to save account.',
    archiveFailed: 'Failed to archive account.'
  },
  book: {
    linkedAccounts: 'Linked accounts',
    defaultAccount: 'Default',
    defaultBook: 'Default book',
    setDefault: 'Set default',
    defaultBookFailed: 'Failed to set the default book.',
    accountRequired: 'Please link at least one account.',
    defaultAccountRequired: 'Please choose a linked default account.',
    saveFailed: 'Failed to save book.',
    archiveFailed: 'Failed to archive book.',
    restoreFailed: 'Failed to restore book.',
    deleteFailed: 'Failed to delete book.',
    deleteConfirmTitle: 'Delete book',
    deleteConfirmMessage:
      'Deleted books cannot be recovered. Back up your data first.'
  },
  tag: {
    saveFailed: 'Failed to save tag.',
    deleteFailed: 'Failed to delete tag.'
  },
  recurring: {
    title: 'Recurring events',
    subtitle: 'Configure rules that create transactions after approval',
    nextTrigger: 'Next trigger',
    repeat: 'Repeat',
    interval: 'Interval',
    startDate: 'Start',
    endDate: 'End',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    dueTitle: 'Recurring events due',
    approveFailed: 'Failed to approve recurring event.',
    skipFailed: 'Failed to skip recurring event.',
    disableFailed: 'Failed to disable recurring event.',
    saveFailed: 'Failed to save recurring event.'
  },
  stats: {
    monthlyFlow: 'Monthly flow',
    categoryShare: 'Category share',
    monthTrend: 'Monthly trend',
    spent: 'Spent',
    received: 'Received',
    currency: 'Currency',
    totalSpent: 'Total spent',
    totalIncome: 'Total income',
    untagged: 'Untagged',
    exchangeRateHint:
      'Statistics are automatically converted to the selected currency using exchange rates.',
    missingExchangeRates:
      'Unable to fetch exchange rates from {currencies} to {currency}. Related transactions are not included in statistics.'
  },
  assets: {
    total: 'Total assets',
    included: 'Included',
    excluded: 'Excluded'
  },
  more: {
    features: 'Features',
    data: 'Data',
    settings: 'Settings',
    import: 'Import',
    export: 'Export',
    backup: 'Backup',
    restore: 'Restore',
    theme: 'Appearance',
    defaultCurrency: 'Currency',
    system: 'System',
    about: 'About'
  },
  about: {
    title: 'About',
    currentVersion: 'Current version',
    updateAvailable: 'Version {version} is available.',
    updatePromptTitle: 'Update available',
    updatePromptMessage: 'Version {version} is available. Update now?',
    checkUpdate: 'Check for updates',
    updateVersion: 'Update {version}',
    noUpdate: 'Already up to date.',
    checkFailed: 'Failed to check for updates.',
    installFailed: 'Failed to start update installation.'
  },
  theme: {
    loadFailed: 'Failed to load theme settings.',
    saveFailed: 'Failed to save theme settings.',
    colorScheme: {
      title: 'Theme',
      green: 'Green',
      orange: 'Orange'
    },
    mode: {
      title: 'Appearance',
      light: 'Light',
      dark: 'Dark',
      system: 'System'
    }
  },
  settings: {
    defaultCurrency: {
      loadFailed: 'Failed to load default currency.',
      saveFailed: 'Failed to save default currency.',
      CNY: 'Chinese yuan',
      USD: 'US dollar',
      AED: 'UAE dirham'
    },
    currency: {
      defaultCurrency: 'Default currency',
      addCurrency: 'Add currency',
      currencyCode: 'Currency code',
      currencyCodeHint: 'Use a 3-letter ISO 4217 code, such as EUR or JPY.',
      addFailed: 'Failed to add currency.'
    }
  },
  system: {
    cache: {
      title: 'System',
      clear: 'Clear cache',
      subtitle:
        'Clear browser CacheStorage, Android WebView cache, and temporary runtime config. User data are kept.',
      confirmTitle: 'Clear cache',
      confirmMessage: 'Clear cache now? ',
      clearDoneBrowser: 'Cache cleared. {count} browser cache buckets removed.',
      clearDoneAndroid:
        'Cache cleared. Android WebView cache was also cleaned.',
      clearFailed: 'Failed to clear cache.'
    },
    database: {
      reset: 'Reset database',
      subtitle:
        'Delete the database and initialize a new empty database. Use only when data is corrupted. Back up your data first.',
      confirmTitle: 'Reset database',
      confirmMessage: 'Reset the database?',
      resetDone: 'Database reset.',
      resetFailed: 'Failed to reset database.'
    }
  },
  exchangeRate: {
    title: 'Exchange rates',
    updateNow: 'Update',
    base: 'Base currency: {currency}',
    updatedAt: 'Updated at {time}',
    manual: 'Manual',
    auto: 'Auto',
    empty: 'No exchange rates needed for one currency.',
    updateFailed: 'Failed to update exchange rates.',
    saveFailed: 'Failed to save exchange rate.'
  },
  country: {
    china: { name: 'China', currency: 'Chinese yuan' },
    unitedStates: { name: 'United States', currency: 'US dollar' },
    unitedArabEmirates: {
      name: 'United Arab Emirates',
      currency: 'UAE dirham'
    },
    eurozone: { name: 'Eurozone', currency: 'Euro' },
    unitedKingdom: { name: 'United Kingdom', currency: 'Pound sterling' },
    japan: { name: 'Japan', currency: 'Japanese yen' },
    hongKong: { name: 'Hong Kong', currency: 'Hong Kong dollar' },
    singapore: { name: 'Singapore', currency: 'Singapore dollar' },
    australia: { name: 'Australia', currency: 'Australian dollar' },
    canada: { name: 'Canada', currency: 'Canadian dollar' },
    switzerland: { name: 'Switzerland', currency: 'Swiss franc' },
    newZealand: { name: 'New Zealand', currency: 'New Zealand dollar' },
    southKorea: { name: 'South Korea', currency: 'South Korean won' },
    thailand: { name: 'Thailand', currency: 'Thai baht' },
    malaysia: { name: 'Malaysia', currency: 'Malaysian ringgit' },
    indonesia: { name: 'Indonesia', currency: 'Indonesian rupiah' },
    philippines: { name: 'Philippines', currency: 'Philippine peso' },
    india: { name: 'India', currency: 'Indian rupee' },
    saudiArabia: { name: 'Saudi Arabia', currency: 'Saudi riyal' },
    qatar: { name: 'Qatar', currency: 'Qatari riyal' },
    kuwait: { name: 'Kuwait', currency: 'Kuwaiti dinar' },
    bahrain: { name: 'Bahrain', currency: 'Bahraini dinar' },
    oman: { name: 'Oman', currency: 'Omani rial' },
    turkey: { name: 'Turkey', currency: 'Turkish lira' },
    brazil: { name: 'Brazil', currency: 'Brazilian real' },
    mexico: { name: 'Mexico', currency: 'Mexican peso' },
    southAfrica: { name: 'South Africa', currency: 'South African rand' },
    sweden: { name: 'Sweden', currency: 'Swedish krona' },
    norway: { name: 'Norway', currency: 'Norwegian krone' },
    denmark: { name: 'Denmark', currency: 'Danish krone' }
  },
  data: {
    title: 'Data',
    subtitle: 'Import or export local SQLite data',
    exported: 'Data exported.',
    exportFailed: 'Export failed.',
    restoreTitle: 'Restore data',
    restoreConfirm: 'Restore will replace current data. Continue?',
    restored: 'Data restored. Refresh the current page data.',
    restoreFailed: 'Restore failed.',
    readFileFailed: 'Failed to read file.',
    chooseFile: 'Please choose CSV or TXT files.',
    duplicateImportConfirm:
      'Importing the same file again creates duplicate transactions. Continue?',
    duplicateFoundTitle: 'Duplicate transactions found',
    duplicateFoundMessage:
      '{count} imported rows already exist. Choose how to continue.',
    keepDuplicates: 'Keep',
    ignoreDuplicates: 'Ignore',
    abortImport: 'Abort',
    duplicateRows: '{count} duplicate rows',
    duplicateIgnored: 'Ignored duplicates',
    importDone: 'Import complete: {count} transactions.',
    importFailed: 'Import failed.',
    pasteJson: 'Paste exported JSON',
    importJson: 'Import JSON',
    importText: 'Import CSV / TXT',
    importHint: 'Each file imports as one book. Categories become tags.',
    exportHint: 'Export a JSON backup of the local database.',
    chooseFiles: 'Choose files',
    currency: 'Currency',
    autoCurrency: 'Auto detect',
    file: 'File',
    imported: 'Imported',
    skipped: 'Skipped',
    issues: 'Issues',
    issueWarning:
      '{count} rows were not imported. Check file format, amounts, or dates.'
  }
};
