import type { Loader } from "astro/loaders"
import { sheetLoader } from "astro-sheet-loader"
import fs from "node:fs"
import path from "node:path"

export interface Producto {
  nombre: string
  precio?: number | null
  descripcion?: string | null
  imagen?: string | null
  categorias?: string[] | null
  despacho?: string | null
}

// Normalize sheet headers (with accents/spaces) into clean schema keys.
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
    return categories.split(',').map(c => c.trim());
}

// Genera el archivo XML para Google Merchant Center
function buildMerchantFeed(products: Producto[]) {
  const siteUrl = import.meta.env.SITE || "https://tusitioweb.com"
  const currency = import.meta.env.MERCHANT_CURRENCY || "COP"

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Catálogo de Productos - Merchant Center</title>
    <link>${siteUrl}</link>
    <description>Feed automático de productos para Google Merchant Center</description>`

  products.forEach((prod) => {
    const slug = prod.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

    const productUrl = `${siteUrl}/productos/${slug}`
    const precioStr = prod.precio ? `${prod.precio} ${currency}` : ""
    const categoriaStr = prod.categorias ? prod.categorias.join(" > ") : "MUNDIAL"

    xml += `
    <item>
      <g:id>${slug}</g:id>
      <g:title><![CDATA[${prod.nombre}]]></g:title>
      <g:description><![CDATA[${prod.descripcion || prod.nombre}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${prod.imagen || ""}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${precioStr}</g:price>
      <g:product_type><![CDATA[${categoriaStr}]]></g:product_type>
    </item>`
  })

  xml += `
  </channel>
</rss>`

  try {
    const publicDir = path.resolve("public")
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
    fs.writeFileSync(path.join(publicDir, "merchant-feed.xml"), xml, "utf-8")
    console.log("✅ Google Merchant Feed generado con éxito en /public/merchant-feed.xml")
  } catch (error) {
    console.error("❌ Error al escribir el archivo de Google Merchant Center:", error)
  }
}

const FALLBACK = [
  {
    nombre: "Display x 104 sobres COPA MUNDIAL DE LA FIFA 2026™",
    precio: 520000,
    imagen: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IwTvQEK4NETyL5Ab34olDGlD78VNQQ.png",
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

export function productosSheetLoader(options: Parameters<typeof sheetLoader>[0]): Loader {
  const inner = sheetLoader({ ...options, transformHeader: normalizeHeader })
  return {
    name: "productos-sheet-loader",
    schema: inner.schema,
    async load(context) {
      try {
        await inner.load(context)
        if (context.store.keys().length === 0) throw new Error("La hoja no devolvió filas.")
        
        for (const entry of context.store.values()) {
          const data = entry.data as Record<string, unknown>
          data.imagen = resolveImageUrl(data.imagen as string | undefined)
          data.categorias = resolveCategories(data.categorias as string | undefined)
          context.store.set({ id: entry.id, data })
        }
      } catch (err) {
        context.logger.warn(
          `No se pudo cargar Google Sheets (${
            err instanceof Error ? err.message : "error desconocido"
          }). Usando productos de ejemplo.`
        )
        context.store.clear()
        FALLBACK.forEach((item, i) => {
          const data = {
            ...item,
            imagen: resolveImageUrl(item.imagen),
            categorias: resolveCategories(item.categorias)
          }
          context.store.set({ id: `fallback-${i}`, data })
        })
      }

      // CORRECCIÓN AQUÍ: Se añade "as unknown as Producto" para evitar el error TS(2352)
      const totalProducts = Array.from(context.store.values()).map(
        (entry) => entry.data as unknown as Producto
      )
      buildMerchantFeed(totalProducts)
    },
  }
}