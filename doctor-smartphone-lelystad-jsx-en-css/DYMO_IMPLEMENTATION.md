# DYMO LabelWriter 550 - Implementatie Gids

## Quick Start (15 minuten)

### 1. DYMO Software Installeren
```
1. Download: https://www.dymo.com/en-US/downloads
2. Installeer DYMO Connect Software
3. Sluit DYMO LabelWriter 550 USB aan
4. Start software - groene checkmark = verbonden
```

### 2. DYMO Service Starten
- DYMO Connect start automatisch de Web Service op poort 41951
- Test: `curl http://localhost:41951/api/v1/printers`

### 3. Admin Panel Testen
```
1. Ga naar: http://localhost:3000/admin
2. Zoek "DYMO Status" card
3. Status moet groen zijn
4. Klik "Test Label" knop
```

## Integratie in Admin Pagina's

### Option 1: Standalone DYMO Dashboard

```jsx
// app/admin/dymo/page.jsx
'use client'

import { DymoStatusCard } from '@/components/admin/dymo-print-button'
import StockDymoIntegration from '@/components/admin/stock-dymo-integration'

export default function DymoPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">DYMO Label Printer</h1>
      <DymoStatusCard />
      <StockDymoIntegration />
    </div>
  )
}
```

### Option 2: Integratie in Kassa (POS)

```jsx
// app/admin/verkoop/page.jsx
'use client'

import KassaDymoIntegration from '@/components/admin/kassa-dymo-integration'

export default function KassaPage({ products }) {
  return (
    <div className="p-6">
      <KassaDymoIntegration products={products} />
    </div>
  )
}
```

### Option 3: Widget in Dashboard

```jsx
// components/admin/dashboard.jsx
import { DymoStatusCard } from '@/components/admin/dymo-print-button'

export function AdminDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <DymoStatusCard />
      {/* Andere widgets */}
    </div>
  )
}
```

## Barcode Scanner Setup

### USB Scanner Verbinding

```javascript
// Automatisch ondersteund - geen config nodig!
// Scanner stuurt: [barcode][ENTER]
// App: leest input, zoekt product, voegt toe
```

### Scanner Instellingen aanpassen

```javascript
// lib/dymo-config.js
export const BARCODE_VALIDATION = {
  scanner: {
    timeout: 3000,           // Wacht max 3 seconden op ENTER
    enterKeyRequired: true,  // Scanner moet Enter sturen
    autoFocus: true,         // Focus terug op input
    clearAfterScan: true,    // Clear input na scan
  }
}
```

### Multi-Scanner Support

```javascript
// app/admin/verkoop/kassa/page.jsx
import KassaDymoIntegration from '@/components/admin/kassa-dymo-integration'

export default function MultiKassaPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {/* Kassa 1 */}
      <KassaDymoIntegration products={products} />
      
      {/* Kassa 2 */}
      <KassaDymoIntegration products={products} />
    </div>
  )
}
```

## Barcode Toevoegen aan Database

### Update Product Schema

```javascript
// lib/models/Product.js
const ProductSchema = new mongoose.Schema({
  // Bestaande velden
  name: String,
  price: Number,
  
  // Nieuwe barcode velden
  barcode: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Voor kassa
  stock: {
    type: Number,
    default: 0
  }
})
```

### Migration: Barcodes Toevoegen

```javascript
// scripts/add-barcodes.ts
import { Product } from '@/lib/models/Product'
import connectDB from '@/lib/mongodb'

async function addBarcodes() {
  await connectDB()
  
  const products = await Product.find({})
  
  for (const product of products) {
    // Genereer barcode uit SKU
    if (!product.barcode && product.sku) {
      product.barcode = product.sku
      await product.save()
      console.log(`✓ ${product.name}: ${product.barcode}`)
    }
  }
  
  console.log('Klaar!')
  process.exit(0)
}

addBarcodes()
```

## Label Aanpassingen

### Custom Label Template

```javascript
// lib/dymo-service.js
static generateLabelXml(productData) {
  // Wijzig deze functie voor custom layout
  
  // Standaard: Naam (top), Prijs (midden), Barcode (midden), SKU (bottom)
  
  // Mogelijkheden:
  // - Font sizes aanpassen
  // - Posities verplaatsen
  // - Extra velden toevoegen (bijv. expiry date)
  // - Kleuren aanpassen
  // - QR-code toevoegen
}
```

### Barcode Formaat Wijzigen

```javascript
// lib/dymo-config.js
export const DYMO_CONFIG = {
  barcode: {
    format: 'EAN13',      // Wijzig naar EAN13, UPC, etc.
    height: 0.5,
    textSize: 8,
    showText: true
  }
}
```

## Kassa Workflow

### 1. Product Scannen

```
Scanner → Input field → ENTER → Product zoeken
```

