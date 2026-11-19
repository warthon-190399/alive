/**
 * En producción Next.js oculta el mensaje de los errores lanzados en server actions.
 * Por eso las acciones que muestran errores al usuario devuelven { ok, error }.
 */
export type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

export function failure(e: unknown): { ok: false; error: string } {
  const m = e instanceof Error ? e.message : String(e);
  return { ok: false, error: m === "fetch failed" ? "No se pudo conectar. ¿Hay conexión a internet?" : m || "Algo salió mal" };
}
