export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toISOString().split('T')[0];
};