# 🚀 Guía de Despliegue en Easypanel

## Características del Sistema Actualizado

### ✅ Reactivación Automática
- Al iniciar el contenedor, **todos los usuarios se reactivan automáticamente por 5 días**
- No necesitas ejecutar comandos manualmente
- Perfecto para cuando subes el proyecto a Easypanel

### ⏰ Ventana de Ejecución Inteligente (6 AM - 12 PM)
El sistema ahora tiene **reintentos automáticos**:
- **Primera ejecución**: 6:00 AM (hora de Colombia)
- **Reintentos**: Cada hora (7 AM, 8 AM, 9 AM, 10 AM, 11 AM, 12 PM)
- **Condición**: Solo se ejecuta **una vez al día** exitosamente
- **Beneficio**: Si falla a las 6 AM (internet caído, servidor reiniciando, etc.), reintentará automáticamente

### 🔄 Ejemplo de Funcionamiento
```
6:00 AM → ❌ Falla (internet caído)
7:00 AM → ❌ Falla (servidor aún reiniciando)
8:00 AM → ✅ Éxito (preoperacional ejecutado)
9:00 AM → ⏭️ Saltado (ya se ejecutó hoy)
10:00 AM → ⏭️ Saltado (ya se ejecutó hoy)
...
```

## Pasos para Desplegar en Easypanel

### 1. Preparar el Repositorio
```bash
# Asegúrate de que todos los cambios estén en Git
git add .
git commit -m "Sistema con reactivación automática y ventana de ejecución"
git push origin main
```

### 2. Configurar en Easypanel

1. **Crear nuevo servicio** desde GitHub
2. **Seleccionar** tu repositorio
3. **Configurar variables de entorno** (opcional):
   ```
   DATABASE_URL=postgresql://... (si usas PostgreSQL)
   MERCADO_PAGO_ACCESS_TOKEN=tu_token
   NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
   ```

4. **Puerto**: 3000
5. **Dockerfile**: El sistema lo detectará automáticamente

### 3. ¿Qué Sucede al Desplegar?

Cuando Easypanel inicie el contenedor:

1. ✅ Se instalan las dependencias
2. ✅ Se construye Next.js
3. ✅ Se inicia el servidor web (puerto 3000)
4. ✅ **Se reactivan TODOS los usuarios por 5 días automáticamente**
5. ✅ Se inicia el scheduler con ventana de ejecución 6 AM - 12 PM

**No necesitas hacer nada más.** El sistema está listo para funcionar.

## Comandos Útiles

### Reactivar Manualmente (si es necesario)
```bash
npm run reactivate
```

### Ver Logs del Scheduler
Los logs mostrarán:
- ⏰ Intentos de ejecución cada hora
- ✅ Ejecuciones exitosas
- 📡 Heartbeat cada hora
- 🌙 Reset a medianoche

### Ejecutar Preoperacional Manualmente
```bash
npm run daily-worker
```

## Verificación Post-Despliegue

1. **Verifica que el servidor web esté activo**:
   - Abre `https://tu-dominio.com`
   - Deberías ver la página de inicio

2. **Verifica los logs**:
   - En Easypanel, ve a la sección de Logs
   - Deberías ver:
     ```
     🔄 Reactivando todos los usuarios por 5 días...
     ✅ [Nombre Usuario] - Reactivado hasta [fecha]
     🎉 X usuarios reactivados exitosamente
     📅 Scheduler de Preoperacionales activo
     ⏰ Ventana de ejecución: 6:00 AM - 12:00 PM (Colombia)
     ```

3. **Espera la primera ejecución**:
   - El sistema ejecutará automáticamente entre 6 AM y 12 PM
   - Revisa los logs para confirmar la ejecución

## Solución de Problemas

### ❌ "No hay usuarios registrados"
- Normal si es la primera vez
- Registra usuarios desde la interfaz web

### ❌ "Error procesando usuario"
- Verifica las credenciales del usuario en la base de datos
- Asegúrate de que ConectarTV esté accesible

### ❌ "Scheduler no ejecuta"
- Verifica la zona horaria (debe ser America/Bogota)
- Revisa los logs para ver si hay errores

## Mantenimiento

### Extender Suscripciones
Cada vez que reinicies el contenedor, los usuarios se reactivan automáticamente por 5 días más.

Si quieres extender manualmente sin reiniciar:
```bash
npm run reactivate
```

### Cambiar Ventana de Ejecución
Edita `scheduler.js` y modifica el array `hoursToTry`:
```javascript
const hoursToTry = [6, 7, 8, 9, 10, 11, 12]; // Horas a intentar
```

## Notas Importantes

- ✅ El sistema es **resiliente**: Si falla una ejecución, reintentará automáticamente
- ✅ **Una ejecución por día**: No se ejecutará múltiples veces el mismo día
- ✅ **Reactivación automática**: Al desplegar, todos los usuarios se activan por 5 días
- ✅ **Sin intervención manual**: Todo funciona automáticamente

## Soporte

Si tienes problemas, revisa:
1. Los logs de Easypanel
2. Las credenciales de los usuarios
3. La conectividad a ConectarTV
4. La zona horaria del servidor
