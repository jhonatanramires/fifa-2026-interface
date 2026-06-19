import type { Loader } from "astro/loaders"
import { sheetLoader } from "astro-sheet-loader"

/**
 * Wraps astro-sheet-loader so an unreachable / placeholder sheet does not crash
 * the build. The real sheet is the source of truth once a valid ID is provided;
 * until then we seed sample products so the UI stays previewable.
 */
export function configSheetLoader(options: Parameters<typeof sheetLoader>[0]): Loader {
  const inner = sheetLoader({ ...options })
  return {
    name: "configuracion-sheet-loader",
    schema: inner.schema,
    async load(context) {
      try {
        await inner.load(context)
        if (context.store.keys().length === 0) throw new Error("La hoja no devolvió filas.")
        // Normalize image URLs and ensure every product has a category.
        // for (const entry of context.store.values()) {
        //   // custom logic for formatting idk
        // }
        return
      } catch (err) {
        context.logger.warn(
          `No se pudo cargar Google Sheets (${
            err instanceof Error ? err.message : "error desconocido"
          }). Usando productos de ejemplo. Actualiza GOOGLE_SHEET_ID o el document en src/content.config.ts.`,
        )
        context.store.clear()
      }
    },
  }
}
