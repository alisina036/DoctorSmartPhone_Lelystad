/**
 * DYMO Configuratie - Doctor Smartphone Lelystad
 * Dit bestand kan worden gewijzigd voor je specifieke setup
 */

export const DYMO_CONFIG = {
  // Printer Instellingen
  printer: {
    model: 'DYMO LabelWriter 550',
    mediaSize: '4x6',  // 4x6 inches
    orientation: 'Landscape',
    resolution: 300,   // DPI
  },

  // Web Service
  service: {
    host: 'localhost',
    port: 41951,
    protocol: 'http',  // 'http' voor localhost, 'https' voor productie
    timeout: 5000,     // milliseconds
  },

  // Label Templates
  templates: {
    standard: {
      name: 'Standard Product Label',
      width: 4,        // inches
      height: 6,
      margins: {
        top: 0.2,
        right: 0.2,
        bottom: 0.2,
        left: 0.2
      }
    }
  },

  // Barcode Instellingen
  barcode: {
    format: 'Code128',      // Code128, EAN13, EAN8, UPC
    height: 0.5,            // inches
    textSize: 8,            // pt
    showText: true,         // Show barcode number below
  },

  // Tekst Instellingen
  text: {
    productName: {
      font: 'Arial',
      size: 14,
      bold: true,
      maxLength: 40
    },
    price: {
      font: 'Arial',
      size: 16,
      bold: true,
      prefix: '€'
    },
    sku: {
      font: 'Arial',
      size: 8,
      color: '#808080',  // Grijs
      prefix: 'SKU: '
    }
  },

  // Retry Instellingen
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 1.5
  },

  // Logging
  logging: {
    enabled: true,
    level: 'info',  // 'debug', 'info', 'warn', 'error'
    logPrintDetails: true
  }
}

/**
 * Barcode Validator Instellingen
 */
export const BARCODE_VALIDATION = {
  // Minimale/maximale lengte per format
  formats: {
    'Code128': { min: 1, max: 128 },
    'EAN13': { min: 13, max: 13 },
    'EAN8': { min: 8, max: 8 },
    'UPC': { min: 12, max: 12 },
  },
  
  // Toegestane karakters
  allowedCharacters: {
    'Code128': /^[!-~]+$/,        // Alle printbare ASCII
    'EAN13': /^\d{13}$/,          // 13 digits
    'EAN8': /^\d{8}$/,            // 8 digits
    'UPC': /^\d{12}$/,            // 12 digits
  },
  
  // Scanner instellingen
  scanner: {
    timeout: 3000,               // Timeout voor scanner input (ms)
    enterKeyRequired: true,      // Scanner moet Enter key sturen
    autoFocus: true,             // Auto focus op scanner input
    clearAfterScan: true,        // Clear input na succesvol scan
  }
}

/**
 * Product Label Schema
 * Dit bepaalt welke velden verplicht zijn voor labeling
 */
export const PRODUCT_LABEL_SCHEMA = {
  required: ['name', 'price', 'barcode'],
  optional: ['sku', 'category', 'weight'],
  
  // Validatie regels
  validation: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 50
    },
    price: {
      type: 'number',
      min: 0,
      max: 99999
    },
    barcode: {
      type: 'string',
      minLength: 3,
      maxLength: 128,
      pattern: /^[a-zA-Z0-9\-_.]*$/
    },
    sku: {
      type: 'string',
      pattern: /^[a-zA-Z0-9\-_]*$/
    }
  }
}

/**
 * Admin Dashboard Instellingen
 */
export const ADMIN_DASHBOARD = {
  dymo: {
    // Status check interval (ms)
    statusCheckInterval: 30000,
    
    // Show status card
    showStatusCard: true,
    
    // Show troubleshooting help
    showTroubleshooting: true,
    
    // Quick test
    showTestButton: true
  }
}

/**
 * Kassa (POS) Instellingen
 */
export const KASSA_CONFIG = {
  // Barcode scanner
  barcodeScanner: {
    enabled: true,
    autoFocus: true,
    timeout: 3000
  },

  // Auto print labels bij toevoegen
  autoPrintLabels: false,

  // Toon DYMO status in kassa
  showDymoStatus: true,

  // Quick print buttons
  quickPrint: {
    single: true,      // Print 1 label
    bulk: true,        // Print voor alle in kar
    custom: true       // Custom hoeveelheid
  }
}

/**
 * Error Berichten (Nederlands)
 */
export const ERROR_MESSAGES = {
  DYMO_NOT_CONNECTED: 'DYMO printer niet verbonden. Start DYMO Connect en controleer USB verbinding.',
  DYMO_SERVICE_UNAVAILABLE: 'DYMO Web Service niet bereikbaar op poort 41951.',
  INVALID_BARCODE: 'Barcode bevat ongeldige karakters.',
  BARCODE_TOO_SHORT: 'Barcode moet minstens 3 karakters lang zijn.',
  MISSING_PRODUCT_DATA: 'Ontbrekende productgegevens.',
  PRINT_FAILED: 'Labeling mislukt. Controleer printer en probeer opnieuw.',
  PRINTER_ERROR: 'Printer fout. Controleer papier/labels en poging opnieuw.',
  CORS_ERROR: 'CORS fout bij verbinding met DYMO. Mogelijk HTTPS issue.',
  TIMEOUT: 'DYMO service timeout. Controleer netwerk verbinding.',
}

/**
 * Success Berichten (Nederlands)
 */
export const SUCCESS_MESSAGES = {
  LABEL_PRINTED: '{count} label(s) naar DYMO verzonden.',
  PRINTER_CONNECTED: 'DYMO LabelWriter 550 verbonden.',
  TEST_SUCCESSFUL: 'Test label succesvol geprint.',
  BATCH_COMPLETE: '{count} prints voltooid.',
}

/**
 * Toepassen van Config
 */
export const getDymoServiceUrl = () => {
  const { service } = DYMO_CONFIG
  return `${service.protocol}://${service.host}:${service.port}`
}

export const getBarcodeFontSize = () => {
  return DYMO_CONFIG.barcode.textSize
}

export const getProductNameMaxLength = () => {
  return DYMO_CONFIG.text.productName.maxLength
}

export default DYMO_CONFIG
