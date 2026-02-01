# DYMO LabelWriter 550 Integratie

> Volledige DYMO label printer integratie voor Doctor Smartphone Lelystad admin panel

## 🎯 Onderdelen

### 1️⃣ DYMO Service (`lib/dymo-service.js`)
Backend service voor DYMO Web Service communicatie
- ✅ Print labels met barcode
- ✅ Label XML template generatie
- ✅ Barcode validatie (Code128, EAN13, etc.)
- ✅ CORS handling voor HTTPS
- ✅ Error handling & retry logic

### 2️⃣ React Components
Ready-to-use UI componenten
- `DymoPrintButton` - Print knop met dialog
- `DymoStatusCard` - Printer status widget
- `KassaDymoIntegration` - Volledige POS interface
- `StockDymoIntegration` - Voorraad met bulk print
- `DymoTestPage` - Test & demo page

### 3️⃣ API Endpoints
```
POST /api/dymo/print              # Print label
POST /api/dymo/print-batch        # Batch print
GET  /api/dymo/status             # Check status
```

### 4️⃣ Kassa / POS Integration
- 🔍 Barcode scanner support
- 🛒 Winkelwagen management
- 🏷️ Direct label printing
- 📊 Stock tracking

### 5️⃣ Configuratie
`lib/dymo-config.js` - Centraliseerde instellingen
- Printer instellingen
- Barcode formats
- Label templates
- Error messages (Nederlands)

## 🚀 Setup (5 minuten)

### 1. DYMO Software
```bash
# Download van https://www.dymo.com/en-US/downloads
# Installeer DYMO Connect
# Sluit printer USB aan
# Start software - groene checkmark = OK
```

### 2. Test Verbinding
```bash
curl http://localhost:41951/api/v1/printers
```

### 3. Voeg Test Page toe
```jsx
// app/admin/dymo/page.jsx
import DymoTestPage from '@/components/admin/dymo-test-page'

export default function DymoPage() {
  return <DymoTestPage />
}
```

### 4. Open in Browser
```
http://localhost:3000/admin/dymo
```

### 5. Test Print
- Klik "Status Controleren"
- Klik "Test Label Printen"
- Label moet uit printer komen

## 💡 Gebruik

### Print Knop in Component
```jsx
import { DymoPrintButton } from '@/components/admin/dymo-print-button'

<DymoPrintButton 
  product={{
    name: 'iPhone Case',
    price: 29.99,
    barcode: '5902587654321',
    sku: 'CASE-001'
  }}
  quantity={5}
/>
```

### Kassa Integration
```jsx
import KassaDymoIntegration from '@/components/admin/kassa-dymo-integration'

<KassaDymoIntegration products={allProducts} />
```

### Printer Status Widget
```jsx
import { DymoStatusCard } from '@/components/admin/dymo-print-button'

<DymoStatusCard />
```

### Programmatisch Printen
```javascript
import DymoService from '@/lib/dymo-service'

// Print label
const result = await DymoService.printLabel({
  name: 'Product',
  price: 19.99,
  barcode: '1234567890'
}, 1)

// Check status
const status = await DymoService.checkDymoStatus()

// Validate barcode
const valid = DymoService.validateBarcode('1234567890')
```

## 📋 Label Design

### Huige 4x6 Template
```
┌─────────────────────────────┐
│  Product Naam               │  (14pt Arial Bold)
├─────────────────────────────┤
│         € 29,99             │  (16pt Arial Bold)
├─────────────────────────────┤
│ ║└┐┌┐┌┐┌┐┌┐┌┐└┐┌┐┌┐┌┐┌┐     │  (Code128 Barcode)
│ 5902587654321               │
├─────────────────────────────┤
│   SKU: CASE-001             │  (8pt Gray)
└─────────────────────────────┘
```

### Aanpassen
Edit `lib/dymo-service.js` → `generateLabelXml()` methode

## 🔍 Barcode Scanner

### Werking
```
Scanner zend: [BARCODE][ENTER]
App:
1. Leest input
2. Zoekt product op barcode
3. Voegt toe aan kar
4. Focust terug op input
```

### Ondersteunde Formats
- Code128 (alle ASCII)
- EAN-13 (13 digits)
- EAN-8 (8 digits)
- UPC (12 digits)

### Setup
USB scanner aansluiten - werkt automatisch!

## 📁 Bestandsstructuur

```
lib/
├── dymo-service.js                 # Core service
└── dymo-config.js                  # Instellingen

app/api/dymo/
├── print/route.js                  # POST /api/dymo/print
└── print-batch/route.js            # POST /api/dymo/print-batch

components/admin/
├── dymo-print-button.jsx           # Print button + status
├── kassa-dymo-integration.jsx      # POS interface
├── stock-dymo-integration.jsx      # Stock management
└── dymo-test-page.jsx              # Test page

hooks/
└── use-dymo-print.js               # React hook

docs/
├── DYMO_SETUP.md                   # Setup gids
├── DYMO_IMPLEMENTATION.md          # Implementatie
├── DYMO_LABELWRITER.md             # Details
└── DYMO_README.md                  # Dit bestand
```

