# Voorraad- en Verkoopsysteem - Doctor Smartphone Lelystad

## Overzicht

Een compleet voorraad- en verkoopsysteem gebouwd voor Doctor Smartphone Lelystad, met ondersteuning voor:
- Hiërarchisch productbeheer (Accessoires & Onderdelen)
- Barcode scanning en label printing
- Point of Sale (POS) kassasysteem
- Voorraadwaarschuwingen
- Gedetailleerde voorraadmutaties
- Verkoop- en transactiehistorie

## Database Schema

### Models

#### 1. Category (Hoofdcategorieën)
```javascript
{
  name: String,           // Bijv. "Hoesjes", "Schermen"
  type: String,           // 'accessoire' of 'onderdeel'
  description: String,
  order: Number
}
```

#### 2. SubCategory (Subcategorieën)
```javascript
{
  name: String,           // Bijv. "Siliconen Hoesjes", "OLED Schermen"
  categoryId: ObjectId,   // Referentie naar Category
  description: String,
  order: Number
}
```

#### 3. InventoryProduct (Producten)
```javascript
{
  name: String,                    // Productnaam
  barcode: String (unique),        // Unieke barcode per product
  sku: String (unique),            // Voorraadnummer
  categoryId: ObjectId,            // Hoofdcategorie
  subCategoryId: ObjectId,         // Subcategorie (optioneel)
  deviceModelId: ObjectId,         // Voor onderdelen: gekoppeld toestel
  stock: Number,                   // Huidige voorraad
  minStock: Number,                // Minimum voorraad voor waarschuwing
  maxStock: Number,                // Maximum voorraad
  purchasePrice: Number,           // Inkoopprijs
  salePrice: Number,               // Verkoopprijs
  location: String,                // Fysieke locatie (bijv. "Schap A-3")
  description: String,
  images: [String]                 // Array van image URLs
}
```

**Indexen:**
- `barcode`: unique index voor snelle lookups
- `deviceModelId`: index voor onderdelen per toestel

#### 4. StockMutation (Voorraadmutaties)
```javascript
{
  productId: ObjectId,             // Referentie naar product
  type: String,                    // 'inkoop', 'verkoop', 'correctie', 'retour'
  quantity: Number,                // Aantal (altijd positief)
  previousStock: Number,           // Voorraad vóór mutatie
  newStock: Number,                // Voorraad ná mutatie
  unitCost: Number,                // Prijs per stuk bij deze mutatie
  notes: String,                   // Opmerkingen
  invoiceNumber: String            // Factuurnummer (optioneel)
}
```

**Index:**
- `createdAt`: -1 voor snelle tijdlijn queries

#### 5. Sale (Verkopen)
```javascript
{
  saleNumber: String (unique),     // VK20240115-0001
  items: [{
    productId: ObjectId,           // Verkocht product
    quantity: Number,              // Aantal verkocht
    unitPrice: Number              // Prijs per stuk op verkoopmoment
  }],
  totalAmount: Number,             // Totaalbedrag
  paymentMethod: String,           // 'cash', 'pin', 'ideal', 'bankoverschrijving'
  customerName: String,            // Klantgegevens (optioneel)
  customerPhone: String,
  customerEmail: String,
  notes: String
}
```

**Verkoop nummerformaat:** `VK[YYYYMMDD]-[0001]`

#### 6. StockAlert (Voorraadwaarschuwingen)
```javascript
{
  productId: ObjectId,             // Product met lage voorraad
  currentStock: Number,            // Actuele voorraad bij aanmaken alert
  minStock: Number,                // Minimum voorraad
  message: String,                 // Waarschuwingsbericht
  isResolved: Boolean,             // Of waarschuwing is opgelost
  resolvedAt: Date                 // Wanneer opgelost
}
```

## API Endpoints

### Categories
- `GET /api/inventory/categories` - Haal alle categorieën en subcategorieën op
- `POST /api/inventory/categories` - Maak nieuwe categorie/subcategorie
- `PUT /api/inventory/categories` - Update categorie/subcategorie
- `DELETE /api/inventory/categories?id=...&type=...` - Verwijder categorie/subcategorie

### Products
- `GET /api/inventory/products` - Haal producten op (met filters)
  - Query params: `categoryId`, `subCategoryId`, `deviceModelId`, `barcode`, `search`, `lowStock`
- `POST /api/inventory/products` - Maak nieuw product
- `PUT /api/inventory/products` - Update product
- `DELETE /api/inventory/products?id=...` - Verwijder product

### Stock Mutations
- `GET /api/inventory/stock` - Haal voorraadmutaties op
  - Query params: `productId`, `type`, `limit`
- `POST /api/inventory/stock` - Verwerk voorraadmutatie
  - Types: `inkoop`, `verkoop`, `correctie`, `retour`
  - Gebruikt MongoDB transactions voor atomaire updates

### Sales
- `GET /api/inventory/sales` - Haal verkopen op
  - Query params: `startDate`, `endDate`, `paymentMethod`, `limit`
