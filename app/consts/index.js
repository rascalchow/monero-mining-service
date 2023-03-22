module.exports = {
  USER: {
    ROLES: ['publisher', 'admin'],
    ROLE: {
      PUBLISHER: 'publisher',
      ADMIN: 'admin'
    },
    STATUSES: ['active', 'inactive', 'pending'],
    STATUS: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'pending'
    }
  },
  APP_USER: {
    STATUSES: ['installed', 'uninstalled'],
    STATUS: {
      INSTALLED: 'installed',
      UNINSTALLED: 'uninstalled'
    },
    SORT_KEY: [
      'userKey',
      'device',
      'operatingSystem',
      'liveTime',
      'timeRatio',
      'currencyEarned',
      'currencySpent',
      'installedAt',
      'uninstalledAt',
      'status'
    ]
  },
  PUBLISHER: {
    SORT_KEY: [
      'name',
      'email',
      'companyName',
      'status',
      'installs',
      'live',
      'liveTime',
      'earnings',
      'referrals',
      'payments'
    ]
  },
  INVITE: {
    STATUSES: ['invited', 'signup'],
    STATUS: {
      INVITED: 'invited',
      SIGNUP: 'signup'
    },
    SORT_KEY: ['refereeEmail', 'code', 'status', 'acceptedAt', 'createdAt'],
    REFERRALS_SORT_KEY: ['status', 'companyName', 'referrals']
  },
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/,
  DEFAULT_EULA_TEMPLATE: 'This is {{companyName}}. This is {{productName}}.',
  FILE_UPLOAD_DIR: 'uploads',
  STEALTHEX: {
    API_KEY: process.env.STEALTHEX_API_KEY,
    BASE_URL: 'https://api.stealthex.io/api/v2/',
    MONERO_REV_RATE: 1000
  },
  WITHDRAW: {
    STATUSES: [
      'initiated',
      'failed',
      'tranferring',
      'block confirming',
      'converting currency',
      'completed'
    ],
    STATUS: {
      INITIATED: 'initiated',
      COMPLETED: 'completed'
    },
    SORT_KEY: ['refereeEmail', 'code', 'status', 'acceptedAt', 'createdAt'],
    REFERRALS_SORT_KEY: ['status', 'companyName', 'referrals']
  }
}