## 🧪 Testen

### Test Page
```
http://localhost:3000/admin/dymo
```

Beschikbare tests:
- ✓ Status Check
- ✓ Print Test Label
- ✓ Barcode Validation
- ✓ Batch Print
- ✓ Error Scenarios

### Manual Testing
```
1. Open test page
2. Run connection test
3. Print test label (controleer printer)
4. Test 5+ barcodes
5. Test batch print met multiple products
6. Test scanner met 10+ scans
```

## 🐛 Troubleshooting

### DYMO niet verbonden
```
1. Check USB kabel
2. DYMO Connect draait? (groene checkmark)
3. Poort 41951 open: netstat -an | find "41951"
4. Windows Defender: Poort 41951 toestaan
5. Pagina vernieuwen
```

### Barcode Print Fout
```
1. Barcode min 3 karakters
2. Geen speciale karakters (behalve -, _, .)
3. Check format (Code128, EAN13, etc)
4. Test via test page
```

### HTTPS / CORS Fout
```
1. DYMO: Enable CORS in Settings
2. Browser: HTTPS exception toevoegen
3. DYMO Connect upgraden
4. Poort 41951 in firewall
```

### Scanner Werkt Niet
```
1. Test in Notepad
2. Check Enter key na barcode
3. Andere USB poort
4. Scanner driver update
5. Browser console checken
```

## 📖 Documentatie

- **DYMO_SETUP.md** - Complete setup instructies
- **DYMO_IMPLEMENTATION.md** - Integratie gids
- **DYMO_LABELWRITER.md** - Gedetailleerde specs
- **lib/dymo-service.js** - Code comments
- **components/admin/dymo-print-button.jsx** - Component docs

## 🔌 API Reference

### POST /api/dymo/print
```json
// Request
{
  "productData": {
    "name": "iPhone Case",
    "price": 29.99,
    "barcode": "5902587654321",
    "sku": "CASE-001"
  },
  "quantity": 1
}

// Response
{
  "success": true,
  "message": "1 label(s) naar DYMO 550 verzonden",
  "quantity": 1
}
```

### GET /api/dymo/status
```json
// Response
{
  "connected": true,
  "printers": ["DYMO LabelWriter 550"],
  "message": "DYMO verbonden"
}
```

## 🪝 React Hooks

### useDymoPrint()
```javascript
import useDymoPrint from '@/hooks/use-dymo-print'

const { printLabel, printMultipleLabels, loading, error, success } = useDymoPrint()

// Print enkel label
await printLabel(productData, 1)

// Print meerdere labels
await printMultipleLabels([
  { product: product1, quantity: 5 },
  { product: product2, quantity: 3 }
])
```

## ⚙️ Configuratie

### Bewerk Instellingen
```javascript
// lib/dymo-config.js

DYMO_CONFIG.barcode.format = 'EAN13'  // Code128, EAN13, etc
DYMO_CONFIG.text.productName.maxLength = 40
DYMO_CONFIG.service.timeout = 5000
// ... meer opties beschikbaar
```

## 📊 Performance

| Action | Time |
|--------|------|
| Single Print | ~1-2s |
| Batch 10 Labels | ~5-8s |
| Status Check | <500ms |
| Batch Print API | 2-10s |

## 🔒 Beveiliging

- ✅ Input validation (barcode, product data)
- ✅ Error handling (geen sensitive data)
- ✅ CORS protection
- ✅ Rate limiting (retry mechanism)
- ✅ User authentication (via admin panel)

## 🌐 Browser Support

- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)
- Mobile browsers (iOS 14+, Android 10+)

## 📦 Dependencies

Geen extra packages nodig!
- Built-in Fetch API
- React 18+
- Next.js 16+
- Existing UI components (shadcn/ui)

## 🚀 Production Checklist

- [ ] DYMO Connect geïnstalleerd op printer machine
- [ ] HTTPS certificaat ingesteld
- [ ] Poort 41951 opengezet in firewall
- [ ] CORS enabled in DYMO
- [ ] Product database barcodes ingevuld
- [ ] Test labels succesvol
- [ ] Scanner getest
- [ ] Foutmeldingen werkend
- [ ] User training afgerond
- [ ] Monitoring ingesteld

## 📞 Support

### Resources
- 📖 [DYMO API Docs](https://www.dymo.com/en-US/api-docs)
- 🌐 [Community Forum](https://forums.dymo.com)
- 📧 [DYMO Support](https://support.dymo.com)

### Local Debugging
```javascript
// Browser console
localStorage.setItem('DYMO_DEBUG', 'true')

// Check API responses
fetch('/api/dymo/status').then(r => r.json()).then(console.log)

// Check service URL
console.log('DYMO:', 'http://localhost:41951')
```

## 📝 License

Dit project is onderdeel van Doctor Smartphone Lelystad admin panel.

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Updated:** February 2026
**Printer:** DYMO LabelWriter 550
