export function previousCalendarMonth(month: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("INVALID_ACCRUAL_MONTH");
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
}

export function nextCalendarMonth(month: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("INVALID_ACCRUAL_MONTH");
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 7);
}

export function calculateMonthlyAccrual(monthlyAmount: number, joiningDate: string, accrualMonth: string): number {
  if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0 || monthlyAmount > 31 || Math.round(monthlyAmount * 2) !== monthlyAmount * 2) throw new Error("INVALID_MONTHLY_LEAVE_ACCRUAL");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joiningDate) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(accrualMonth)) throw new Error("INVALID_ACCRUAL_DATE");
  const parsed = new Date(`${joiningDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== joiningDate) throw new Error("INVALID_ACCRUAL_DATE");
  if (joiningDate >= `${accrualMonth}-01`) return 0;
  if (joiningDate.slice(0, 7) !== previousCalendarMonth(accrualMonth)) return monthlyAmount;
  return Number(joiningDate.slice(8, 10)) >= 15 ? monthlyAmount / 2 : monthlyAmount;
}
