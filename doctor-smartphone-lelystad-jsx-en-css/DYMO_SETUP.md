# DYMO LabelWriter 550 Integratie - Doctor Smartphone Lelystad

## Overzicht

Dit document beschrijft de volledige DYMO LabelWriter 550 integratie voor het admin panel. De printer wordt gebruikt voor het afdrukken van product labels met barcodes.

## Onderdelen

### 1. DYMO Service (`lib/dymo-service.js`)

De backend service die communiceert met de DYMO Web Service.

**Functies:**
- `checkDymoStatus()` - Controleer of printer verbonden is
- `printLabel(productData, quantity)` - Print labels
- `generateLabelXml(productData)` - Genereer XML template
- `validateBarcode(barcode)` - Valideer barcode
- `printTestLabel()` - Print test label voor debugging

**Product Data Format:**
```javascript
{
  name: "Xssive Anti Shock Back Cover",      // Productnaam
  price: 19.99,                              // Verkoopprijs
  barcode: "24082133930",                    // EAN-13 of SKU
  sku: "XSSIVE-001"                          // Interne SKU (optioneel)
}
```

### 2. React Components

#### `DymoPrintButton` Component
```jsx
import { DymoPrintButton } from '@/components/admin/dymo-print-button'

<DymoPrintButton 
  product={productObject}
  quantity={10}
  disabled={false}
/>
```

**Features:**
- Barcode validatie
- Hoeveelheid kiezen
- Foutafhandeling met visuele feedback
- Dialog interface

#### `DymoStatusCard` Component
```jsx
import { DymoStatusCard } from '@/components/admin/dymo-print-button'

<DymoStatusCard />
```

**Features:**
- Real-time printer status
- Probleemoplossing tips
- Auto-refresh elke 30 seconden

#### `KassaDymoIntegration` Component
```jsx
import KassaDymoIntegration from '@/components/admin/kassa-dymo-integration'

<KassaDymoIntegration products={allProducts} />
```

**Features:**
- Barcode scanner input
- Winkelwagen met hoeveelheden
- Direct label printen per product
- DYMO status check
- Instructies

### 3. API Endpoints

#### POST `/api/dymo/print`

Print een label via DYMO.

**Request:**
```json
{
  "productData": {
    "name": "Product Naam",
    "price": 19.99,
    "barcode": "1234567890",
    "sku": "SKU-001"
  },
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "1 label(s) naar DYMO 550 verzonden",
  "quantity": 1
}
```

#### GET `/api/dymo/status`

Check DYMO printer status.

**Response:**
```json
{
  "connected": true,
  "printers": ["DYMO LabelWriter 550"],
  "message": "DYMO verbonden"
}
```

### 4. React Hooks

#### `useDymoPrint()` Hook

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

## Installatie & Setup

### 1. DYMO Software Installeren

1. Download DYMO Label Software v8.7 of hoger
2. Installeer DYMO Connect software
3. Sluit DYMO LabelWriter 550 USB aan
4. Start DYMO Connect

### 2. Web Service Configuratie

DYMO Connect draait een Web Service op `http://localhost:41951`

**Poorten:**
- `41951` - DYMO Web Service (standaard)
- `41952` - Secure variant (HTTPS)

### 3. CORS Configuratie (voor HTTPS)

Voor productie met HTTPS, voeg toe in DYMO Connect:

```
Printers > Advanced > Enable CORS: ON
```

### 4. Barcode Database

Zorg dat producten de volgende velden hebben:

```javascript
{
  _id: ObjectId,
  name: String,          // Productnaam
  price: Number,         // Verkoopprijs
  barcode: String,       // Unieke barcode/EAN
  sku: String,           // Interne SKU
  stock: Number,         // Voorraad hoeveelheid
  // ... andere velden
}
```

## Label Template

Het label wordt gegenereerd op een 4x6 inch sticker met:

