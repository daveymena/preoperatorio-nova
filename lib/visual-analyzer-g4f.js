/**
 * Analizador Visual Mejorado - Usa G4F en lugar de Ollama
 * Completamente gratuito con 111+ modelos disponibles
 */

const fs = require('fs');
const G4FAnalyzer = require('./g4f-analyzer');

class VisualAnalyzerG4F {
  constructor(config = {}) {
    this.g4f = new G4FAnalyzer(config);
    this.analysisHistory = [];
  }

  /**
   * Analiza una captura de pantalla con G4F
   */
  async analyzeScreenshot(screenshotPath) {
    console.log(`🔍 Analizando captura de pantalla con G4F...`);

    if (!fs.existsSync(screenshotPath)) {
      console.error(`❌ Archivo no encontrado: ${screenshotPath}`);
      return null;
    }

    try {
      const analysis = await this.g4f.analyzeScreenshot(screenshotPath);

      if (!analysis) {
        return null;
      }

      this.analysisHistory.push({
        timestamp: new Date().toISOString(),
        screenshot: screenshotPath,
        analysis: analysis
      });

      return analysis;
    } catch (error) {
      console.error(`❌ Error analizando con G4F: ${error.message}`);
      return null;
    }
  }

  /**
   * Detecta campos en rojo
   */
  async detectRedFields(screenshotPath) {
    console.log(`🔴 Detectando campos en rojo...`);

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
    console.log(`📊 Comparando capturas de pantalla...`);

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
   * Genera un reporte visual
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
      },
      provider: 'G4F (gpt4free)',
      cost: 'GRATUITO'
    };
  }

  /**
   * Guarda el reporte
   */
  saveReport(filename = null) {
    const report = this.generateReport();
    const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
    const reportFile = filename || `${logsDir}/visual-analysis-g4f-${Date.now()}.json`;

    try {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`📄 Reporte visual G4F guardado: ${reportFile}`);
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
  static async getInfo() {
    return await G4FAnalyzer.getG4FInfo();
  }
}

module.exports = VisualAnalyzerG4F;
