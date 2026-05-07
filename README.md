# Preoperacional Nova SaaS - Guía de Inicio

Este sistema permite automatizar el preoperacional de hasta 500+ personas usando una arquitectura profesional y escalable.

## Estructura del Proyecto
- `pages/`: Interfaz web (Registro y Administración).
- `worker.js`: El motor que procesa a todos los usuarios en paralelo (3 a la vez).
- `scheduler.js`: Programador que activa el worker cada mañana a las 6:00 AM.
- `database.sqlite`: Base de datos donde se guardan los usuarios registrados.

## Cómo ejecutar localmente
1. Entra a la carpeta: `cd preoperacional-saas`
2. Inicia la web: `npm run dev`
3. Abre tu navegador en: `http://localhost:3000`
4. Inicia el programador (en otra terminal): `npm run worker`

## Reactivar usuarios por 5 días
Para extender la suscripción de todos los usuarios por 5 días más:
```bash
node reactivate-all.js
```

## Sistema de Ejecución Automática
El scheduler ahora funciona con **ventana de ejecución inteligente**:
- ⏰ **Ventana de ejecución**: 6:00 AM - 12:00 PM (hora de Colombia)
- 🔄 **Reintentos automáticos**: Cada hora dentro de la ventana si no se ha ejecutado
- ✅ **Una vez al día**: Solo se ejecuta una vez exitosamente por día
- 🌙 **Reset automático**: A medianoche se resetea para el día siguiente

**Ejemplo**: Si a las 6 AM falla por algún motivo (internet, servidor caído, etc.), el sistema reintentará a las 7 AM, 8 AM, y así sucesivamente hasta las 12 PM. Una vez que se ejecute exitosamente, no volverá a intentar ese día.

## Cómo desplegar en Easypanel / Docker
1. Sube este proyecto a un repositorio de GitHub.
2. En Easypanel, crea un nuevo "Service" desde GitHub.
3. El `Dockerfile` incluido se encargará de configurar todo (incluyendo Google Chrome para el bot).
4. **Importante**: Asegúrate de que el servidor tenga acceso a internet para navegar a ConectarTV y enviar correos.

## Configuración de Correo
Edita el archivo `worker.js` y cambia las credenciales en `CONFIG.smtp` por las tuyas para que los empleados reciban sus evidencias.
