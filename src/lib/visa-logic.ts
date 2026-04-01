export const calculateVisaStatus = (
  expiryDate: string,
  penaltyRate: number = 500,
  alertThresholdDays: number = 90,
) => {
  // Safety check: if date is empty, return null immediately
  if (!expiryDate) return null;

  const today = new Date();
  const expiry = new Date(expiryDate);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status = "Active";
  let color = "text-green-600";
  let penalty = 0;

  if (diffDays < 0) {
    status = "Expired";
    color = "text-red-600 font-bold";
    penalty = Math.abs(diffDays) * penaltyRate;
  } else if (diffDays <= alertThresholdDays) {
    status = "Expiring Soon";
    color = "text-orange-500 font-medium";
  }

  return { status, color, penalty, diffDays };
};
