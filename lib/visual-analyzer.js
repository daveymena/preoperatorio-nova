/**
 * Analizador Visual - DEPRECADO
 * Este archivo ha sido reemplazado por visual-analyzer-g4f.js
 * Se mantiene por compatibilidad pero no se usa en producción
 * 
 * Ollama ha sido eliminado del proyecto en favor de G4F (gpt4free)
 * que proporciona 111+ modelos gratuitos sin necesidad de instalación local.
 */

const fs = require('fs');

class VisualAnalyzer {
  constructor(config = {}) {
    console.warn('⚠️ VisualAnalyzer (Ollama) está deprecado. Usar VisualAnalyzerG4F en su lugar.');
    this.config = config;
    this.analysisHistory = [];
  }

  async analyzeScreenshot(screenshotPath) {
    console.warn('⚠️ VisualAnalyzer.analyzeScreenshot() está deprecado. Usar VisualAnalyzerG4F en su lugar.');
    return null;
  }

  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      warning: 'Este analizador está deprecado',
      analysisCount: 0,
      history: []
    };
  }

  saveReport(filename = null) {
    const report = this.generateReport();
    const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
    const reportFile = filename || `${logsDir}/visual-analysis-deprecated-${Date.now()}.json`;
    
    try {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      return reportFile;
    } catch (e) {
      console.error(`❌ Error guardando reporte: ${e.message}`);
      return null;
    }
  }

  clearHistory() {
    this.analysisHistory = [];
  }
}

module.exports = VisualAnalyzer;
