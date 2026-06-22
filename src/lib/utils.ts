export function slugify(text: string): string {
    return text
      .toLowerCase()              // Convierte a minúsculas: "MI PRODUCTO" -> "mi producto"
      .trim()                     // Elimina espacios al inicio y final
      .replace(/[^\w\s-]/g, "")   // Elimina caracteres especiales (como tildes o ñ)
      .replace(/[\s_-]+/g, "-")   // Convierte espacios o guiones bajos en guiones: "mi producto" -> "mi-producto"
      .replace(/^-+|-+$/g, "");   // Elimina guiones al inicio o final
}

export function generarLinkWhatsApp(numero: string, texto: string): string {
  // Limpia el número: deja solo dígitos (quita espacios, +, guiones, paréntesis)
  const numeroLimpio = numero.replace(/[^\d]/g, '');
  
  // Codifica el texto para que sea válido en una URL
  const textoCodificado = encodeURIComponent(texto);
  
  return `https://wa.me/${numeroLimpio}?text=${textoCodificado}`;
}