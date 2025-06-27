export function formatWeekPeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    timeZone: 'Europe/Bucharest'
  };
  
  const startFormatted = start.toLocaleDateString('en-US', formatOptions);
  const endFormatted = end.toLocaleDateString('en-US', formatOptions);
  const year = end.getFullYear();
  
  return `${startFormatted} - ${endFormatted}, ${year}`;
}

export function formatNextReset(nextResetDate: string): string {
  const resetDate = new Date(nextResetDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest'
  };
  
  return resetDate.toLocaleDateString('en-US', formatOptions);
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} RON`;
}
