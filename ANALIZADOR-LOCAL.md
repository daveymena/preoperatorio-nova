# 🔍 Analizador Local - Detección y Corrección Automática de Errores

## 📋 Descripción

El analizador local es un sistema inteligente que detecta cuando el bot falla, identifica qué campos faltan y los rellena automáticamente hasta que el formulario se envíe correctamente.

## 🎯 Características

### 1. **Análisis de Formularios (FormAnalyzer)**
- Detecta campos vacíos requeridos
- Identifica radio buttons sin seleccionar
- Detecta selects sin valor
- Busca mensajes de error en la página
- Verifica campos con clase "error" o "is-invalid"

### 2. **Análisis Visual (VisualAnalyzer)**
- Usa Ollama para análisis visual de capturas
- Detecta campos en rojo
- Identifica campos vacíos visualmente
- Detecta mensajes de error en la página
- Proporciona sugerencias de corrección

### 3. **Procesamiento Mejorado (ProcessUserImproved)**
- Análisis iterativo del formulario
- Relleno automático de campos faltantes
- Reintentos configurables
- Generación de reportes detallados
- Logging completo de cada paso

## 🚀 Cómo Funciona

### Flujo de Ejecución

```
1. Bot accede al formulario
   ↓
2. Rellena campos iniciales
   ↓
3. Captura pantalla
   ↓
4. Análisis Visual (Ollama)
   ├─ ¿Formulario completo?
   │  ├─ Sí → Enviar
   │  └─ No → Continuar
   ↓
5. Análisis de Estructura
   ├─ Detecta campos vacíos
   ├─ Detecta radios sin seleccionar
   ├─ Detecta selects sin valor
   └─ Detecta textareas vacías
   ↓
6. Relleno Automático
   ├─ Rellena campos detectados como vacíos
   ├─ Selecciona opciones positivas
   ├─ Completa campos de texto
   └─ Espera 1 segundo
   ↓
7. ¿Reintentos disponibles?
   ├─ Sí → Volver a paso 3
   └─ No → Enviar de todas formas
   ↓
8. Envío del Formulario
   ├─ Busca botón de envío
   ├─ Clickea botón
   ├─ Espera confirmación
   └─ Captura resultado
   ↓
9. Generación de Reporte
   ├─ Guarda análisis en JSON
   ├─ Registra campos rellenados
   ├─ Documenta errores encontrados
   └─ Envía correo con evidencia
```

## 📊 Componentes

### FormAnalyzer

```javascript
const FormAnalyzer = require('./lib/form-analyzer');

// Crear analizador
const analyzer = new FormAnalyzer(page, user);

// Analizar formulario
const formData = await analyzer.analyzeForm();
// Retorna: { inputs, radios, selects, textareas, buttons, errors, warnings }

// Rellenar campos faltantes
const filled = await analyzer.fillMissingFields(formData);
// Retorna: número de campos rellenados

// Verificar si está completo
const complete = await analyzer.isFormComplete();
// Retorna: true/false

// Enviar con reintentos
const success = await analyzer.submitFormWithRetries();
// Retorna: true/false

// Generar reporte
const report = analyzer.generateReport();
// Retorna: { timestamp, user, errors, warnings, filledFields, success }

// Guardar reporte
analyzer.saveReport('/app/logs/form-analysis.json');
```

### VisualAnalyzer

```javascript
const VisualAnalyzer = require('./lib/visual-analyzer');

// Crear analizador visual
const visualAnalyzer = new VisualAnalyzer();

// Analizar captura de pantalla
const analysis = await visualAnalyzer.analyzeScreenshot('screenshot.png');
// Retorna: { isComplete, emptyFields, errorFields, redFields, suggestions, confidence, summary }

// Detectar campos en rojo
const redFields = await visualAnalyzer.detectRedFields('screenshot.png');
// Retorna: { hasErrors, redFields, errorFields, suggestions }

// Verificar si está completo
const complete = await visualAnalyzer.isFormComplete('screenshot.png');
// Retorna: { complete, emptyFields, errorFields, confidence, summary }

// Comparar dos capturas
const comparison = await visualAnalyzer.compareScreenshots('before.png', 'after.png');
// Retorna: { before, after, improved, fieldsFixed, stillMissing }

// Generar reporte
const report = visualAnalyzer.generateReport();

// Guardar reporte
visualAnalyzer.saveReport('/app/logs/visual-analysis.json');
```

## 📝 Ejemplo de Uso

### Uso Básico

```javascript
const { processUserImproved } = require('./lib/process-user-improved');

const user = {
  id: 1,
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  password: 'password123',
  cedula: '1234567890',
  placa: 'ABC-123',
  supervisor: 'Eduardo Villareal',
  km_actual: 100,
  vacaciones_inicio: '2026-11-27',
  vacaciones_fin: '2026-12-12'
};

// Procesar usuario con análisis automático
await processUserImproved(user);
```

### Uso Avanzado