### 2. Hoeveelheid Wijzigen

```
+/- Knop → Hoeveelheid update → Kar refreshed
```

### 3. Label Printen

```
Print Knop → Dialog → Dialoogstelling hoeveelheid → Printen → DYMO
```

### 4. Afrekenen

```
Afrekenen → Totaal berekenen → Sale naar DB → Voorraad update → Kar leeg
```

## API Endpoints

### Print Single Label
```bash
POST /api/dymo/print
Content-Type: application/json

{
  "productData": {
    "name": "iPhone Case",
    "price": 29.99,
    "barcode": "1234567890",
    "sku": "CASE-001"
  },
  "quantity": 1
}
```

### Print Multiple (Batch)
```bash
POST /api/dymo/print-batch
Content-Type: application/json

{
  "items": [
    {
      "productData": { ... },
      "quantity": 5
    },
    {
      "productData": { ... },
      "quantity": 3
    }
  ]
}
```

### Check Status
```bash
GET /api/dymo/status

Response:
{
  "connected": true,
  "printers": ["DYMO LabelWriter 550"],
  "message": "DYMO verbonden"
}
```

## Foutafhandeling

### Geen Printer Verbonden

```javascript
// Automatische error handling:
const result = await DymoService.printLabel(productData)

if (!result.success) {
  console.error(result.message)
  // Toon user error
  showNotification(result.message, 'error')
}
```

### Firewall Issue (HTTPS)

```
Error: CORS error connecting to DYMO

Oplossing:
1. DYMO Connect openen
2. Settings > Security > Enable CORS = ON
3. Pagina verversen
```

### Barcode Format Error

```
Error: Barcode bevat ongeldige karakters

Oplossing:
1. Check barcode format (Code128, EAN13, etc.)
2. Zorg geen speciale karakters
3. Min 3 karakters lang
```

## Monitoring & Logging

### Log DYMO Events

```javascript
// Browser Console
localStorage.setItem('DYMO_DEBUG', 'true')

// Alle DYMO calls worden nu gelogged
// Check console voor details
```

### Status Check Log

```javascript
// Monitor printer status
import { DymoService } from '@/lib/dymo-service'

setInterval(async () => {
  const status = await DymoService.checkDymoStatus()
  console.log('DYMO Status:', status)
}, 30000)
```

## Production Deployment

### 1. HTTPS Certificaat

```
DYMO werkt NOT via standaard http
Voor HTTPS:
1. DYMO Connect: Enable CORS
2. Browser: Accept self-signed certs of DYMO
3. Update DYMO_CONFIG.service.protocol = 'https'
```

### 2. Firewall Regels

```
Poort 41951 toestaan:
- Inbound: TCP 41951 van localhost
- Outbound: N/A (lokaal)
```

### 3. Error Monitoring

```javascript
// Sentry / Error tracking
try {
  await DymoService.printLabel(product)
} catch (error) {
  reportError({
    service: 'DYMO',
    action: 'printLabel',
    product: product.id,
    error: error.message
  })
}
```

## Testing

### Unit Test

```javascript
// __tests__/dymo.test.js
import { DymoService } from '@/lib/dymo-service'

describe('DymoService', () => {
  it('validates barcode', () => {
    const valid = DymoService.validateBarcode('1234567890')
    expect(valid.valid).toBe(true)
  })
  
  it('rejects invalid barcode', () => {
    const invalid = DymoService.validateBarcode('ab')
    expect(invalid.valid).toBe(false)
  })
})
```

### Integration Test

```javascript
// Test echte print
test('Print label via DYMO', async () => {
  const result = await DymoService.printLabel({
    name: 'Test',
    price: 9.99,
    barcode: '1234567890'
  }, 1)
  
  expect(result.success).toBe(true)
})
```

## Troubleshooting Checklist

- [ ] DYMO LabelWriter 550 USB verbonden
- [ ] DYMO Connect software draait
- [ ] Groen checkmark in DYMO software
- [ ] Poort 41951 luistert: `netstat -an | find "41951"`
- [ ] Firewall opens poort 41951
- [ ] Test print werkt: `DymoService.printTestLabel()`
- [ ] Barcode format ondersteund (Code128, EAN13, etc.)
- [ ] Barcodes in database ingevuld
- [ ] Scanner getest met minstens 3 producten
- [ ] Error messages tonen aan gebruiker

## Support Resources

- **DYMO Docs:** https://www.dymo.com/en-US/api-docs
- **SDK Download:** https://www.dymo.com/en-US/downloads
- **Community:** forums.dymo.com

## Volgende Stappen

1. [x] DYMO SDK Integratie
2. [x] Label Template
3. [x] Barcode Validatie
4. [x] Kassa Integration
5. [x] Error Handling
6. [ ] Production Testing
7. [ ] User Training
8. [ ] Monitoring Setup
