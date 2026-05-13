export type TranslationValues = Record<string, string | number>;

export type Translate = (key: string, values?: TranslationValues) => string;

export interface ValidationIssue {
  field?: string;
  message?: string;
  messageKey?: string;
  values?: TranslationValues;
}

interface LocalizedErrorOptions {
  translationKey: string;
  values?: TranslationValues;
  issues?: ValidationIssue[];
  status?: number;
  fallbackMessage?: string;
}

export class LocalizedError extends Error {
  readonly translationKey: string;
  readonly values?: TranslationValues;
  readonly issues?: ValidationIssue[];
  readonly status?: number;

  constructor({
    translationKey,
    values,
    issues,
    status,
    fallbackMessage,
  }: LocalizedErrorOptions) {
    super(fallbackMessage || translationKey);
    this.name = 'LocalizedError';
    this.translationKey = translationKey;
    this.values = values;
    this.issues = issues;
    this.status = status;
  }
}

export interface ErrorMessage {
  error: unknown;
  fallbackKey: string;
}

export const toErrorMessage = (
  error: unknown,
  fallbackKey = 'common.errorOccurred'
): ErrorMessage => ({
  error,
  fallbackKey,
});

export const translatedError = (
  translationKey: string,
  values?: TranslationValues
): ErrorMessage => ({
  error: new LocalizedError({ translationKey, values }),
  fallbackKey: translationKey,
});

export const createLocalizedError = (
  translationKey: string,
  options: Omit<LocalizedErrorOptions, 'translationKey'> = {}
) => new LocalizedError({ translationKey, ...options });

const fieldTranslationKeys: Record<string, string> = {
  name: 'fields.name',
  email: 'fields.email',
  password: 'fields.password',
  currentPassword: 'fields.currentPassword',
  newPassword: 'fields.newPassword',
  confirmPassword: 'fields.confirmPassword',
  confirmNewPassword: 'fields.confirmNewPassword',
  stockLevel: 'fields.stockLevel',
  unitCost: 'fields.unitCost',
  lowStockThreshold: 'fields.lowStockThreshold',
  unitOfMeasure: 'fields.unitOfMeasure',
  category: 'fields.category',
  supplier: 'fields.supplier',
  description: 'fields.description',
  price: 'fields.price',
  ingredients: 'fields.ingredients',
  tableIdentifier: 'fields.tableIdentifier',
  lineItems: 'fields.lineItems',
  quantity: 'fields.quantity',
};

const normalizeFieldName = (field: string) => {
  const lastSegment = field.replace(/\[\d+\]/g, '').split('.').filter(Boolean).pop();
  return lastSegment || field;
};

const humanizeFieldName = (field: string) =>
  normalizeFieldName(field)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

const getFieldLabel = (field: string, t: Translate) => {
  const normalizedField = normalizeFieldName(field);
  const key = fieldTranslationKeys[normalizedField];

  if (!key) {
    return humanizeFieldName(normalizedField);
  }

  const translated = t(key);
  return translated === key ? humanizeFieldName(normalizedField) : translated;
};

const hasField = (field: string | undefined, names: string[]) => {
  if (!field) {
    return false;
  }

  const normalizedField = normalizeFieldName(field).toLowerCase();
  return names.some((name) => normalizedField.includes(name.toLowerCase()));
};

const getKnownMessage = (
  message: string,
  field?: string
): { key: string; values?: TranslationValues } | null => {
  const lowerMessage = message.toLowerCase();

  if (
    hasField(field, ['stockLevel']) &&
    /(out of range|too large|exceed|overflow|fuera de rango|demasiado alto)/i.test(message)
  ) {
    return { key: 'common.errors.stockTooLarge' };
  }

  if (
    hasField(field, ['unitCost']) &&
    /(out of range|too large|exceed|overflow|fuera de rango|demasiado alto)/i.test(message)
  ) {
    return { key: 'common.errors.costTooLarge' };
  }

  if (
    hasField(field, ['lowStockThreshold']) &&
    /(out of range|too large|exceed|overflow|fuera de rango|demasiado alto)/i.test(message)
  ) {
    return { key: 'common.errors.thresholdTooLarge' };
  }

  if (/(numeric value out of range|numeric field overflow|out of range|too large|overflow)/i.test(message)) {
    return { key: 'common.errors.valueTooLarge' };
  }

  if (/(must not be blank|must not be empty|required|is required|no debe estar vac[ií]o|obligatorio)/i.test(message)) {
    return { key: 'common.validation.required' };
  }

  if (/(must be greater than or equal to 0|positive or zero|non-negative|no puede ser negativo)/i.test(message)) {
    return { key: 'common.validation.nonNegative' };
  }

  if (/(must be greater than 0|must be positive|positive value|debe ser mayor que 0)/i.test(message)) {
    return { key: 'common.validation.positive' };
  }

  if (/(valid email|email.*invalid|correo.*v[aá]lido)/i.test(message)) {
    return { key: 'auth.validation.emailInvalid' };
  }

  if (/(invalid credentials|bad credentials|correo o contrase[nñ]a)/i.test(message)) {
    return { key: 'common.errors.invalidCredentials' };
  }

  if (/(not found|no encontrado|no existe|does not exist)/i.test(message)) {
    return { key: 'common.errors.notFound' };
  }

  if (/(email already|correo.*existe|duplicate.*email|already exists.*email)/i.test(message)) {
    return { key: 'common.errors.duplicateEmail' };
  }

  if (/(already exists|duplicate|ya existe)/i.test(message)) {
    return { key: 'common.errors.duplicateRecord' };
  }

  if (/(current password|contrase[nñ]a actual).*(incorrect|invalid|wrong|inv[aá]lida|incorrecta)/i.test(message)) {
    return { key: 'settings.currentPasswordInvalid' };
  }

  if (/(subscription|plan|quota).*(limit|l[ií]mite|exceed|super)|limit.*(subscription|plan|quota)/i.test(message)) {
    return { key: 'common.errors.limitExceeded' };
  }

  if (/(insufficient stock|not enough stock|stock insuficiente|sin stock)/i.test(message)) {
    return { key: 'common.errors.insufficientStock' };
  }

  if (/(cannot delete|could not delete|in use|referenced|foreign key|no se puede eliminar|en uso)/i.test(message)) {
    return { key: 'common.errors.resourceInUse' };
  }

  if (/(json parse|httpmessagenotreadable|numberformatexception|for input string|no enum constant|type mismatch|failed to convert|invalid format)/i.test(message)) {
    return { key: 'common.validation.invalid' };
  }

  if (lowerMessage === 'network error') {
    return { key: 'common.errors.network' };
  }

  return null;
};

