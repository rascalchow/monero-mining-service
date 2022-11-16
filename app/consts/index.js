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
    }
  },
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/,
  DEFAULT_EULA_TEMPLATE: 'This is {{companyName}}. This is {{productName}}.'
}
