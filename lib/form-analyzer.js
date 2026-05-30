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

        // Detectar si está vacío (requerido O cualquier campo vacío visible)
        if (!field.value && !field.readonly && !field.disabled && field.visible) {
          analysis.errors.push(`Campo vacío: ${field.name} (${field.type})`);
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

      // Detectar radios sin seleccionar (todos los grupos visibles)
      Object.values(analysis.radios).forEach(group => {
        if (!group.checked) {
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

        if (!field.value && !field.disabled && field.visible) {
          analysis.errors.push(`Select vacío: ${field.name}`);
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

        if (!field.value && !field.readonly && !field.disabled && field.visible) {
          analysis.errors.push(`Textarea vacío: ${field.name}`);
        }

        analysis.textareas.push(field);
      });

      // Analizar checkboxes
      document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`)?.textContent || '';
        const field = {
          name: checkbox.name || checkbox.id,
          checked: checkbox.checked,
          required: checkbox.hasAttribute('required') || checkbox.classList.contains('required'),
          disabled: checkbox.disabled,
          visible: checkbox.offsetParent !== null,
          label: label
        };

        // Detectar checkboxes de aceptación que deben estar marcados
        const isAcceptance = label.toLowerCase().includes('aceptar') ||
          label.toLowerCase().includes('condiciones') ||
          label.toLowerCase().includes('salud') ||
          label.toLowerCase().includes('óptimas') ||
          label.toLowerCase().includes('confirmo') ||
          label.toLowerCase().includes('acepto') ||
          label.toLowerCase().includes('termino') ||
          label.toLowerCase().includes('término') ||
          label.toLowerCase().includes('declaro') ||
          label.toLowerCase().includes('manifiesto');

        if ((field.required || isAcceptance) && !field.checked && !field.disabled && field.visible) {
          analysis.errors.push(`Checkbox sin marcar: ${field.name} - ${label}`);
        }

        analysis.checkboxes = analysis.checkboxes || [];
        analysis.checkboxes.push(field);
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

    // Rellenar inputs (todos los vacíos, no solo required)
    for (const input of formData.inputs) {
      if (!input.value && !input.readonly && !input.disabled && input.visible) {
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

    // Rellenar radio buttons (todos los sin seleccionar)
    for (const [name, group] of Object.entries(formData.radios)) {
      if (!group.checked) {
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

    // Rellenar selects (todos los vacíos)
    for (const select of formData.selects) {
      if (!select.value && !select.disabled && select.visible) {
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

    // Rellenar textareas (todos los vacíos)
    for (const textarea of formData.textareas) {
      if (!textarea.value && !textarea.readonly && !textarea.disabled && textarea.visible) {
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

    // Rellenar checkboxes (solo los que parecen requeridos)
    if (formData.checkboxes) {
      for (const checkbox of formData.checkboxes) {
        const isAcceptance = (checkbox.label || '').toLowerCase().includes('aceptar') ||
          (checkbox.label || '').toLowerCase().includes('condiciones') ||
          (checkbox.label || '').toLowerCase().includes('salud') ||
          (checkbox.label || '').toLowerCase().includes('óptimas') ||
          (checkbox.label || '').toLowerCase().includes('confirmo') ||
          (checkbox.label || '').toLowerCase().includes('acepto') ||
          (checkbox.label || '').toLowerCase().includes('termino') ||
          (checkbox.label || '').toLowerCase().includes('declaro');
        if (!checkbox.checked && !checkbox.disabled && checkbox.visible && (checkbox.required || isAcceptance)) {
          try {
            await this.page.click(`input[type="checkbox"][name="${checkbox.name}"], input[type="checkbox"]#${checkbox.id}`);
            this.filledFields.push(`${checkbox.name}: marcado`);
            filled++;
            console.log(`  ✅ Rellenado: ${checkbox.name} = marcado`);
          } catch (e) {
            console.log(`  ⚠️ Error rellenando ${checkbox.name}: ${e.message}`);
          }
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
      return this.user.supervisor || 'Eduardo Villareal';
    }

    // Campos de observaciones/notas
    if (name.includes('observ') || name.includes('nota') || name.includes('comentario')) {
      return 'Sin novedad';
    }

    // Campos de nombre
    if (name.includes('nombre') || name.includes('conductor')) {
      return this.user.nombre || 'N/A';
    }

    // Campos de placa/vehículo
    if (name.includes('placa') || name.includes('vehiculo') || name.includes('vehículo')) {
      return this.user.placa || 'N/A';
    }

    // Campos de cédula
    if (name.includes('cedula') || name.includes('cédula') || name.includes('documento')) {
      return this.user.cedula || 'N/A';
    }

    // Campos de email
    if (name.includes('email') || name.includes('correo')) {
      return this.user.email || 'N/A';
    }

    // Campos de teléfono
    if (name.includes('telefono') || name.includes('teléfono') || name.includes('celular')) {
      return this.user.telefono || '3000000000';
    }

    // Campos de fecha
    if (name.includes('fecha') || name.includes('date')) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Campos de hora
    if (name.includes('hora') || name.includes('time')) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Campos de dirección
    if (name.includes('direccion') || name.includes('dirección') || name.includes('address')) {
      return this.user.direccion || 'Calle Principal 123';
    }

    // Campos de ciudad
    if (name.includes('ciudad') || name.includes('municipio') || name.includes('city')) {
      return this.user.ciudad || 'Bogotá';
    }

    // Campos de departamento/estado
    if (name.includes('departamento') || name.includes('estado') || name.includes('state')) {
      return this.user.departamento || 'Cundinamarca';
    }

    // Campos de empresa
    if (name.includes('empresa') || name.includes('company')) {
      return this.user.empresa || 'Conectar TV';
    }

    // Campos de cargo/posición
    if (name.includes('cargo') || name.includes('posicion') || name.includes('position')) {
      return this.user.cargo || 'Conductor';
    }

    // Campos de estado/condición
    if (name.includes('estado') || name.includes('condicion') || name.includes('condition')) {
      return 'Bueno';
    }

    // Campos de descripción
    if (name.includes('descripcion') || name.includes('descripción') || name.includes('description')) {
      return 'Sin novedad';
    }

    // Campos numéricos genéricos
    if (fieldType === 'number') {
      return '0';
    }

    // Campos de texto genéricos
    if (fieldType === 'text') {
      return 'N/A';
    }

    // Campos de email genéricos
    if (fieldType === 'email') {
      return this.user.email || 'usuario@example.com';
    }

    // Campos de teléfono genéricos
    if (fieldType === 'tel') {
      return this.user.telefono || '3000000000';
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
