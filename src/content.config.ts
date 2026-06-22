import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"
import { productosSheetLoader } from "./lib/productos-loader"
import { configSheetLoader } from "./lib/config-loader"

const SHEET_DOCUMENT_ID =
  import.meta.env.GOOGLE_SHEET_ID ?? "1zQmEDAnDbzOewik5JbpNp9hyCuNbNUWdUWmKdORR8EI"

const SHEET_DOCUMENT_ID_C =
  import.meta.env.GOOGLE_SHEET_ID_C ?? "1-cLfOK4Imck4yJDVm4TkhDKJOTs7ZT6PKENkOoYupRM"

const productos = defineCollection({
  loader: productosSheetLoader({
    document: SHEET_DOCUMENT_ID,
    allowBlanks: true,
  }),
  schema: z.object({
    nombre: z.string(),
    precio: z.coerce.number().nullable().optional(),
    descripcion: z.string().nullable().optional(),
    imagen: z.string().nullable().optional(),
    categorias: z.array(z.string()).nullable().optional(), // Ajustado a Arreglo de Strings
    despacho: z.string().nullable().optional(),
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