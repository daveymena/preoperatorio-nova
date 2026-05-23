/**
 * Analizador con G4F (gpt4free) - Análisis visual gratuito
 * Usa 111 modelos gratuitos disponibles en G4F
 * Reemplaza Ollama con una solución completamente gratuita
 */

const fs = require('fs');
const { spawn } = require('child_process');

class G4FAnalyzer {
  constructor(config = {}) {
    this.config = {
      pythonPath: process.env.PYTHON_PATH || 'python',
      timeout: 30000,
      model: process.env.G4F_MODEL || 'gpt-4-turbo',
      provider: process.env.G4F_PROVIDER || 'auto',
      retries: 3,
      ...config
    };
    this.analysisHistory = [];
    this.pythonScript = this.createPythonScript();
  }

  /**
   * Crea el script Python para usar G4F
   */
  createPythonScript() {
    return `
import sys
import json
import base64
from pathlib import Path

try:
    from g4f.client import Client
except ImportError:
    print(json.dumps({"error": "G4F no está instalado. Instala con: pip install g4f"}))
    sys.exit(1)

def analyze_screenshot(image_path, prompt):
    """Analiza una captura de pantalla usando G4F"""
    try:
        # Leer imagen
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Crear cliente G4F
        client = Client()
        
        # Enviar solicitud con imagen
        response = client.chat.completions.create(
            model="${this.config.model}",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            timeout=${this.config.timeout / 1000}
        )
        
        # Extraer respuesta
        result = response.choices[0].message.content
        
        # Intentar parsear como JSON
        try:
            analysis = json.loads(result)
        except:
            # Si no es JSON, crear análisis de texto
            analysis = {
                "isComplete": "completo" in result.lower() or "ok" in result.lower(),
                "emptyFields": [],
                "errorFields": [],
                "redFields": [],
                "suggestions": [result[:200]],
                "confidence": 70,
                "summary": result[:300]
            }
        
        print(json.dumps(analysis))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Uso: python script.py <image_path> <prompt>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    prompt = sys.argv[2]
    
    analyze_screenshot(image_path, prompt)
`;
  }

  /**
   * Ejecuta análisis usando G4F
   */
  async analyzeScreenshot(screenshotPath) {
    console.log(`🔍 Analizando captura con G4F (gratuito)...`);

    if (!fs.existsSync(screenshotPath)) {
      console.error(`❌ Archivo no encontrado: ${screenshotPath}`);
      return null;
    }

    const prompt = `Analiza esta captura de pantalla de un formulario preoperacional de motos.

Por favor responde en formato JSON con la siguiente estructura:
{
  "isComplete": true/false,
  "emptyFields": ["campo1", "campo2"],
  "errorFields": ["campo1", "campo2"],
  "redFields": ["campo1", "campo2"],
  "missingElements": ["elemento1", "elemento2"],
  "suggestions": ["sugerencia1", "sugerencia2"],
  "confidence": 0-100,
  "summary": "resumen breve"
}

Busca especialmente:
- Campos en rojo o con borde rojo (errores)
- Campos vacíos o sin llenar
- Campos con asterisco (*) que no estén llenos
- Mensajes de error en la página
- Botones deshabilitados
- Elementos faltantes

Sé específico con los nombres de los campos.`;

    return new Promise((resolve) => {
      const python = spawn(this.config.pythonPath, ['-c', this.createPythonScript()], {
        timeout: this.config.timeout
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        try {
          if (code !== 0) {
            console.error(`❌ Error en G4F: ${errorOutput}`);
            resolve(null);
            return;
          }

          const analysis = JSON.parse(output);

          if (analysis.error) {
            console.error(`❌ Error de G4F: ${analysis.error}`);
            resolve(null);
            return;
          }

          this.analysisHistory.push({
            timestamp: new Date().toISOString(),
            screenshot: screenshotPath,
            analysis: analysis
          });

          console.log(`✅ Análisis completado (Confianza: ${analysis.confidence}%)`);
          resolve(analysis);
        } catch (e) {
          console.error(`❌ Error parseando respuesta: ${e.message}`);
          resolve(null);
        }
      });

      python.on('error', (error) => {
        console.error(`❌ Error ejecutando G4F: ${error.message}`);
        resolve(null);
      });

      // Enviar datos al proceso
      python.stdin.write(`${screenshotPath}\n${prompt}\n`);
      python.stdin.end();
    });
  }

