'use client'

import DymoService from './dymo-service'

export async function printLabel(product) {
  return DymoService.printLabel(product, 1)
}

export async function testPrint() {
  return DymoService.printTestLabel()
}

export async function checkDymoStatus() {
  const status = await DymoService.checkDymoStatus()
  return {
    available: Boolean(status?.connected),
    url: status?.url || 'http://127.0.0.1:5001',
    printers: status?.printers || [],
    printerName: status?.printerName || null,
    errorType: status?.errorType || null,
    message: status?.message || '',
  }
}
