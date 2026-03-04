export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
};

export const preventSQLInjection = (input: string): string => {
  return input.replace(/['";\\]/g, '');
};

export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const ext = filename.toLowerCase().split('.').pop();
  return ext ? allowedTypes.includes(`.${ext}`) : false;
};

export const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
export const DANGEROUS_FILE_TYPES = ['.exe', '.sh', '.bat', '.cmd', '.com', '.js'];