  /**
   * Detecta si hay campos en rojo
   */
  async detectRedFields(screenshotPath) {
    console.log(`🔴 Detectando campos en rojo con G4F...`);

    const analysis = await this.analyzeScreenshot(screenshotPath);

    if (!analysis) {
      return null;
    }

    return {
      hasErrors: analysis.redFields.length > 0 || analysis.errorFields.length > 0,
      redFields: analysis.redFields,
      errorFields: analysis.errorFields,
      suggestions: analysis.suggestions
    };
  }

  /**
   * Verifica si el formulario está completo
   */
  async isFormComplete(screenshotPath) {
    const analysis = await this.analyzeScreenshot(screenshotPath);

    if (!analysis) {
      return null;
    }

    return {
      complete: analysis.isComplete,
      emptyFields: analysis.emptyFields,
      errorFields: analysis.errorFields,
      confidence: analysis.confidence,
      summary: analysis.summary
    };
  }

  /**
   * Compara dos capturas de pantalla
   */
  async compareScreenshots(before, after) {
    console.log(`📊 Comparando capturas con G4F...`);

    const beforeAnalysis = await this.analyzeScreenshot(before);
    const afterAnalysis = await this.analyzeScreenshot(after);

    if (!beforeAnalysis || !afterAnalysis) {
      return null;
    }

    return {
      before: beforeAnalysis,
      after: afterAnalysis,
      improved: !afterAnalysis.isComplete && beforeAnalysis.emptyFields.length > afterAnalysis.emptyFields.length,
      fieldsFixed: beforeAnalysis.emptyFields.filter(f => !afterAnalysis.emptyFields.includes(f)),
      stillMissing: afterAnalysis.emptyFields
    };
  }

  /**
   * Genera un reporte
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      analysisCount: this.analysisHistory.length,
      history: this.analysisHistory,
      summary: {
        totalAnalyzed: this.analysisHistory.length,
        completeCount: this.analysisHistory.filter(a => a.analysis?.isComplete).length,
        averageConfidence: this.analysisHistory.length > 0
          ? Math.round(this.analysisHistory.reduce((sum, a) => sum + (a.analysis?.confidence || 0), 0) / this.analysisHistory.length)
          : 0
      }
    };
  }

  /**
   * Guarda el reporte
   */
  saveReport(filename = null) {
    const report = this.generateReport();
    const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
    const reportFile = filename || `${logsDir}/g4f-analysis-${Date.now()}.json`;

    try {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`📄 Reporte G4F guardado: ${reportFile}`);
      return reportFile;
    } catch (e) {
      console.error(`❌ Error guardando reporte: ${e.message}`);
      return null;
    }
  }

  /**
   * Limpia el historial
   */
  clearHistory() {
    this.analysisHistory = [];
    console.log(`🗑️ Historial de análisis limpiado`);
  }

  /**
   * Obtiene información de G4F
   */
  static async getG4FInfo() {
    return {
      name: 'G4F (gpt4free)',
      description: 'Análisis visual gratuito con 111+ modelos disponibles',
      models: [
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
        'gemini-pro',
        'llama-2',
        'mistral',
        'deepseek',
        'y más...'
      ],
      providers: [
        'OpenAI',
        'Anthropic',
        'Google',
        'Meta',
        'Mistral',
        'DeepSeek',
        'y más...'
      ],
      cost: 'GRATUITO',
      advantages: [
        '✅ Completamente gratuito',
        '✅ 111+ modelos disponibles',
        '✅ Sin API key requerida',
        '✅ Sin límites de uso',
        '✅ Múltiples proveedores',
        '✅ Análisis visual incluido'
      ]
    };
  }
}

module.exports = G4FAnalyzer;
