/**
 * Calculate the subtotal of line items
 * @param items - Array of items with quantity and unitPrice
 * @returns The subtotal
 */
export interface LineItem {
  quantity: number;
  unitPrice: number;
}

export function calculateSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

/**
 * Calculate the total value of inventory
 * @param stockLevel - Current stock level
 * @param unitCost - Cost per unit
 * @returns Total inventory value
 */
export function calculateInventoryValue(stockLevel: number, unitCost: number): number {
  return stockLevel * unitCost;
}

/**
 * Calculate profit margin
 * @param revenue - Total revenue
 * @param cost - Total cost
 * @returns Profit margin as a decimal (0 to 1)
 */
export function calculateProfitMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return (revenue - cost) / revenue;
}

/**
 * Calculate percentage change between two values
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change as a decimal
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 1 : 0;
  return (newValue - oldValue) / oldValue;
}

/**
 * Calculate average order value
 * @param totalRevenue - Total revenue
 * @param orderCount - Number of orders
 * @returns Average order value
 */
export function calculateAverageOrderValue(totalRevenue: number, orderCount: number): number {
  if (orderCount === 0) return 0;
  return totalRevenue / orderCount;
}

/**
 * Check if stock is low
 * @param stockLevel - Current stock level
 * @param threshold - Low stock threshold
 * @returns True if stock is low
 */
export function isLowStock(stockLevel: number, threshold: number): boolean {
  return stockLevel <= threshold;
}

/**
 * Calculate days until a date
 * @param date - Target date
 * @returns Number of days (positive for future, negative for past)
 */
export function daysUntil(date: string | Date): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