const isTechnicalMessage = (message: string) =>
  /(\bSQL\b|jdbc|hibernate|psqlexception|mysql|sqlite|constraintviolation|data integrity|could not execute|stacktrace|java\.|org\.|duplicate key|violates|column .* is of type|relation .* does not exist|numeric field overflow)/i.test(
    message
  );

const formatValidationIssue = (issue: ValidationIssue, t: Translate) => {
  const fieldLabel = issue.field ? getFieldLabel(issue.field, t) : '';
  const knownMessage = issue.message ? getKnownMessage(issue.message, issue.field) : null;
  const message = issue.messageKey
    ? t(issue.messageKey, issue.values)
    : knownMessage
      ? t(knownMessage.key, knownMessage.values)
      : issue.message && !isTechnicalMessage(issue.message)
        ? issue.message
        : t('common.validation.invalid');

  return [fieldLabel, message].filter(Boolean).join(': ');
};

const formatLocalizedError = (
  error: LocalizedError,
  t: Translate,
  fallbackKey: string
) => {
  if (error.issues?.length) {
    const details = error.issues
      .map((issue) => formatValidationIssue(issue, t))
      .filter(Boolean)
      .join(', ');

    if (details) {
      return t(error.translationKey, { ...(error.values || {}), details });
    }
  }

  const translated = t(error.translationKey, error.values);
  return translated === error.translationKey ? t(fallbackKey) : translated;
};

const isErrorMessage = (value: unknown): value is ErrorMessage =>
  typeof value === 'object' &&
  value !== null &&
  'error' in value &&
  'fallbackKey' in value;

const formatPlainMessage = (message: string, t: Translate, fallbackKey: string) => {
  const knownMessage = getKnownMessage(message);

  if (knownMessage) {
    return t(knownMessage.key, knownMessage.values);
  }

  if (isTechnicalMessage(message)) {
    return t(fallbackKey);
  }

  return message || t(fallbackKey);
};

export const getLocalizedErrorMessage = (
  value: unknown,
  t: Translate,
  fallbackKey = 'common.errorOccurred'
) => {
  const message = isErrorMessage(value)
    ? value
    : {
        error: value,
        fallbackKey,
      };

  if (message.error instanceof LocalizedError) {
    return formatLocalizedError(message.error, t, message.fallbackKey);
  }

  if (message.error instanceof Error) {
    return formatPlainMessage(message.error.message, t, message.fallbackKey);
  }

  if (typeof message.error === 'string') {
    return formatPlainMessage(message.error, t, message.fallbackKey);
  }

  return t(message.fallbackKey);
};

const getMessageText = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(getMessageText).filter(Boolean).join(', ') || undefined;
  }

  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
};

const issueFromValue = (value: unknown, field?: string): ValidationIssue[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => issueFromValue(item, field));
  }

  if (typeof value === 'string') {
    return [{ field, message: value }];
  }

  if (typeof value === 'object' && value !== null) {
    const item = value as { field?: unknown; message?: unknown };
    const issueField = typeof item.field === 'string' ? item.field : field;
    const issueMessage = getMessageText(item.message);

    if (issueField || issueMessage) {
      return [{ field: issueField, message: issueMessage }];
    }
  }

  return [];
};

export const parseValidationIssues = (errors: unknown): ValidationIssue[] => {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors.flatMap((item) => issueFromValue(item));
  }

  if (typeof errors === 'string') {
    return [{ message: errors }];
  }

  if (typeof errors === 'object') {
    return Object.entries(errors).flatMap(([field, value]) => issueFromValue(value, field));
  }

  return [];
};
