# 🚀 DEPLOY EN EASYPANEL - GUÍA COMPLETA

## 📋 ESTADO ACTUAL

✅ **Código**: Listo en GitHub (rama main)  
✅ **Compilación**: Exitosa (npm run build)  
✅ **Pruebas**: Completadas (run-davey.js)  
✅ **Base de datos**: PostgreSQL configurada  
✅ **Credenciales**: Actualizadas  

---

## 🔧 CONFIGURACIÓN POSTGRESQL

### Credenciales
```
Usuario: postgres
Contraseña: 6715320Dvd.
Base de datos: exnova
Host: tecnology_exnoba-db
Puerto: 5432
```

### URL de Conexión
```
postgres://postgres:6715320Dvd.@tecnology_exnoba-db:5432/exnova?sslmode=disable
```

---

## 📦 PASOS PARA DEPLOY EN EASYPANEL

### 1. **Conectar Repositorio GitHub**
```
1. Ir a EasyPanel Dashboard
2. Click en "New Service"
3. Seleccionar "Git Repository"
4. Conectar: https://github.com/daveymena/preoperatorio-nova.git
5. Rama: main
6. Ruta: preoperacional-saas
```

### 2. **Configurar Variables de Entorno**
```
NODE_ENV=production
DATABASE_URL=postgres://postgres:6715320Dvd.@tecnology_exnoba-db:5432/exnova?sslmode=disable
NEXT_PUBLIC_API_URL=https://preoperacional.conectartv.com
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 3. **Configurar Build**
```
Build Command: npm run build
Start Command: npm run start
Port: 3000
```

### 4. **Configurar Volúmenes**
```
/app/logs → Logs de la aplicación
/app/.next → Cache de Next.js
```

### 5. **Configurar Health Check**
```
Endpoint: /api/health
Intervalo: 30s
Timeout: 10s
Reintentos: 3
```

### 6. **Conectar Base de Datos PostgreSQL**
```
Usar la BD existente: exnova
Host: tecnology_exnoba-db
Puerto: 5432
Usuario: postgres
Contraseña: 6715320Dvd.
```

---

## 🗄️ MIGRACIÓN DE DATOS

### Opción 1: Migración Automática (Recomendado)

```bash
# En EasyPanel, ejecutar en la terminal del contenedor:
node migrate-to-postgres.js
```

### Opción 2: Migración Manual

```sql
-- Conectarse a PostgreSQL
psql -h tecnology_exnoba-db -U postgres -d exnova

-- Insertar usuario existente
INSERT INTO users (
  cedula, nombre, placa, email, password, supervisor, km_actual,
  telefono, direccion, ciudad, departamento, empresa, cargo,
  vacaciones_inicio, vacaciones_fin, active, subscription_status
) VALUES (
  '1077449318',
  'Duvier Prueba',
  'TEST-99',
  'daveymena16@gmail.com',
  '1077449318',
  'Eduardo Villareal',
  522,
  '3000000000',
  'Calle Principal 123',
  'Bogotá',
  'Cundinamarca',
  'Conectar TV',
  'Conductor',
  NULL,
  NULL,
  1,
  'trial'
);
```

---

## 🔐 CERTIFICADOS SSL/TLS

### Let's Encrypt (Automático en EasyPanel)

```
1. EasyPanel configura automáticamente Let's Encrypt
2. Certificados se renuevan automáticamente
3. HTTPS habilitado por defecto
```

### Dominio
```
preoperacional.conectartv.com
```

---

## 📊 ESTRUCTURA DE ARCHIVOS

```
preoperacional-saas/
├── pages/
│   ├── api/
│   │   ├── health.js (Health check)
│   │   ├── system-status.js
│   │   ├── run-manual.js
│   │   └── ...
│   ├── dashboard.js
│   └── index.js
├── lib/
│   ├── db.js (Soporta SQLite y PostgreSQL)
│   ├── process-user-improved.js
│   ├── form-analyzer.js
│   └── ...
├── scheduler.js (Ejecución diaria)
├── worker.js (Procesamiento de usuarios)
├── startup.js (Inicialización)
├── Dockerfile
├── start.sh
├── package.json
├── .env.production
├── migrate-to-postgres.js
└── easypanel.yml
```

---

## 🚀 PROCESO DE DEPLOY

### Paso 1: Verificar Código
```bash
git status
git log --oneline -5
```

### Paso 2: Compilar Localmente
```bash
npm run build
```

### Paso 3: Push a GitHub
```bash
git push -u origin main
```

### Paso 4: Deploy en EasyPanel
```
1. EasyPanel detecta cambios en GitHub automáticamente
2. Inicia build automático
3. Ejecuta npm run build
4. Inicia npm run start
5. Health check verifica que está activo
```

### Paso 5: Migrar Datos
```bash
# En terminal de EasyPanel
node migrate-to-postgres.js
```

### Paso 6: Verificar
```
1. Acceder a https://preoperacional.conectartv.com
2. Verificar dashboard en /dashboard
3. Revisar logs en /app/logs/
```

---

## 📝 ARCHIVOS IMPORTANTES

### `.env.production`
```
DATABASE_URL=postgres://postgres:6715320Dvd.@tecnology_exnoba-db:5432/exnova?sslmode=disable
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://preoperacional.conectartv.com
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### `Dockerfile`
```dockerfile
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    chromium \
    ca-certificates \
    dumb-init

# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar archivos
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["dumb-init", "npm", "run", "start"]
```