- `POST /api/inventory/sales` - Maak nieuwe verkoop
  - Controleert voorraad
  - Update voorraad atomisch
  - Maakt automatisch stock mutations
  - Genereert stock alerts indien nodig

### Stock Alerts
- `GET /api/inventory/alerts` - Haal waarschuwingen op
  - Query params: `isResolved`
- `PUT /api/inventory/alerts` - Markeer waarschuwing als opgelost

## Admin Pagina's

### 1. Voorraadbeheer (`/admin/voorraad`)
**Component:** `inventory-admin-page.jsx`

**Functionaliteit:**
- Product toevoegen/bewerken/verwijderen
- Barcode genereren
- Filtering op categorie, subcategorie, toestel
- Zoeken op naam, barcode, SKU
- Lage voorraad filter
- Real-time statistieken:
  - Totaal producten
  - Totale waarde
  - Lage voorraad items
  - Gemiddelde marge

**Formulier velden:**
- Productnaam *
- Barcode (met generator knop)
- SKU (auto-genereerd)
- Categorie * (met type indicator)
- Subcategorie
- Toestel Model * (alleen voor onderdelen)
- Voorraad *
- Min/Max voorraad
- Inkoop/Verkoopprijs *
- Locatie
- Beschrijving

### 2. Kassa / POS (`/admin/kassa`)
**Component:** `pos-admin-page.jsx`

**Functionaliteit:**
- Barcode scanning input (autofocus)
- Product zoeken op naam/barcode/SKU
- Winkelwagen beheer:
  - Toevoegen/verwijderen items
  - Aantal aanpassen (met voorraadcheck)
- Klantgegevens (optioneel):
  - Naam, telefoon, email
- Betaalmethodes:
  - Contant, PIN, iDeal, Bankoverschrijving
- Afrekenen met validatie:
  - Voorraad check
  - Atomische updates
  - Bon generatie
- Bon printen functionaliteit

**Kassascherm layout:**
- **Links:** Barcode input, productsearch, winkelwagen
- **Rechts:** Klantinfo, betaalmethode, totaal + afrekenen

### 3. Voorraadwaarschuwingen (`/admin/alerts`)
**Component:** `stock-alerts-page.jsx`

**Functionaliteit:**
- Lijst met lage voorraad waarschuwingen
- Filters: Actief, Opgelost, Alles
- Statistieken:
  - Actieve waarschuwingen
  - Kritieke items (voorraad = 0)
  - Vandaag opgelost
- Details per waarschuwing:
  - Product info
  - Huidige vs minimum voorraad
  - Categorie/subcategorie
  - Tijdstempel
- Markeer als opgelost functie

## Workflow

### Product Toevoegen
1. Ga naar `/admin/voorraad`
2. Klik "Nieuw Product"
3. Selecteer categorie (accessoire/onderdeel)
4. Bij onderdeel: selecteer toestel model
5. Vul product details in
6. Genereer barcode of voer handmatig in
7. Stel min/max voorraad in
8. Voer prijzen in
9. Klik "Toevoegen"

→ Systeem maakt automatisch:
- Initiële stock mutation (`inkoop`)
- Product met unique barcode

### Verkoop Verwerken (POS)
1. Ga naar `/admin/kassa`
2. Scan barcode of zoek product
3. Pas aantal aan indien nodig
4. Vul klantgegevens in (optioneel)
5. Selecteer betaalmethode
6. Klik "Afrekenen"

→ Systeem doet atomisch:
- Voorraad check voor alle items
- Update voorraad per product
- Maak stock mutations (`verkoop`)
- Genereer verkoop met uniek nummer
- Controleer en maak stock alerts indien nodig
- Toon bon met printoptie

### Voorraadmutatie Verwerken
**Via API:**
```javascript
POST /api/inventory/stock
{
  "productId": "...",
  "type": "inkoop",      // of 'verkoop', 'correctie', 'retour'
  "quantity": 10,
  "unitCost": 25.00,
  "notes": "Inkoop van leverancier X",
  "invoiceNumber": "INV-2024-001"
}
```

→ Systeem update atomisch:
- Product voorraad
- Maakt stock mutation record
- Controleert/maakt stock alert

### Stock Alert Management
1. Ga naar `/admin/alerts`
2. Bekijk actieve waarschuwingen
3. Wanneer voorraad is aangevuld:
   - Klik "Markeer als opgelost"
   - Of: voeg voorraad toe via inkoop mutation (auto-resolved)

## Barcode Systeem

**Principe:** 1 barcode = 1 uniek product (ongeacht aantal)

**Barcode formaat:** 12 cijfers
- Laatste 9 cijfers van timestamp
- 3 random cijfers
- Bijvoorbeeld: `742156789123`

**Gebruik:**
- Elke product krijgt unieke barcode
- Barcode wordt gebruikt in POS voor snelle lookup
- Kan gekoppeld worden aan Dymo label printer
- Database index voor snelle queries

## Dymo Label Printing

**Voorbereiding:**
1. Installeer Dymo Connect software
2. Verbind Dymo LabelWriter
3. Gebruik DYMO Label Web Service

