import type { Loader } from "astro/loaders"
import { sheetLoader } from "astro-sheet-loader"

export interface Producto {
  nombre: string
  precio?: number | null
  descripcion?: string | null
  imagen?: string | null
  categorias?: string[] | null
  despacho?: string | null
}

// Normalize sheet headers (with accents/spaces) into clean schema keys.
// e.g. "Nombre" -> "nombre", "Descripción" -> "descripcion", "Link Imagen" -> "imagen"
function normalizeHeader(label: string): string {
  const key = `${label}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
  if (key.includes("imagen") || key.includes("foto") || key.includes("img")) return "imagen"
  if (key.includes("descrip")) return "descripcion"
  if (key.includes("precio")) return "precio"
  if (key.includes("nombre") || key.includes("producto") || key.includes("titulo")) return "nombre"
  if (key.includes("categor")) return "categorias"
  if (key.includes("despacho") || key.includes("envio")) return "despacho"
  return key.replace(/\s+/g, "_")
}

// Convert a Google Drive share link into a directly embeddable image URL.
function resolveImageUrl(url?: string | null): string {
  if (!url) return ""
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/) ?? url.match(/[?&]id=([^&]+)/)
  if (driveMatch) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`
  return url
}

// Convert the category into categories
function resolveCategories(categories?: string | null): string[] {
    if (!categories) {
        return ["MUNDIAL"];
    }
    // Tu lógica aquí
    return categories.split(',');
}


// Sample data shown only when the Google Sheet can't be loaded yet
// (e.g. while the placeholder document ID is still in place).
const FALLBACK = [
  {
    nombre: "Display x 104 sobres COPA MUNDIAL DE LA FIFA 2026™",
    precio: 520000,
    imagen:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IwTvQEK4NETyL5Ab34olDGlD78VNQQ.png",
    categorias: "MUNDIAL",
    despacho: "Despacho a partir del 30 de junio",
  },
  {
    nombre: "Kit de Actualización del Álbum de la Copa Mundial FIFA 2026™",
    precio: 99900,
    imagen: "",
    categorias: "MUNDIAL",
    despacho: "",
  },
  {
    nombre: "Álbum Tapa Dura COPA MUNDIAL DE LA FIFA 2026™",
    precio: 49900,
    imagen: "",
    categorias: "MUNDIAL",
    despacho: "",
  },
  {
    nombre: "Sobre individual Adrenalyn XL™ Mundial 2026",
    precio: 8900,
    imagen: "",
    categorias: "ADRENALYN MUNDIAL",
    despacho: "",
  },
  {
    nombre: "Starter Pack Adrenalyn XL™ Mundial 2026",
    precio: 39900,
    imagen: "",
    categorias: "ADRENALYN MUNDIAL",
    despacho: "",
  },
  {
    nombre: "Box Adrenalyn XL™ Mundial 2026 (24 sobres)",
    precio: 219000,
    imagen: "",
    categorias: "ADRENALYN MUNDIAL",
    despacho: "",
  },
  {
    nombre: "Colección Premier League 2025/26",
    precio: 45000,
    imagen: "",
    categorias: "ÚLTIMOS LANZAMIENTOS",
    despacho: "",
  },
  {
    nombre: "Sticker Pack LaLiga Este 2025/26",
    precio: 6500,
    imagen: "",
    categorias: "ÚLTIMOS LANZAMIENTOS",
    despacho: "",
  },
]

/**
 * Wraps astro-sheet-loader so an unreachable / placeholder sheet does not crash
 * the build. The real sheet is the source of truth once a valid ID is provided;
 * until then we seed sample products so the UI stays previewable.
 */
export function productosSheetLoader(options: Parameters<typeof sheetLoader>[0]): Loader {
  const inner = sheetLoader({ ...options, transformHeader: normalizeHeader })
  return {
    name: "productos-sheet-loader",
    schema: inner.schema,
    async load(context) {
      try {
        await inner.load(context)
        if (context.store.keys().length === 0) throw new Error("La hoja no devolvió filas.")
        // Normalize image URLs and ensure every product has a category.
        for (const entry of context.store.values()) {
          const data = entry.data as Record<string, unknown>
          data.imagen = resolveImageUrl(data.imagen as string | undefined)
          data.categorias = resolveCategories(data.categorias as string | undefined)
          context.store.set({ id: entry.id, data })
        }
        return
      } catch (err) {
        context.logger.warn(
          `No se pudo cargar Google Sheets (${
            err instanceof Error ? err.message : "error desconocido"
          }). Usando productos de ejemplo. Actualiza GOOGLE_SHEET_ID o el document en src/content.config.ts.`,
        )
        context.store.clear()
        FALLBACK.forEach((data, i) => {
          context.store.set({ id: `fallback-${i}`, data })
        })
      }
    },
  }
}
