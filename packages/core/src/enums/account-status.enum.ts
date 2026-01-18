/**
 * Account connection status indicating the current state of a Unipile account.
 */
export enum AccountStatus {
  /** Account is fully connected and operational */
  OK = 'OK',

  /** Account is in the process of connecting */
  CONNECTING = 'CONNECTING',

  /** Account requires credential revalidation */
  CREDENTIALS = 'CREDENTIALS',

  /** Account requires additional permissions */
  PERMISSIONS = 'PERMISSIONS',

  /** Account has encountered an error */
  ERROR = 'ERROR',

  /** Account has been manually stopped */
  STOPPED = 'STOPPED',
}
