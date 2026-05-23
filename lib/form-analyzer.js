/**
 * Analizador de Formularios - Detecta y corrige errores
 * Verifica qué campos faltan y los rellena automáticamente
 */

const fs = require('fs');

class FormAnalyzer {
  constructor(page, user, config = {}) {
    this.page = page;
    this.user = user;
    this.config = {
      maxRetries: 3,
      timeout: 10000,
      ...config
    };
    this.errors = [];
    this.warnings = [];
    this.filledFields = [];
  }

  /**
   * Analiza el formulario y detecta campos vacíos
   */
  async analyzeForm() {
    console.log(`🔍 Analizando formulario para ${this.user.nombre}...`);
    
    const formData = await this.page.evaluate(() => {
      const analysis = {
        inputs: [],
        radios: {},
        selects: [],
        textareas: [],
        buttons: [],
        errors: [],
        warnings: []
      };

      // Analizar inputs
      document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').forEach(input => {
        const field = {
          name: input.name || input.id,
          type: input.type,
          value: input.value,
          placeholder: input.placeholder,
          required: input.hasAttribute('required') || input.classList.contains('required'),
          readonly: input.readOnly,
          disabled: input.disabled,
          visible: input.offsetParent !== null,
          hasError: input.classList.contains('error') || input.classList.contains('is-invalid'),
          errorMessage: input.getAttribute('data-error') || input.getAttribute('aria-invalid')
        };

        // Detectar si está vacío y es requerido
        if (field.required && !field.value && !field.readonly && !field.disabled && field.visible) {
          analysis.errors.push(`Campo vacío requerido: ${field.name} (${field.type})`);
        }

        analysis.inputs.push(field);
      });

      // Analizar radio buttons
      document.querySelectorAll('input[type="radio"]').forEach(radio => {
        const name = radio.name;
        if (!analysis.radios[name]) {
          analysis.radios[name] = {
            name: name,
            options: [],
            checked: false,
            required: radio.hasAttribute('required') || radio.closest('fieldset')?.classList.contains('required')
          };
        }
        
        analysis.radios[name].options.push({
          value: radio.value,
          checked: radio.checked,
          label: document.querySelector(`label[for="${radio.id}"]`)?.textContent || radio.value
        });

        if (radio.checked) {
          analysis.radios[name].checked = true;
        }
      });

      // Detectar radios sin seleccionar
      Object.values(analysis.radios).forEach(group => {
        if (group.required && !group.checked) {
          analysis.errors.push(`Radio button sin seleccionar: ${group.name}`);
        }
      });

      // Analizar selects
      document.querySelectorAll('select').forEach(select => {
        const field = {
          name: select.name || select.id,
          value: select.value,
          options: Array.from(select.options).map(o => ({ value: o.value, text: o.text })),
          required: select.hasAttribute('required') || select.classList.contains('required'),
          disabled: select.disabled,
          visible: select.offsetParent !== null,
          hasError: select.classList.contains('error') || select.classList.contains('is-invalid')
        };

        if (field.required && !field.value && !field.disabled && field.visible) {
          analysis.errors.push(`Select vacío requerido: ${field.name}`);
        }

        analysis.selects.push(field);
      });

      // Analizar textareas
      document.querySelectorAll('textarea').forEach(textarea => {
        const field = {
          name: textarea.name || textarea.id,
          value: textarea.value,
          required: textarea.hasAttribute('required') || textarea.classList.contains('required'),
          readonly: textarea.readOnly,
          disabled: textarea.disabled,
          visible: textarea.offsetParent !== null,
          hasError: textarea.classList.contains('error') || textarea.classList.contains('is-invalid')
        };

        if (field.required && !field.value && !field.readonly && !field.disabled && field.visible) {
          analysis.errors.push(`Textarea vacío requerido: ${field.name}`);
        }

        analysis.textareas.push(field);
      });

      // Buscar botones de envío
      document.querySelectorAll('button, input[type="submit"]').forEach(btn => {
        const text = btn.innerText || btn.value || '';
        if (text.toLowerCase().includes('guardar') || text.toLowerCase().includes('enviar')) {
          analysis.buttons.push({
            text: text,
            type: btn.type,
            disabled: btn.disabled,
            visible: btn.offsetParent !== null
          });
        }
      });

      // Detectar mensajes de error en la página
      document.querySelectorAll('.error, .alert-danger, .alert-error, [role="alert"]').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          analysis.errors.push(`Error en página: ${text}`);
        }
      });

      return analysis;
    });

    this.errors = formData.errors;
    this.warnings = formData.warnings;

    return formData;
  }

  /**
   * Rellena campos vacíos automáticamente
   */
  async fillMissingFields(formData) {
    console.log(`📝 Rellenando campos faltantes...`);
    
    let filled = 0;

    // Rellenar inputs
    for (const input of formData.inputs) {
      if (!input.value && input.required && !input.readonly && !input.disabled && input.visible) {
        const value = this.getValueForField(input.name, input.type);
        if (value) {
          try {
            await this.page.type(`input[name="${input.name}"], input#${input.id}`, value, { delay: 30 });
            this.filledFields.push(`${input.name}: ${value}`);
            filled++;
            console.log(`  ✅ Rellenado: ${input.name} = ${value}`);
          } catch (e) {
            console.log(`  ⚠️ Error rellenando ${input.name}: ${e.message}`);
          }
        }
      }
    }

    // Rellenar radio buttons
    for (const [name, group] of Object.entries(formData.radios)) {
      if (group.required && !group.checked) {
        const option = this.getPositiveOption(group.options);
        if (option) {
          try {
            await this.page.click(`input[name="${name}"][value="${option.value}"]`);
            this.filledFields.push(`${name}: ${option.value}`);
            filled++;
            console.log(`  ✅ Rellenado: ${name} = ${option.value}`);
          } catch (e) {
            console.log(`  ⚠️ Error rellenando ${name}: ${e.message}`);
          }
        }
      }
    }

    // Rellenar selects
    for (const select of formData.selects) {
      if (!select.value && select.required && !select.disabled && select.visible) {
        const option = this.getPositiveSelectOption(select.options);
        if (option) {
          try {
            await this.page.select(`select[name="${select.name}"], select#${select.id}`, option.value);
            this.filledFields.push(`${select.name}: ${option.value}`);
            filled++;
            console.log(`  ✅ Rellenado: ${select.name} = ${option.value}`);
          } catch (e) {
            console.log(`  ⚠️ Error rellenando ${select.name}: ${e.message}`);
          }
        }
      }
    }

    // Rellenar textareas
    for (const textarea of formData.textareas) {
      if (!textarea.value && textarea.required && !textarea.readonly && !textarea.disabled && textarea.visible) {
        const value = 'Nada';
        try {
          await this.page.type(`textarea[name="${textarea.name}"], textarea#${textarea.id}`, value, { delay: 30 });
          this.filledFields.push(`${textarea.name}: ${value}`);
          filled++;
          console.log(`  ✅ Rellenado: ${textarea.name} = ${value}`);
        } catch (e) {
          console.log(`  ⚠️ Error rellenando ${textarea.name}: ${e.message}`);
        }
      }
    }

    console.log(`\n📊 Campos rellenados: ${filled}`);
    return filled;
  }

  /**
   * Obtiene el valor apropiado para un campo
   */
  getValueForField(fieldName, fieldType) {
    const name = (fieldName || '').toLowerCase();

    // Campos de kilometraje
    if (name.includes('km') || name.includes('kilometraje')) {
      return ((this.user.km_actual || 0) + 1).toString();
    }

    // Campos de supervisor
    if (name.includes('supervisor')) {
      return this.user.supervisor || 'eduardo Villareal';
    }

    // Campos de observaciones
    if (name.includes('observ')) {
      return 'Nada';
    }

    // Campos de nombre
    if (name.includes('nombre')) {
      return this.user.nombre || 'N/A';
    }

    // Campos de placa
    if (name.includes('placa')) {
      return this.user.placa || 'N/A';
    }

    // Campos de cédula
    if (name.includes('cedula') || name.includes('cédula')) {
      return this.user.cedula || 'N/A';
    }

    // Campos de email
    if (name.includes('email')) {
      return this.user.email || 'N/A';
    }

    // Campos de teléfono
    if (name.includes('telefono') || name.includes('teléfono')) {
      return this.user.telefono || '0000000000';
    }

    // Campos numéricos
    if (fieldType === 'number') {
      return '0';
    }

    // Campos de texto genéricos
    if (fieldType === 'text') {
      return 'N/A';
    }

    return null;
  }

  /**
   * Obtiene la opción positiva de un radio button
   */
  getPositiveOption(options) {
    // Buscar opciones positivas
    const positiveValues = ['si', 'sí', 'bueno', '1', 'true', 'yes', 'cumple', 'ok'];
    
    for (const option of options) {
      const value = (option.value || '').toLowerCase().trim();
      if (positiveValues.includes(value)) {
        return option;
      }
    }

    // Si no encuentra opción positiva, retorna la primera
    return options.length > 0 ? options[0] : null;
  }

  /**
   * Obtiene la opción positiva de un select
   */
  getPositiveSelectOption(options) {
    // Saltar opción vacía
    const validOptions = options.filter(o => o.value && o.value.trim() !== '');
    
    // Buscar opciones positivas
    const positiveValues = ['si', 'sí', 'bueno', '1', 'true', 'yes', 'cumple', 'ok'];
    
    for (const option of validOptions) {
      const value = (option.value || '').toLowerCase().trim();
      if (positiveValues.includes(value)) {
        return option;
      }
    }

    // Si no encuentra opción positiva, retorna la primera válida
    return validOptions.length > 0 ? validOptions[0] : null;
  }

  /**
   * Verifica si el formulario está completo
   */
  async isFormComplete() {
    const formData = await this.analyzeForm();
    return formData.errors.length === 0;
  }

  /**
   * Intenta enviar el formulario con reintentos
   */
  async submitFormWithRetries() {
    console.log(`\n🚀 Intentando enviar formulario (máx ${this.config.maxRetries} intentos)...`);
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      console.log(`\n📤 Intento ${attempt}/${this.config.maxRetries}`);

      // Analizar formulario
      const formData = await this.analyzeForm();

      if (formData.errors.length > 0) {
        console.log(`⚠️ Errores detectados:`);
        formData.errors.forEach(e => console.log(`  • ${e}`));

        // Rellenar campos faltantes
        await this.fillMissingFields(formData);

        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`✅ Formulario completo, enviando...`);
        break;
      }
    }

    // Buscar y clickear botón de envío
    const submitted = await this.page.evaluate(() => {
      const buttons = document.querySelectorAll('button, input[type="submit"]');
      for (const btn of buttons) {
        const text = (btn.innerText || btn.value || '').toLowerCase();
        if (text.includes('guardar') || text.includes('enviar')) {
          if (!btn.disabled && btn.offsetParent !== null) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    });

    if (!submitted) {
      console.log(`❌ No se encontró botón de envío`);
      return false;
    }

    console.log(`✅ Botón de envío clickeado`);

    // Esperar confirmación
    try {
      await this.page.waitForFunction(() => {
        const text = document.body.innerText || '';
        const hasSuccess = text.toLowerCase().includes('guardado') || 
                          text.toLowerCase().includes('exitoso') || 
                          text.toLowerCase().includes('completado');
        const hasSwal = !!document.querySelector('.swal2-popup, .swal2-success');
        const hasAlert = !!document.querySelector('.alert-success, .toast-success');
        return hasSuccess || hasSwal || hasAlert;
      }, { timeout: this.config.timeout });

      console.log(`✅ Formulario enviado exitosamente`);
      return true;
    } catch (e) {
      console.log(`⚠️ Timeout esperando confirmación: ${e.message}`);
      return false;
    }
  }

  /**
   * Genera un reporte de análisis
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      user: this.user.nombre,
      errors: this.errors,
      warnings: this.warnings,
      filledFields: this.filledFields,
      success: this.errors.length === 0
    };
  }

  /**
   * Guarda el reporte en archivo
   */
  saveReport(filename = null) {
    const report = this.generateReport();
    const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
    const reportFile = filename || `${logsDir}/form-analysis-${Date.now()}.json`;
    
    try {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`📄 Reporte guardado: ${reportFile}`);
      return reportFile;
    } catch (e) {
      console.error(`❌ Error guardando reporte: ${e.message}`);
      return null;
    }
  }
}

module.exports = FormAnalyzer;
