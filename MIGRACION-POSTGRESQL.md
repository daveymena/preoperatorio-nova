# 🔄 Migración de SQLite a PostgreSQL en Easypanel

## ⚠️ Problema con SQLite en Docker

Cuando usas SQLite en un contenedor Docker:
- ❌ Cada vez que reconstruyes el contenedor, **se pierde la base de datos**
- ❌ Los usuarios registrados **desaparecen**
- ❌ No hay persistencia de datos

## ✅ Solución: PostgreSQL

PostgreSQL en Easypanel:
- ✅ **Datos persistentes** (no se pierden al reconstruir)
- ✅ **Mejor rendimiento** para múltiples usuarios
- ✅ **Escalable** para producción
- ✅ **Respaldos automáticos** en Easypanel

---

## 📋 Pasos para Migrar

### Paso 1: Exportar Usuarios Actuales (Si los hay)

**Desde la Terminal de Easypanel:**
```bash
cd /app
node export-users.js
```

Esto creará un archivo `users-backup-XXXXX.json` con todos los usuarios.

**Descargar el archivo:**
```bash
cat users-backup-*.json
```
Copia el contenido y guárdalo en tu computadora.

---

### Paso 2: Crear Base de Datos PostgreSQL en Easypanel

1. Ve a tu proyecto en **Easypanel**
2. Haz clic en **"Add Service"**
3. Selecciona **"PostgreSQL"**
4. Configuración:
   - **Name**: `preoperacional-db`
   - **Database**: `preoperacional`
   - **Username**: (lo que prefieras, ej: `admin`)
   - **Password**: (genera una segura)
5. Haz clic en **"Create"**

Easypanel te dará una **DATABASE_URL** como:
```
postgresql://admin:password@preoperacional-db:5432/preoperacional
```

---

### Paso 3: Configurar Variable de Entorno

1. Ve a tu servicio **"preoperacional-saas"**
2. Ve a **"Environment"** o **"Environment Variables"**
3. Agrega:
   ```
   DATABASE_URL=postgresql://admin:password@preoperacional-db:5432/preoperacional
   ```
   (Usa la URL que te dio Easypanel)

---

### Paso 4: Redeploy

1. Haz clic en **"Rebuild"** o **"Redeploy"**
2. Espera a que termine (2-3 minutos)
3. Revisa los logs, deberías ver:
   ```
   🐘 Conectado a PostgreSQL
   ```

---

### Paso 5: Importar Usuarios (Si exportaste en Paso 1)

**Opción A - Desde la Terminal de Easypanel:**
1. Sube el archivo JSON al contenedor
2. Ejecuta:
```bash
node import-users.js users-backup-XXXXX.json
```

**Opción B - Desde el Panel Admin:**
1. Ve a `https://tu-dominio.com/admin`
2. Los usuarios deberían aparecer automáticamente si la migración fue exitosa

**Opción C - Registro Manual:**
Si solo eran pocos usuarios, puedes registrarlos nuevamente desde:
```
https://tu-dominio.com/
```

---

## 🧪 Verificar la Migración

### 1. Ver los Logs
En Easypanel, revisa los logs del servicio. Deberías ver:
```
🐘 Conectado a PostgreSQL
```

### 2. Verificar Usuarios
Ve a: `https://tu-dominio.com/api/list-all-users`

O desde el panel admin: `https://tu-dominio.com/admin`

### 3. Probar Registro
Registra un usuario de prueba desde la página principal.

---

## 📊 Comandos Útiles

### Exportar usuarios (antes de migrar):
```bash
npm run export-users
```

### Importar usuarios (después de migrar):
```bash
npm run import-users users-backup-XXXXX.json
```

### Ver usuarios en PostgreSQL:
```bash
node list-all-users.js
```

---

## 🔒 Ventajas de PostgreSQL

| Característica | SQLite | PostgreSQL |
|----------------|--------|------------|
| Persistencia en Docker | ❌ Se pierde | ✅ Persistente |
| Múltiples conexiones | ⚠️ Limitado | ✅ Ilimitado |
| Respaldos | ❌ Manual | ✅ Automático |
| Escalabilidad | ⚠️ Limitada | ✅ Alta |
| Producción | ❌ No recomendado | ✅ Recomendado |

---

## ❓ Preguntas Frecuentes

### ¿Se perderán mis usuarios al migrar?
No, si sigues el Paso 1 (exportar) y Paso 5 (importar).

### ¿Puedo volver a SQLite?
Sí, solo elimina la variable `DATABASE_URL` y redeploy.

### ¿Cuánto cuesta PostgreSQL en Easypanel?
Depende de tu plan, pero generalmente está incluido.

### ¿Necesito cambiar código?
No, el sistema ya soporta ambos (SQLite y PostgreSQL).

---

## 🆘 Solución de Problemas

### Error: "Connection refused"
- Verifica que el servicio PostgreSQL esté corriendo
- Verifica que la DATABASE_URL sea correcta

### Error: "relation users does not exist"
- La tabla se crea automáticamente al iniciar
- Espera unos segundos y recarga

### No veo mis usuarios
- Verifica que importaste el backup (Paso 5)
- Revisa los logs para ver errores

---

## ✅ Checklist de Migración

- [ ] Exportar usuarios actuales (si los hay)
- [ ] Crear base de datos PostgreSQL en Easypanel
- [ ] Agregar variable DATABASE_URL
- [ ] Redeploy del servicio
- [ ] Verificar logs (debe decir "🐘 Conectado a PostgreSQL")
- [ ] Importar usuarios (si exportaste)
- [ ] Verificar que los usuarios aparecen en /admin
- [ ] Probar registro de nuevo usuario
- [ ] Probar ejecución de preoperacional

---

**🎉 ¡Listo! Ahora tus datos persistirán incluso cuando reconstruyas el contenedor.**
