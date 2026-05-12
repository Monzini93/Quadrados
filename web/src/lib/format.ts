export function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function onlyDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