**Label template:**
- Product naam
- Barcode (als Code 128)
- Verkoopprijs
- SKU (optioneel)

**Integratie punt:** `inventory-admin-page.jsx`
- Knop "Print Label" per product
- Gebruikt Dymo JavaScript SDK
- Automatisch formatteren

## Statistieken & Rapportage

### Voorraadbeheer Dashboard
- Totaal aantal producten
- Totale voorraadwaarde (inkoop)
- Aantal lage voorraad items
- Gemiddelde winstmarge %

### Per Product
- Huidige voorraad
- Min/Max drempels
- Inkoop vs verkoopprijs
- Winstmarge (€ en %)
- Locatie in magazijn

### Verkoop Rapportage
- Verkopen per dag/week/maand
- Omzet per betaalmethode
- Meest verkochte producten
- Klantgegevens (indien opgegeven)

## Best Practices

### Voorraad Management
1. **Stel realistische min/max voorraad in:**
   - Min: Veilige buffer voor doorlooptijd
   - Max: Voorkom overstock

2. **Gebruik locaties:**
   - Voer altijd locatie in (bijv. "Schap A-3", "Vitrine Links")
   - Versnelt fysiek zoeken

3. **Barcode labels:**
   - Print altijd labels voor nieuwe producten
   - Vervang beschadigde labels direct

4. **Regelmatige controle:**
   - Check alerts dagelijks
   - Doe maandelijkse voorraadtelling
   - Corrigeer discrepanties direct

### POS / Kassa
1. **Barcode scanner:**
   - Gebruik USB barcode scanner voor snelheid
   - Scanner moet direct naar input veld gaan

2. **Klantgegevens:**
   - Vraag alleen bij garantie/service
   - Privacy: bewaar minimaal nodig

3. **Betaalmethodes:**
   - PIN: meest gebruikt
   - Contant: wisselgeld vooraf regelen
   - iDeal/Overschrijving: voor grote bedragen

### Database Maintenance
1. **Backup:**
   - Dagelijkse MongoDB backup
   - Test restore procedure

2. **Indexes:**
   - Barcode index cruciaal voor snelheid
   - Monitor query performance

3. **Data cleanup:**
   - Archiveer oude verkopen (>1 jaar)
   - Behoud stock mutations voor boekhouding

## Technische Details

### MongoDB Transactions
Voor atomische updates gebruikt het systeem MongoDB transactions:
- Verkoop: voorraad update + mutaties + alerts
- Voorkomt race conditions
- Rollback bij fouten

### Error Handling
- Voorraad ontoereikend: Blokkeer verkoop
- Duplicate barcode: Toon error bij aanmaken
- Database errors: Graceful fallback

### Performance
- Indexes op veel-gezochte velden
- Pagination voor grote datasets
- Lazy loading voor product images

## Toekomstige Uitbreidingen

### Dymo Integration
- Direct printing vanuit admin
- Label templates voor verschillende producten
- Batch printing voor nieuwe voorraad

### Analytics
- Dashboard met grafieken
- Voorraadwaarde over tijd
- Verkoop trends
- Winstmarge analyse

### Mobile App
- Barcode scanning met smartphone
- Voorraadtelling met camera
- Quick stock check

### Integraties
- Koppeling met boekhoudsoftware
- Automatische bestellingen bij lage voorraad
- Leverancier portaal

### Multi-locatie
- Ondersteuning voor meerdere winkels
- Voorraad transfers tussen locaties
- Gecentraliseerd dashboard

## Support & Troubleshooting

### Veelvoorkomende Issues

**Barcode niet gevonden bij scannen:**
1. Check of product bestaat in systeem
2. Controleer barcode in database
3. Scan opnieuw (soms mislukt scan)

**Voorraad klopt niet:**
1. Bekijk stock mutations voor dit product
2. Check voor ongeldige correcties
3. Doe fysieke telling en correctie

**Alert verdwijnt niet:**
1. Check of voorraad daadwerkelijk > minStock
2. Forceer reload van alerts pagina
3. Markeer handmatig als opgelost

**POS is traag:**
1. Beperk aantal producten in search results
2. Check database connection
3. Clear browser cache

### Database Queries

**Alle producten met lage voorraad:**
```javascript
db.inventoryproducts.find({ $expr: { $lte: ['$stock', '$minStock'] } })
```

**Verkopen vandaag:**
```javascript
const today = new Date()
today.setHours(0,0,0,0)
db.sales.find({ createdAt: { $gte: today } })
```

**Stock mutations voor product:**
```javascript
db.stockmutations.find({ productId: ObjectId('...') }).sort({ createdAt: -1 })
```

## Contact & Credits

Ontwikkeld voor Doctor Smartphone Lelystad
- Website: [doctor-smartphone-lelystad.nl]
- Thema kleur: #3ca0de (Lelystad blauw)
- Framework: Next.js 16 met MongoDB

Voor support of feature requests, neem contact op met de systeembeheerder.
