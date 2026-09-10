/**
 * Utility functions for AR Constructions app
 * All India-specific formatting and helpers
 */

/** Format amount in paise to Indian currency string (₹ with lakhs/crores) */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return '₹' + formatIndianNumber(rupees);
}

/** Format number in Indian numbering system (12,45,000 not 1,245,000) */
export function formatIndianNumber(num: number): string {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // Remove trailing .00
  const hasDecimals = decPart !== '00';

  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = formatted + ',' + last3;
  }

  const result = hasDecimals ? `${intPart}.${decPart}` : intPart;
  return isNegative ? `-${result}` : result;
}

/** Format date string to Indian format DD/MM/YYYY */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Get today's date in YYYY-MM-DD format for input fields */
export function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/** Convert rupees to paise */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paise to rupees */
export function toRupees(paise: number): number {
  return paise / 100;
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format enum-like strings: "in_progress" -> "In Progress" */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Status color mapping */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project statuses
    planning: 'info',
    in_progress: 'warning',
    on_hold: 'neutral',
    completed: 'success',
    cancelled: 'danger',
    // Change order statuses
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    // General
    active: 'success',
    inactive: 'neutral',
    // Payment
    paid: 'success',
    overdue: 'danger',
    draft: 'neutral',
    sent: 'info',
    // Attendance
    present: 'success',
    half_day: 'warning',
    absent: 'danger',
    overtime: 'info',
    // PO
    partial: 'warning',
    delivered: 'success',
    // Equipment
    available: 'success',
    in_use: 'warning',
    maintenance: 'danger',
    retired: 'neutral',
  };
  return colors[status] || 'neutral';
}

/** Delay reason labels */
export function getDelayReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    weather: '🌧️ Weather / Rain',
    material_shortage: '📦 Material Shortage',
    labour_shortage: '👷 Labour Shortage',
    payment_pending: '💰 Payment Pending',
    permit_pending: '📄 Permit Pending',
    design_change: '🔧 Design Change',
    other: '❗ Other',
  };
  return labels[reason] || reason;
}

/** Skill type labels */
export function getSkillLabel(skill: string): string {
  const labels: Record<string, string> = {
    mason: 'Mason (Mistri)',
    carpenter: 'Carpenter',
    plumber: 'Plumber',
    electrician: 'Electrician',
    painter: 'Painter',
    helper: 'Helper',
    supervisor: 'Supervisor',
    other: 'Other',
  };
  return labels[skill] || capitalize(skill);
}

/** Material category labels */
export function getMaterialCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    cement: 'Cement',
    sand: 'Sand',
    aggregate: 'Aggregate/Gitti',
    steel: 'Steel/TMT',
    bricks: 'Bricks',
    tiles: 'Tiles',
    paint: 'Paint',
    pipes: 'Pipes',
    electrical: 'Electrical',
    wood: 'Wood',
    other: 'Other',
  };
  return labels[category] || capitalize(category);
}

/** Equipment category labels */
export function getEquipmentCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    excavator: 'Excavator (JCB)',
    crane: 'Crane',
    mixer: 'Concrete Mixer',
    compactor: 'Compactor',
    scaffolding: 'Scaffolding',
    pump: 'Water/Concrete Pump',
    generator: 'Generator',
    truck: 'Truck/Tipper',
    other: 'Other',
  };
  return labels[category] || capitalize(category);
}

/** Generate a sequential number like INV-0001, PO-0001 */
export function generateNumber(prefix: string, count: number): string {
  return `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
}

/** Truncate text with ellipsis */
export function truncate(str: string, length: number = 50): string {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/** Calculate days between two dates */
export function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/** Check if a date is overdue (past today) */
export function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(getTodayISO());
}
