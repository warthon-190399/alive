# alive

**Live intentionally.** Track your life. Understand your progress. Become who you want to be.

Life OS personal que corre 100 % en tu computadora: Next.js + SQLite. Sin cuentas, sin nube, sin login.

## Arrancar

Necesitas Node.js 20 o superior (`node -v`).

```bash
cd /d/projects/alive
npm install
npm run dev
```

Abre <http://localhost:3000>. La primera vez se crea sola la base de datos en `data/alive.db`.

Para usarlo a diario sin el modo desarrollo (más rápido):

```bash
npm run build
npm start
```

## Dónde viven tus datos

| Qué | Dónde |
| --- | --- |
| Base de datos | `data/alive.db` (SQLite, un solo archivo) |
| Fotos e imágenes | `data/media/AAAA/MM/` |

Las imágenes que traes "desde la web" se descargan y se guardan aquí, así no dependen de que el enlace siga vivo. `data/` está en `.gitignore`: tus datos nunca se suben a git.

## Respaldos

```bash
npm run backup                       # copia data/ a backups/AAAA-MM-DD_HHMM/
npm run backup -- "G:/Mi unidad/alive-backups"   # o a la carpeta que quieras (Drive, OneDrive…)
```

Recomendado: una vez por semana a una carpeta sincronizada en la nube.

## Qué funciona hoy (fase 1)

- **Overview**: saludo, prioridades del día, hábitos de hoy, última entrada, racha, progreso del año.
- **Journal · Hoy**: una entrada por día con bloques (texto, imagen, imagen desde URL, cita), estado de ánimo, lugar y autoguardado. Pega o arrastra imágenes directamente. Fragmentos del día (nota, gratitud, recuerdo, imagen web) desde la barra inferior. "Hace un año, hoy".
- **Journal · Mes**: collage automático con tus imágenes del mes, revisión mensual (4 preguntas, autoguardado), estados del mes y entradas.
- **Journal · Tiempo**: cada mes en tres palabras (sale de tu revisión) y la década en semanas.
- **Habits**: crear y archivar hábitos, check diario, mapa del año, últimos 30 días, rachas y consistencia.

Strategy, Projects, Knowledge y Experiences muestran por ahora lo que traerán en las fases 2 y 3.

## Estructura

```
src/
  app/            páginas (App Router) y la ruta /media que sirve tus imágenes
  actions/        server actions: guardan en la base
  components/     Shell (barra superior + brillos), journal, habits, overview
  db/             esquema Drizzle y conexión SQLite (aplica migraciones al arrancar)
  lib/            fechas, imágenes y consultas
drizzle/          migraciones SQL
scripts/backup.mjs
```

## Cambiar el esquema

1. Edita `src/db/schema.ts`.
2. `npm run db:generate` crea una migración nueva en `drizzle/`.
3. Se aplica sola la próxima vez que arranques la app.

## Ajustes

- Mapa: copia `.env.example` como `.env.local` y pon tu clave gratuita de CARTO en `NEXT_PUBLIC_CARTO_API_KEY` (se pide en https://carto.com/basemaps/apikey). Reinicia `npm run dev` después de cambiarla. Sin clave, el mapa usa OpenStreetMap oscurecido.

- Zona horaria: por defecto `America/Lima`. Para cambiarla, crea `.env.local` con `ALIVE_TZ=Europe/Madrid` (por ejemplo).
- Abrirlo desde el celular en la misma red: `npm run dev -- -H 0.0.0.0` y entra a `http://IP-de-tu-PC:3000`. Fuera de casa, con Tailscale.
