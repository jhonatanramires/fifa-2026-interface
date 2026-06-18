import { defineCollection, z } from "astro:content"
import { productosSheetLoader } from "./lib/productos-loader"

// Replace this with your own Google Sheet document ID.
// The sheet must be shared as "Anyone on the internet with the link can view".
// You can also set GOOGLE_SHEET_ID in your environment to override it.
const SHEET_DOCUMENT_ID =
  import.meta.env.GOOGLE_SHEET_ID ?? "1zQmEDAnDbzOewik5JbpNp9hyCuNbNUWdUWmKdORR8EI"

// Columns in the connected Google Sheet (header row):
//   Nombre | Precio | Descripción | Link Imagen
//
// The loader normalizes those headers to the clean keys below. Optional columns
// "Categoria" and "Despacho" are also supported if you add them to the sheet.
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
    categorias: z.string().nullable().optional(),
    despacho: z.string().nullable().optional(),
  }),
})

export const collections = { productos }
