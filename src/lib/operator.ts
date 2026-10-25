/** Public operator details for the privacy policy. Env values override these. */
export const OPERATOR_NAME = "张子函";
export const SUPPORT_EMAIL = "zhangzihan051208@gmail.com";
export const ADMIN_EMAIL = "zhangzihan051208@gmail.com";

export function operatorName() {
  return process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || OPERATOR_NAME;
}

export function supportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || SUPPORT_EMAIL;
}
