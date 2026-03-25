export function calculateStats(students: any[], penaltyRate: number) {
  const total = students.length;
  if (total === 0) return null;

  let expiredCount = 0;
  let expiringSoonCount = 0;
  let compliantCount = 0;
  let totalPenalties = 0;
  const nationalityMap: Record<string, number> = {};

  students.forEach((s) => {
    const visa = s.visa_records?.[0];
    const nationality = s.nationality || "Unknown";

    // Grouping by Nationality
    nationalityMap[nationality] = (nationalityMap[nationality] || 0) + 1;

    if (visa?.expiry_date) {
      const expiry = new Date(visa.expiry_date);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        expiredCount++;
        totalPenalties += Math.abs(diffDays) * penaltyRate;
      } else if (diffDays <= 90) {
        expiringSoonCount++;
      } else {
        compliantCount++;
      }
    }
  });

  return {
    total,
    expiredCount,
    expiringSoonCount,
    compliantCount,
    totalPenalties,
    complianceRate: total > 0 ? ((compliantCount / total) * 100).toFixed(1) : 0,
    nationalities: Object.entries(nationalityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}
