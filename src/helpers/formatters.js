export const formatCurrency = (amount) => {
  if (amount == null) return 'Rs. 0.00';
  return `Rs. ${Number(amount).toFixed(2)}`;
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
