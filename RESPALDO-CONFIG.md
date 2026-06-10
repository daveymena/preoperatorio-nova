# RESPALDO - Configuración Davey Daily

## Archivos creados/modificados

- `davey-daily.js` — Script scheduler para Davey, ventana 5 AM - 12 PM Colombia
- `startup.js` — Modificado para ejecutar `davey-daily.js` en vez de `scheduler.js`
- `package.json` — Agregado script `"davey": "node davey-daily.js"`

## Base de datos

- URL: `postgres://postgres:6715320Dvd.@tecnology_exnoba-db:5432/exnova?sslmode=disable`
- Driver: PostgreSQL (via DATABASE_URL)
- Usuario Davey: `daveymena16@gmail.com` / placa `TEST-99` / KM actual `534`

## Funcionamiento

1. `davey-daily.js` se ejecuta con PM2 o via `startup.js`
2. Usa `node-cron` con horarios: 5, 6, 7, 8, 9, 10, 11, 12 (hora Colombia)
3. Verifica si ya se ejecutó hoy (revisa `last_run` del usuario en BD)
4. Si no se ha ejecutado, procesa el preoperatorio con Puppeteer
5. Si el usuario está inactivo, lo reactiva por 5 días
6. Guarda evidencia, envía correo, actualiza BD

## Cómo ejecutar

```bash
# Directo
node davey-daily.js

# Con PM2 (recomendado en producción)
pm2 start davey-daily.js --name davey-daily
pm2 save
pm2 startup
```

## Easypanel

En `easypanel.yml` las variables importantes:
- `DATABASE_URL` — conexión PostgreSQL
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`

El `Dockerfile` ejecuta `start.sh` que corre Next.js + `startup.js` (que spawn `davey-daily.js`).

## Verificación

Para probar ejecución manual:
```bash
node run-test-davey.js
```

Para ver logs:
```bash
tail -f logs/davey-daily.log
```

Para ver usuarios en BD:
```bash
node -e "require('./lib/db').all('SELECT * FROM users').then(r => console.table(r))"
```

## Comandos útiles

```bash
npm run davey     # Inicia el scheduler Davey Daily
npm run worker    # Scheduler original (6 AM)
npm run dev       # Next.js dev server
```
