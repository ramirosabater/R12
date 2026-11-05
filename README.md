# Box R12

Tiempos, presiones, setups y recomendaciones de Sebastián Lorenzo Acosta (#12) y Sebastián Sandoval (#17).

- `index.html`: la app.
- `netlify/functions/data.mjs`: API que guarda los datos en Netlify Blobs (`/api/data`).
- `netlify/functions/seed.mjs`: datos iniciales; se cargan solos la primera vez que se abre el sitio.

## Clave del equipo
En Netlify: Site configuration → Environment variables → agregar `EQUIPO_PIN` con la clave que quieran.
Después hacer un nuevo deploy (Deploys → Trigger deploy). Sin esa variable, cualquiera con el link puede ver y modificar los datos.