### `start.sh`
```bash
#!/bin/bash
set -e

echo "🚀 Iniciando aplicación..."

# Crear directorio de logs
mkdir -p /app/logs

# Ejecutar migraciones si es necesario
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "📦 Ejecutando migraciones..."
  node migrate-to-postgres.js
fi

# Iniciar scheduler en background
echo "⏰ Iniciando scheduler..."
node scheduler.js &

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
npm run start
```

---

## 🔍 VERIFICACIÓN POST-DEPLOY

### 1. Health Check
```bash
curl https://preoperacional.conectartv.com/api/health
```

### 2. Dashboard
```
https://preoperacional.conectartv.com/dashboard
```

### 3. Logs
```bash
# En EasyPanel terminal
tail -f /app/logs/worker.log
tail -f /app/logs/scheduler.log
tail -f /app/logs/startup.log
```

### 4. Base de Datos
```bash
# Verificar usuarios
psql -h tecnology_exnoba-db -U postgres -d exnova -c "SELECT * FROM users;"
```

---

## 🛠️ TROUBLESHOOTING

### Error: "Cannot connect to database"
```
1. Verificar DATABASE_URL en variables de entorno
2. Verificar que PostgreSQL está activo
3. Verificar credenciales
4. Revisar logs: tail -f /app/logs/startup.log
```

### Error: "Chromium not found"
```
1. Verificar PUPPETEER_EXECUTABLE_PATH
2. Verificar que chromium está instalado en Dockerfile
3. Revisar logs: tail -f /app/logs/worker.log
```

### Error: "Health check failed"
```
1. Verificar que servidor está activo: curl http://localhost:3000
2. Verificar que /api/health existe
3. Revisar logs: tail -f /app/logs/startup.log
```

---

## 📞 INFORMACIÓN DE CONTACTO

**Repositorio**: https://github.com/daveymena/preoperatorio-nova  
**Rama**: main  
**Dominio**: preoperacional.conectartv.com  
**Base de datos**: exnova (PostgreSQL)  
**Usuario de prueba**: daveymena16@gmail.com  

---

## ✅ CHECKLIST PRE-DEPLOY

- [ ] Código compilado exitosamente
- [ ] Pruebas manuales completadas
- [ ] Todos los cambios en GitHub
- [ ] Variables de entorno configuradas
- [ ] Base de datos PostgreSQL lista
- [ ] Certificados SSL/TLS configurados
- [ ] Health check funcionando
- [ ] Logs configurados
- [ ] Volúmenes configurados
- [ ] Scheduler configurado

---

**Estado**: ✅ LISTO PARA DEPLOY  
**Fecha**: 29 de Mayo de 2026  
**Versión**: 2.0.0
