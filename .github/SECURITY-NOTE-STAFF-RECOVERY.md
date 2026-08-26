# Staff account recovery launch hold

Self-service staff password recovery must not be exposed until recovery uses a one-time, expiring verification mechanism (for example, an emailed reset token) rather than static profile information such as phone number.

Until the backend recovery endpoint is replaced, the production staff login UI should direct locked-out staff to an administrator.
