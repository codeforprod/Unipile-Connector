/**
 * Checkpoint types for two-factor authentication and verification flows.
 */
export enum CheckpointType {
  /** One-time password via SMS or email */
  OTP = 'OTP',

  /** In-app validation required (e.g., LinkedIn mobile app) */
  IN_APP_VALIDATION = 'IN_APP_VALIDATION',

  /** CAPTCHA verification required */
  CAPTCHA = 'CAPTCHA',

  /** Email verification required */
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',

  /** Phone verification required */
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
}
