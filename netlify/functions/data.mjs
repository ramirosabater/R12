// API de datos de Box R12: guarda cada sesión y cada setup como un registro en Netlify Blobs.
//   GET    /api/data?col=sesiones           -> lista de documentos [{id, ...}]
//   PUT    /api/data?col=sesiones&id=xxx    -> guarda (reemplaza) el documento
//   DELETE /api/data?col=sesiones&id=xxx    -> borra el documento
// Si la variable de entorno EQUIPO_PIN está definida, todas las llamadas
// tienen que mandar el header "x-equipo-pin" con ese valor.
import { getStore } from "@netlify/blobs";
import seed from "./seed.mjs";

const COLS = new Set(["sesiones", "setups"]);
const ID_OK = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function seedOnce(store) {
  if (await store.get("_meta/seeded")) return;
  for (const [col, docs] of Object.entries(seed)) {
    for (const [id, doc] of Object.entries(docs)) {
      await store.setJSON(`${col}/${id}`, doc);
    }
  }
  await store.set("_meta/seeded", new Date().toISOString());
}

export default async (req) => {
  const pin = process.env.EQUIPO_PIN || Netlify.env.get("EQUIPO_PIN");
  if (pin && req.headers.get("x-equipo-pin") !== pin) {
    return json({ error: "pin", message: "Clave del equipo incorrecta." }, 401);
  }

  const url = new URL(req.url);
  const col = url.searchParams.get("col");
  const id = url.searchParams.get("id");
  if (!COLS.has(col)) return json({ error: "col", message: "Colección desconocida." }, 400);
  if (req.method !== "GET" && (!id || !ID_OK.test(id))) return json({ error: "id", message: "Falta un id válido." }, 400);

  const store = getStore({ name: "box-r12", consistency: "strong" });
  await seedOnce(store);

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: `${col}/` });
    const docs = await Promise.all(
      blobs.map(async (b) => ({ id: b.key.slice(col.length + 1), ...(await store.get(b.key, { type: "json" })) }))
    );
    return json(docs);
  }

  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "json", message: "El cuerpo no es JSON." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "json", message: "Se esperaba un objeto." }, 400);
    if (JSON.stringify(body).length > 200000) return json({ error: "size", message: "Documento demasiado grande." }, 413);
    await store.setJSON(`${col}/${id}`, body);
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    await store.delete(`${col}/${id}`);
    return json({ ok: true });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/data" };
