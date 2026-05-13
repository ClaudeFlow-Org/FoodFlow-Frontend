import { z } from 'zod';

const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

const DESCRIPTION_MAX = 500;
const INGREDIENTS_MAX = 500;
const CATEGORY_MAX = 80;
const SUPPLIER_MAX = 200;
const UNIT_MAX = 20;
const TABLE_ID_MAX = 50;

const PRICE_MIN = 0.01;
const PRICE_MAX = 99999999.99;
const STOCK_MAX = 9999999.999;
const QUANTITY_MIN = 1;
const QUANTITY_MAX = 9999;

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

const requiredText = (t: TranslateFn, key: string) =>
  z.string().min(1, t(`${key}.required`));

const optionalText = (t: TranslateFn, key: string, max: number) =>
  z.string().max(max, t(`${key}.max`)).optional().or(z.literal(''));

const requiredNumber = (t: TranslateFn, key: string, min: number, max: number) =>
  z
    .number({ message: t(`${key}.required`) })
    .min(min, t(`${key}.min`, { min }))
    .max(max, t(`${key}.max`, { max }));

const optionalNumber = (t: TranslateFn, key: string, min: number, max: number) =>
  z
    .number({ message: t(`${key}.invalid`) })
    .min(min, t(`${key}.min`, { min }))
    .max(max, t(`${key}.max`, { max }))
    .optional();

const requiredInteger = (t: TranslateFn, key: string, min: number, max: number) =>
  z
    .number({ message: t(`${key}.required`) })
    .int(t(`${key}.integer`))
    .min(min, t(`${key}.min`, { min }))
    .max(max, t(`${key}.max`, { max }));

export const createLoginSchema = (t: TranslateFn) =>
  z.object({
    email: requiredText(t, 'validation.auth.email')
      .max(EMAIL_MAX, t('validation.auth.email.max', { max: EMAIL_MAX }))
      .email(t('validation.auth.email.invalid')),
    password: requiredText(t, 'validation.auth.password')
      .min(PASSWORD_MIN, t('validation.auth.password.min', { min: PASSWORD_MIN }))
      .max(PASSWORD_MAX, t('validation.auth.password.max', { max: PASSWORD_MAX })),
  });

export const createRegisterSchema = (t: TranslateFn) =>
  z
    .object({
      name: requiredText(t, 'validation.auth.name')
        .min(NAME_MIN, t('validation.auth.name.min', { min: NAME_MIN }))
        .max(NAME_MAX, t('validation.auth.name.max', { max: NAME_MAX })),
      email: requiredText(t, 'validation.auth.email')
        .max(EMAIL_MAX, t('validation.auth.email.max', { max: EMAIL_MAX }))
        .email(t('validation.auth.email.invalid')),
      password: requiredText(t, 'validation.auth.password')
        .min(PASSWORD_MIN, t('validation.auth.password.min', { min: PASSWORD_MIN }))
        .max(PASSWORD_MAX, t('validation.auth.password.max', { max: PASSWORD_MAX })),
      confirmPassword: requiredText(t, 'validation.auth.confirmPassword'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.auth.confirmPassword.match'),
      path: ['confirmPassword'],
    });

export const createDishSchema = (t: TranslateFn) =>
  z.object({
    name: requiredText(t, 'validation.dish.name')
      .min(NAME_MIN, t('validation.dish.name.min', { min: NAME_MIN }))
      .max(NAME_MAX, t('validation.dish.name.max', { max: NAME_MAX })),
    description: optionalText(t, 'validation.dish.description', DESCRIPTION_MAX),
    price: requiredNumber(t, 'validation.dish.price', PRICE_MIN, PRICE_MAX),
    ingredients: optionalText(t, 'validation.dish.ingredients', INGREDIENTS_MAX),
  });

export const createProductSchema = (t: TranslateFn) =>
  z.object({
    name: requiredText(t, 'validation.product.name')
      .min(NAME_MIN, t('validation.product.name.min', { min: NAME_MIN }))
      .max(NAME_MAX, t('validation.product.name.max', { max: NAME_MAX })),
    description: optionalText(t, 'validation.product.description', DESCRIPTION_MAX),
    stockLevel: requiredNumber(t, 'validation.product.stockLevel', 0, STOCK_MAX),
    unitOfMeasure: requiredText(t, 'validation.product.unitOfMeasure').max(
      UNIT_MAX,
      t('validation.product.unitOfMeasure.max', { max: UNIT_MAX })
    ),
    unitCost: requiredNumber(t, 'validation.product.unitCost', PRICE_MIN, PRICE_MAX),
    lowStockThreshold: optionalNumber(t, 'validation.product.lowStockThreshold', 0, PRICE_MAX),
    category: optionalText(t, 'validation.product.category', CATEGORY_MAX),
    supplier: optionalText(t, 'validation.product.supplier', SUPPLIER_MAX),
  });

export const createCategorySchema = (t: TranslateFn) =>
  z.object({
    name: requiredText(t, 'validation.category.name').max(
      CATEGORY_MAX,
      t('validation.category.name.max', { max: CATEGORY_MAX })
    ),
  });

export const createOrderSchema = (t: TranslateFn) =>
  z.object({
    tableIdentifier: requiredText(t, 'validation.order.tableIdentifier').max(
      TABLE_ID_MAX,
      t('validation.order.tableIdentifier.max', { max: TABLE_ID_MAX })
    ),
    lineItems: z
      .array(
        z.object({
          dishId: z
            .number({ message: t('validation.order.item.dishId.required') })
            .positive(t('validation.order.item.dishId.required')),
          unitPrice: requiredNumber(t, 'validation.order.item.unitPrice', PRICE_MIN, PRICE_MAX),
          quantity: requiredInteger(t, 'validation.order.item.quantity', QUANTITY_MIN, QUANTITY_MAX),
        })
      )
      .min(1, t('validation.order.lineItems.min')),
  });

export const createProfileSchema = (t: TranslateFn) =>
  z.object({
    name: requiredText(t, 'validation.settings.name')
      .min(NAME_MIN, t('validation.settings.name.min', { min: NAME_MIN }))
      .max(NAME_MAX, t('validation.settings.name.max', { max: NAME_MAX })),
    email: requiredText(t, 'validation.settings.email')
      .max(EMAIL_MAX, t('validation.settings.email.max', { max: EMAIL_MAX }))
      .email(t('validation.settings.email.invalid')),
  });

export const createPasswordSchema = (t: TranslateFn) =>
  z
    .object({
      currentPassword: requiredText(t, 'validation.settings.currentPassword'),
      newPassword: requiredText(t, 'validation.settings.newPassword')
        .min(PASSWORD_MIN, t('validation.settings.newPassword.min', { min: PASSWORD_MIN }))
        .max(PASSWORD_MAX, t('validation.settings.newPassword.max', { max: PASSWORD_MAX })),
      confirmPassword: requiredText(t, 'validation.settings.confirmPassword'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.settings.confirmPassword.match'),
      path: ['confirmPassword'],
    });
