import type { Loader } from "astro:loaders" // Asegúrate de importar correctamente según tu versión de Astro
import { sheetLoader } from "astro-sheet-loader"
import fs from "node:fs"
import path from "node:path"

export interface Producto {
  id: number
  title: string
  description: string
  availability: ["in_stock", "out_of_stock"]
  link: string
  image_link: string
  price: number
  identifier_exists: ["yes", "no"]
  brand: string
  categories: string[]
}

// Función auxiliar para escapar caracteres reservados en URLs dentro de XML
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  })
}


function buildMerchantFeed(products: Producto[]) {
  const siteUrl = import.meta.env.SITE || "https://tusitioweb.com"
  const currency = import.meta.env.MERCHANT_CURRENCY || "COP"

  // Estructura oficial RSS 2.0 admitida por Google Merchant Center
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title><![CDATA[Catálogo de Productos - Merchant Center]]></title>
    <link>${escapeXml(siteUrl)}</link>
    <description><![CDATA[Feed automático de productos para Google Merchant Center]]></description>`

  products.forEach((prod) => {
    const slug = prod.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "").substring(0, 50) // Limitar a 50 caracteres para cumplir con las restricciones de Google Merchant

    const productUrl = `${siteUrl}/productos/${slug}`
    const precioStr = prod.price ? `${prod.price} ${currency}` : ""
    const categoriaStr = prod.categories ? prod.categories.join(" > ") : "MUNDIAL"

    // Blindamos las URLs con escapeXml y las cadenas con CDATA
    xml += `
    <item>
      <g:id>${slug}</g:id>
      <g:title><![CDATA[${prod.title}]]></g:title>
      <g:description><![CDATA[${prod.description || prod.title}]]></g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(prod.image_link || "")}</g:image_link>
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
  const inner = sheetLoader({ ...options })
  return {
    name: "productos-sheet-loader",
    schema: inner.schema,
    async load(context) {
      try {
        await inner.load(context)
        if (context.store.keys().length === 0) throw new Error("La hoja no devolvió filas.")
      } catch (err) {
        context.logger.warn(
          `No se pudo cargar Google Sheets (${
            err instanceof Error ? err.message : "error desconocido"
          }). Usando productos de ejemplo.`
        )
        context.store.clear()
        FALLBACK.forEach((data, i) => {
          context.store.set({ id: `fallback-${i}`, data })
        })
      }

      const totalProducts = Array.from(context.store.values()).map(
        (entry) => entry.data as unknown as Producto
      )
      buildMerchantFeed(totalProducts)
    },
  }
}