- **Bovenkant (1"):** Productnaam (groot, vet)
- **Midden (0.75"):** Prijs met € teken
- **Midden-onder (1"):** Barcode (Code 128)
- **Onderkant (0.5"):** SKU-nummer (klein grijs)

### Label Layout (DYMO 4x6)

```
┌────────────────────────────┐
│  Xssive Anti Shock Cover   │  ← Productnaam (14pt Arial)
├────────────────────────────┤
│        € 19,99             │  ← Prijs (16pt Arial)
├────────────────────────────┤
│  ║└┐┌┐┌┐┌┐┌┐└┐┌┐┌┐┌┐┌┐    │  ← Code 128 Barcode
│  24082133930               │
├────────────────────────────┤
│   SKU: XSSIVE-001          │  ← SKU (8pt grijs)
└────────────────────────────┘
```

## Barcode Handling

### Barcode Formaten Ondersteund

- **Code 128** (standaard) - Alle ASCII karakters
- **EAN-13** - 13 cijfers
- **EAN-8** - 8 cijfers
- **UPC-A** - 12 cijfers
- **Alfanumeriek** - Letters + nummers

### Scanner Integratie

De barcode scanner moet:
1. **Focus:** Barcode input field krijgt focus na scan
2. **Enter key:** Scanner stuurt Enter na barcode
3. **Automatisch:** Product wordt direct toegevoegd aan kar

### Scanner Config

Voor USB barcode scanners:
1. Scanner moet voorafgaande Enter key verzenden (meestal default)
2. Scanner kan Code 128 lezen
3. Geen Python script nodig - browser handelt af

```javascript
// Automatische handling in KassaDymoIntegration
const handleBarcodeScan = (e) => {
  const barcode = e.target.value.trim()
  // Zoeken & toevoegen automatisch
}
```

## Foutafhandeling

### Geen DYMO Verbinding

**Symptom:** "DYMO niet beschikbaar"

**Oplossing:**
1. Check DYMO LabelWriter 550 USB verbinding
2. Start DYMO Connect software
3. Verificeer poort 41951 luistert: `netstat -an | find "41951"`
4. Firewall: Open poort 41951 in Windows Defender
5. Vernieuw browser pagina

### Barcode Print Fout

**Symptom:** "Barcode bevat ongeldige karakters"

**Oplossing:**
1. Check barcode alleen nummers/letters bevat
2. Min. 3 karakters lang
3. Geen speciale karakters (behalve `-`, `_`, `.`)

### CORS Fout (HTTPS)

**Symptom:** "CORS error connecting to DYMO"

**Oplossing:**
1. DYMO Connect upgrade naar nieuwste versie
2. Activeer CORS in DYMO: Settings > Security > Enable CORS
3. Browser: Voeg site toe aan HTTPS exceptions

## Integratie in Bestaande Admin

### Kassa Pagina Update

```jsx
// app/admin/verkoop/page.jsx
import KassaDymoIntegration from '@/components/admin/kassa-dymo-integration'
import { Product } from '@/lib/models/Product'

export default async function VerkuopPage() {
  const products = await Product.find({}).lean()
  
  return (
    <KassaDymoIntegration products={products} />
  )
}
```

### Product Toevoeg Dialog

```jsx
import { DymoPrintButton } from '@/components/admin/dymo-print-button'

export function ProductForm({ product }) {
  return (
    <div>
      {/* Andere fields */}
      
      <DymoPrintButton 
        product={product}
        quantity={product.stock}
      />
    </div>
  )
}
```

### Dashboard Status Widget

```jsx
import { DymoStatusCard } from '@/components/admin/dymo-print-button'

export function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Andere widgets */}
      <DymoStatusCard />
    </div>
  )
}
```

## Testen

### Test Label Printen

```javascript
// In browser console
import DymoService from '@/lib/dymo-service'

// Print test label
await DymoService.printTestLabel()
```

### Test Dataset

```javascript
// Test producten voor kassa
const testProducts = [
  {
    _id: '1',
    name: 'iPhone 15 Pro Case',
    price: 29.99,
    barcode: '5902587654321',
    sku: 'IPHONE15-BLK'
  },
  {
    _id: '2',
    name: 'Samsung Galaxy A54 Screen',
    price: 149.99,
    barcode: '8901234567890',
    sku: 'SAMSNGA54-SCR'
  }
]
```

### Validators

```javascript
// Check barcode validation
import { DymoService } from '@/lib/dymo-service'

const validation = DymoService.validateBarcode('1234567890')
console.log(validation) // { valid: true } of { valid: false, error: '...' }
```

## Productie Checklist

- [ ] DYMO Connect geïnstalleerd op printer machine
- [ ] Poort 41951 opengezet in firewall
- [ ] CORS ingeschakeld voor HTTPS
- [ ] SSL cert gevalideerd
- [ ] Product database barcode velden ingevuld
- [ ] Test labels succesvol geprint
- [ ] Scanner getest met 5+ producten
- [ ] Foutmeldingen getest en werkend
- [ ] Backup label template gemaakt

## Troubleshooting

### DYMO Service niet bereikbaar

```bash
# Test connectie in terminal
curl http://localhost:41951/api/v1/printers

# Output zou moeten zijn JSON array van printers
# Als fout: DYMO Connect niet draaiend
```

### Barcode Scanner werkt niet

1. Test scanner met notepad
2. Zorg scanner zend Enter key
3. Check browser console voor errors
4. Probeer andere USB poort

### Print Hangt

1. Check DYMO papier/labels
2. Verwijder velletje en probeer opnieuw
3. Restart DYMO software
4. Zorg printer niet in sleep modus

## Support

Voor issues:
1. Check DYMO Connect software status
2. Controleer poort 41951 luistert
3. Herstart DYMO software
4. Browser console logs checken
5. Vernieuw pagina

## API Reference

Zie `/api/dymo/print` en `/api/dymo/status` code voor volledige details.
