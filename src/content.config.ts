import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"
import { productosSheetLoader } from "./lib/productos-loader"
import { configSheetLoader } from "./lib/config-loader"

const SHEET_DOCUMENT_ID =
  import.meta.env.GOOGLE_SHEET_ID ?? "13skjhCKB9Ma_OBj1xUrenWxocOetqLNQ8L4GE0Z0Ij0"

const SHEET_DOCUMENT_ID_C =
  import.meta.env.GOOGLE_SHEET_ID_C ?? "1-cLfOK4Imck4yJDVm4TkhDKJOTs7ZT6PKENkOoYupRM"

// Función auxiliar para resolver URLs de Google Drive en el esquema
function resolveImageUrl(url?: string | null): string {
  if (!url) return ""
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/) ?? url.match(/[?&]id=([^&]+)/)
  if (driveMatch) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`
  return url
}

const productos = defineCollection({
  loader: productosSheetLoader({
    document: SHEET_DOCUMENT_ID,
    allowBlanks: true,
  }),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    availability: z.enum(["in_stock", "out_of_stock"]),
    link: z.string(),
    precio: z.number(),
    identifier_exists: z.enum(["yes", "no"]),
    brand: z.string(),
    // PROCESAMIENTO ÚNICO: Transforma la URL de la imagen al entrar al store
    imageLink: z.preprocess((val) => resolveImageUrl(val as string | null), z.string()),
    // PROCESAMIENTO ÚNICO: Convierte texto separado por comas o maneja arreglos limpios
    categories: z.preprocess((val) => {
      if (!val) return ["MUNDIAL"];
      if (typeof val === "string") {
        return val.split(",").map((c) => c.trim()).filter(Boolean);
      }
      if (Array.isArray(val)) return val;
      return ["MUNDIAL"];
    }, z.array(z.string())),
    pickup_SLA: z.string().optional().nullable(),
    pickup_method: z.string().optional().nullable(),
  }),
})

const configuraciones = defineCollection({
  loader: configSheetLoader({
    document: SHEET_DOCUMENT_ID_C,
    allowBlanks: true
  }),
  schema: z.object({
    WHATSAPP: z.string(),
    MENSAJE: z.string(),
    EMAIL: z.string().nullable().optional(),
    DIR: z.string().nullable().optional(),
    FACEBOOK: z.string().nullable().optional(),
    INSTAGRAM: z.string().nullable().optional(),
    YOUTUBE: z.string().nullable().optional(),
    TWITTER: z.string().nullable().optional(),
    TIKTOK: z.string().nullable().optional(),
  })
})

const blog = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.md', 
    base: './src/content/blog/'
  }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    description: z.string(),
    category: z.enum(['Tutoriales', 'Noticias', 'Análisis', 'Opinión', 'Legal']),
    image: z.string().optional(),
  })
})

export const collections = { productos, configuraciones, blog }