```javascript
const FormAnalyzer = require('./lib/form-analyzer');
const VisualAnalyzer = require('./lib/visual-analyzer');

// Crear analizadores
const formAnalyzer = new FormAnalyzer(page, user);
const visualAnalyzer = new VisualAnalyzer({
  ollamaUrl: 'http://localhost:11434/api/generate',
  model: 'qwen3.5:cloud',
  timeout: 30000
});

// Análisis iterativo
for (let i = 0; i < 3; i++) {
  // Capturar pantalla
  await page.screenshot({ path: `screenshot-${i}.png`, fullPage: true });

  // Análisis visual
  const visualAnalysis = await visualAnalyzer.analyzeScreenshot(`screenshot-${i}.png`);
  console.log('Análisis visual:', visualAnalysis);

  if (visualAnalysis.isComplete) {
    console.log('Formulario completo');
    break;
  }

  // Análisis de estructura
  const formData = await formAnalyzer.analyzeForm();
  console.log('Errores:', formData.errors);

  // Rellenar campos
  await formAnalyzer.fillMissingFields(formData);

  // Esperar
  await new Promise(r => setTimeout(r, 1000));
}

// Enviar
await formAnalyzer.submitFormWithRetries();

// Guardar reportes
formAnalyzer.saveReport();
visualAnalyzer.saveReport();
```

## 🔧 Configuración

### Variables de Entorno

```bash
# Ollama
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=qwen3.5:cloud

# Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Sistema
NODE_ENV=production
TZ=America/Bogota
```

### Configuración en Código

```javascript
const analyzer = new FormAnalyzer(page, user, {
  maxRetries: 3,
  timeout: 10000
});

const visualAnalyzer = new VisualAnalyzer({
  ollamaUrl: 'http://localhost:11434/api/generate',
  model: 'qwen3.5:cloud',
  timeout: 30000
});
```

## 📊 Reportes Generados

### Reporte de Análisis de Formulario

```json
{
  "timestamp": "2026-05-23T18:32:08.497Z",
  "user": "Juan Pérez",
  "errors": [
    "Campo vacío requerido: supervisor (text)",
    "Radio button sin seleccionar: luces"
  ],
  "warnings": [],
  "filledFields": [
    "supervisor: Eduardo Villareal",
    "luces: bueno",
    "kilometraje: 101"
  ],
  "success": true
}
```

### Reporte de Análisis Visual

```json
{
  "timestamp": "2026-05-23T18:32:08.497Z",
  "analysisCount": 3,
  "history": [
    {
      "timestamp": "2026-05-23T18:32:08.497Z",
      "screenshot": "evidence_1234567890.png",
      "analysis": {
        "isComplete": false,
        "emptyFields": ["supervisor", "observaciones"],
        "errorFields": ["luces"],
        "redFields": ["supervisor"],
        "missingElements": [],
        "suggestions": ["Rellenar campo supervisor", "Seleccionar opción para luces"],
        "confidence": 85,
        "summary": "Formulario incompleto, faltan 2 campos"
      }
    }
  ],
  "summary": {
    "totalAnalyzed": 3,
    "completeCount": 1,
    "averageConfidence": 87
  }
}
```

## 🎯 Casos de Uso

### Caso 1: Campo Vacío No Detectado

```
1. Bot rellena campos iniciales
2. Captura pantalla
3. Análisis visual detecta campo vacío
4. FormAnalyzer lo confirma
5. Se rellena automáticamente
6. Se reintenta envío
```

### Caso 2: Radio Button Sin Seleccionar

```
1. Bot intenta seleccionar radio
2. Selector no coincide
3. Análisis detecta radio sin seleccionar
4. Se selecciona opción positiva
5. Se reintenta envío
```

### Caso 3: Campo en Rojo (Error)

```
1. Análisis visual detecta campo en rojo
2. Se identifica el campo problemático
3. Se rellena con valor correcto
4. Se reintenta envío
```

## 📈 Mejoras de Confiabilidad

| Aspecto | Antes | Después |
|--------|-------|---------|
| Detección de errores | Manual | Automática |
| Corrección de errores | Manual | Automática |
| Reintentos | No | Sí (hasta 3) |
| Análisis visual | No | Sí (Ollama) |
| Reportes | Básicos | Detallados |
| Logging | Console | Archivo + Console |

## 🔍 Debugging

### Ver Logs

```bash
# Logs del worker
tail -f /app/logs/worker.log

# Logs de análisis
tail -f /app/logs/form-analysis-*.json
tail -f /app/logs/visual-analysis-*.json
```

### Verificar Reportes

```bash
# Listar reportes
ls -la /app/logs/form-analysis-*.json
ls -la /app/logs/visual-analysis-*.json

# Ver contenido
cat /app/logs/form-analysis-1234567890-1234567890.json | jq
```

## ⚠️ Limitaciones

1. **Ollama debe estar corriendo** - El análisis visual requiere Ollama
2. **Timeout de Ollama** - Puede tardar hasta 30 segundos
3. **Precisión de IA** - Depende del modelo de Ollama
4. **Selectores CSS** - Algunos formularios pueden tener selectores no estándar

## 🚀 Próximas Mejoras

1. **Machine Learning** - Entrenar modelo específico para formularios preoperacionales
2. **OCR** - Detectar texto en campos usando OCR
3. **Validación de datos** - Verificar que los datos sean válidos
4. **Alertas** - Notificar cuando hay errores recurrentes
5. **Dashboard** - Visualizar análisis en tiempo real

## 📞 Soporte

Si el analizador no funciona:

1. Verifica que Ollama esté corriendo: `curl http://localhost:11434/api/tags`
2. Revisa los logs: `tail -f /app/logs/worker.log`
3. Verifica los reportes: `cat /app/logs/form-analysis-*.json`
4. Aumenta el timeout si es necesario

---

**Versión:** 1.0  
**Fecha:** 23 de mayo de 2026  
**Estado:** ✅ Listo para usar
