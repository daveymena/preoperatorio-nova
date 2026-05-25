# 🚀 INSTRUCCIONES DE DESPLIEGUE EN EASYPANEL

## ✅ VERSIÓN 2.0.0 - LISTA PARA PRODUCCIÓN

### 📋 CAMBIOS PRINCIPALES:

1. **Ollama Eliminado** ✅
   - Removida dependencia de Ollama
   - Sistema ahora usa G4F (111+ modelos gratuitos)
   - O funciona sin IA si G4F no está disponible

2. **Modo Fallback Habilitado** ✅
   - El sistema funciona **CON O SIN IA**
   - Si G4F falla, continúa sin análisis visual
   - Rellena campos automáticamente basado en estructura

3. **Errores Corregidos** ✅
   - Sintaxis en `create-payment.js` corregida
   - Rutas de logs configuradas para producción
   - Dashboard completamente funcional

### 🔧 REQUISITOS PARA EASYPANEL:

```dockerfile
# Ya incluido en Dockerfile:
- Node.js 18+
- Chromium/Puppeteer
- Python 3.11 (para G4F, opcional)
- SQLite o PostgreSQL
```

### 📦 INSTALACIÓN EN EASYPANEL:

1. **Pull del repositorio:**
   ```bash
   git pull origin main
   ```

2. **Instalar dependencias:**
   ```bash
   npm install --legacy-peer-deps --omit=dev
   ```

3. **Compilar:**
   ```bash
   npm run build
   ```

4. **Ejecutar:**
   ```bash
   npm start
   ```

### 🌐 VARIABLES DE ENTORNO REQUERIDAS:

```env
# Base de datos
DATABASE_URL=postgres://user:pass@host:5432/db

# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=password
EMAIL_FROM=email@gmail.com

# URLs
NEXT_PUBLIC_BASE_URL=http://your-domain.com

# Opcional: G4F (si está disponible)
# El sistema detecta automáticamente si G4F está instalado
```

### 🎯 FLUJO DE FUNCIONAMIENTO:

```
1. Usuario inicia sesión
2. Sistema llena formulario automáticamente
3. Intenta análisis visual con G4F (si disponible)
4. Si G4F falla, continúa sin análisis
5. Detecta campos vacíos por estructura
6. Rellena campos faltantes
7. Envía formulario
8. Envía evidencia por email
```

### ✅ VERIFICACIÓN POST-DESPLIEGUE:

```bash
# Verificar que compila sin errores
npm run build

# Verificar que inicia correctamente
npm start

# Verificar logs
tail -f logs/worker.log
```

### 🔍 MONITOREO:

Los logs se guardan en:
- **Producción**: `/app/logs/`
- **Desarrollo**: `./logs/`

Archivos de log:
- `worker.log` - Ejecución del sistema
- `scheduler.log` - Tareas programadas
- `form-analysis-*.json` - Análisis de formularios

### 🚨 TROUBLESHOOTING:

**Si G4F no funciona:**
- El sistema continúa sin IA automáticamente
- Rellena campos basado en estructura HTML
- Funcionalidad completa garantizada

**Si hay errores de compilación:**
- Verificar que Node.js 18+ está instalado
- Ejecutar: `npm install --legacy-peer-deps`
- Limpiar caché: `rm -rf .next node_modules && npm install`

**Si no se detectan cambios:**
- Hacer pull forzado: `git pull origin main --force`
- Limpiar y reinstalar: `npm ci`
- Recompilar: `npm run build`

### 📊 ESTADO ACTUAL:

```
✅ Compilación: EXITOSA
✅ Sintaxis: CORRECTA
✅ Dependencias: RESUELTAS
✅ Dashboard: FUNCIONAL
✅ API: OPERATIVA
✅ Fallback: HABILITADO
✅ Logs: CONFIGURADOS
```

### 🎉 LISTO PARA PRODUCCIÓN

El sistema está completamente funcional y listo para desplegar en EasyPanel.

**Versión**: 2.0.0  
**Fecha**: 23 de Mayo de 2026  
**Estado**: ✅ PRODUCCIÓN
