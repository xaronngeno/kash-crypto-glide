
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const groupTransactionsByDate = (transactions: any[]) => {
  const grouped = transactions.reduce((acc, transaction) => {
    const date = formatDate(transaction.created_at);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, any[]>);
  
  return grouped;
};
