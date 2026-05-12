export function buildBookingWhatsAppText(params: {
  customerName: string;
  customerPhone: string;
  serviceNames: string[];
  dateLabel: string;
  timeLabel: string;
}): string {
  const lines = [
    "Novo agendamento — Quadrados",
    "",
    `Nome: ${params.customerName}`,
    `Telefone: ${params.customerPhone}`,
    `Serviço: ${params.serviceNames.join(", ")}`,
    `Dia: ${params.dateLabel}`,
    `Horário: ${params.timeLabel}`,
  ];
  return lines.join("\n");
}

export function waMeUrl(digits: string, text: string): string {
  const d = digits.replace(/\D/g, "");
  if (!d) return "";
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
