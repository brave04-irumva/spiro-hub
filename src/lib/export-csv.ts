export function downloadCSV(
  data: any[],
  filename = "spiro-compliance-report.csv",
) {
  if (data.length === 0) return;

  // Define headers based on student and visa data
  const headers = [
    "Full Name",
    "Admission No",
    "Email",
    "Nationality",
    "Visa Expiry",
    "Current Stage",
    "Missing Documents",
  ];

  // Map data to rows
  const rows = data.map((s) => {
    const visa = s.visa_records?.[0] || {};
    return [
      `"${s.full_name}"`,
      `"${s.student_id_number}"`,
      `"${s.email}"`,
      `"${s.nationality}"`,
      `"${visa.expiry_date || "N/A"}"`,
      `"${visa.current_stage || "N/A"}"`,
      `"${(visa.missing_documents || []).join(", ")}"`,
    ].join(",");
  });

  // Create the CSV content
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Trigger download
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
