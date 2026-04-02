export function required(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required.`;
  }
  return '';
}

export function validateEmail(value) {
  if (!value) return '';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(String(value).trim()) ? '' : 'Please enter a valid email address.';
}

export function validateForm(values, rules) {
  const errors = {};

  Object.entries(rules).forEach(([field, validators]) => {
    for (const validator of validators) {
      const message = validator(values[field], values);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  });

  return errors;
}
