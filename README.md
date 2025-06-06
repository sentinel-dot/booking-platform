# 📅 Booking Platform - OpenTable Clone

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-green)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue)](https://tailwindcss.com/)

[Rest der README...]

Eine moderne, vollständige Buchungsplattform für Restaurants und Friseure mit Next.js, TypeScript und PostgreSQL.

## 🚀 Features (Aktuell Implementiert)

### ✅ Vollständig Funktional
- **Multi-Business Support**: Restaurants UND Friseure auf einer Plattform
- **Dynamische Verfügbarkeits-Engine**: Echtzeitprüfung basierend auf Öffnungszeiten und Buchungen
- **Staff-Management**: Mitarbeiterspezifische Buchungen für Friseure
- **Kapazitäts-Management**: Restaurant-Tische mit verschiedenen Kapazitäten
- **Business Dashboard**: Vollständiges Admin-Interface
- **Authentifizierung**: NextAuth.js mit Credentials Provider
- **Responsive Design**: Mobile-first mit Tailwind CSS
- **TypeScript**: Vollständig typisiert
- **Database**: PostgreSQL mit Prisma ORM

### 🎯 Aktuelle Funktionen
- Public Booking Pages (`/book/[slug]`)
- Echte Verfügbarkeits-API mit Kollisionserkennung
- Business Dashboard mit Login
- Service-Auswahl (Tische/Friseur-Services)
- Staff-Auswahl für Friseure
- Automatische End-Zeit-Berechnung
- Buffer-Zeiten zwischen Terminen
- Öffnungszeiten-Management
- Spezielle Verfügbarkeiten (Urlaub/Feiertage)

## 🛠 Vollständige Installation

### Voraussetzungen
```bash
# Node.js (LTS Version)
# Von https://nodejs.org herunterladen

# PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql postgresql-contrib
```

### Projekt Setup
```bash
# 1. Next.js Projekt erstellen
npx create-next-app@latest booking-platform --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. In Projektverzeichnis wechseln
cd booking-platform

# 3. Core Dependencies installieren
npm install prisma @prisma/client
npm install next-auth @auth/prisma-adapter
npm install @headlessui/react @heroicons/react
npm install react-hook-form @hookform/resolvers zod
npm install date-fns
npm install nodemailer @types/nodemailer
npm install dotenv
npm install bcryptjs @types/bcryptjs

# 4. Development Dependencies
npm install tsx --save-dev

# 5. Prisma initialisieren
npx prisma init

# 6. Database erstellen
createdb booking_platform
# ODER über psql:
# psql -U postgres
# CREATE DATABASE booking_platform;

# 7. Prisma Client generieren
npx prisma generate

# 8. Database Migration
npx prisma migrate dev --name init

# 9. Seed-Daten erstellen
npm run db:seed

# 10. Server starten
npm run dev
```

### Environment Variables (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/booking_platform?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional für später)
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_FROM=""
```

## 📁 Projektstruktur

```
booking-platform/
├── prisma/
│   ├── schema.prisma          # Database Schema
│   ├── seed.ts               # Test-Daten
│   └── migrations/           # DB Migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth
│   │   │   ├── businesses/[slug]/    # Business API
│   │   │   ├── bookings/            # Booking API
│   │   │   └── availability/        # Verfügbarkeits-API
│   │   ├── auth/
│   │   │   └── signin/              # Login Page
│   │   ├── book/[slug]/             # Public Booking Pages
│   │   ├── dashboard/               # Business Dashboard
│   │   ├── layout.tsx               # Root Layout
│   │   └── providers.tsx            # NextAuth Provider
│   ├── components/
│   │   ├── BookingForm.tsx          # Hauptbuchungsformular
│   │   ├── ui/                      # UI Components
│   │   └── dashboard/               # Dashboard Components
│   ├── lib/
│   │   └── prisma.ts               # Prisma Client
│   └── types/
│       └── next-auth.d.ts          # NextAuth Types
├── package.json
└── README.md
```

## 🗄 Database Schema

### Core Entities
- **businesses**: Restaurants/Friseure
- **users**: Dashboard-Benutzer
- **services**: Buchbare Services (Tische/Haarschnitte)
- **staff_members**: Mitarbeiter (hauptsächlich Friseure)
- **bookings**: Alle Buchungen
- **availability_rules**: Öffnungszeiten
- **special_availability**: Urlaub/Feiertage

### Beziehungen
- User → UserBusiness → Business (Many-to-Many)
- Business → Services (One-to-Many)
- Business → StaffMembers (One-to-Many)
- StaffMember → StaffServices → Service (Many-to-Many)
- Business/Staff → AvailabilityRules (One-to-Many)
- Business/Service/Staff → Bookings (One-to-Many)

## 🧪 Test-Daten

Nach `npm run db:seed` sind verfügbar:

### Test Business Owner
- **Email**: test@example.com
- **Passwort**: password123

### Test Businesses
1. **Bella Vista Restaurant** (`/book/bella-vista`)
   - Tisch für 2 Personen (120 Min)
   - Tisch für 4 Personen (120 Min)  
   - Großer Tisch 6-8 Personen (150 Min)
   - Öffnungszeiten: Mo 17-22h, Di-So 11:30-22h

2. **Salon Schmidt** (`/book/salon-schmidt`)
   - Herrenhaarschnitt (45 Min, €35)
   - Damenhaarschnitt (90 Min, €55)
   - Coloration (180 Min, €95)
   - Staff: Anna Schmidt, Klaus Meyer
   - Öffnungszeiten: Di-Sa 9-18h

## 🎯 VOLLSTÄNDIGER IMPLEMENTIERUNGSPLAN

### Phase 1: Core Verbesserungen (Woche 9-10)

#### 🔧 Backend APIs Vervollständigen
- [ ] **Dashboard APIs** (`/api/dashboard/`)
  - [ ] `/api/dashboard/overview` - Tagesstatistiken
  - [ ] `/api/dashboard/bookings` - Buchungsliste mit Pagination
  - [ ] `/api/dashboard/bookings/[id]` - Buchung Details/Update
  - [ ] `/api/dashboard/analytics` - Erweiterte Statistiken

#### 📊 Echte Dashboard Daten
- [ ] **Dashboard Overview** mit echten DB-Abfragen
- [ ] **Buchungsmanagement** 
  - [ ] Buchungen anzeigen (heute, diese Woche, alle)
  - [ ] Buchungen bestätigen/stornieren
  - [ ] Buchungsdetails bearbeiten
  - [ ] Manuelle Buchungen erstellen
  - [ ] Bulk-Aktionen (mehrere Buchungen auf einmal)

#### 🛎️ Service Management
- [ ] **Service CRUD** (`/dashboard/services`)
  - [ ] Services erstellen/bearbeiten/löschen
  - [ ] Preise anpassen
  - [ ] Dauer und Buffer-Zeiten konfigurieren
  - [ ] Service-Verfügbarkeit (aktiv/inaktiv)

#### 👥 Staff Management (Friseure)
- [ ] **Staff CRUD** (`/dashboard/staff`)
  - [ ] Mitarbeiter hinzufügen/bearbeiten/entfernen
  - [ ] Staff-Service Zuordnungen
  - [ ] Individuelle Arbeitszeiten pro Mitarbeiter
  - [ ] Urlaub/Krankheit verwalten

#### ⚙️ Business Settings
- [ ] **Grundeinstellungen** (`/dashboard/settings`)
  - [ ] Business-Informationen bearbeiten
  - [ ] Öffnungszeiten konfigurieren
  - [ ] Stornierungsrichtlinien
  - [ ] Booking-Link anpassen
  - [ ] E-Mail/SMS Einstellungen

### Phase 2: Erweiterte Features (Woche 11-12)

#### 📧 Notification System
- [ ] **E-Mail Integration**
  - [ ] Buchungsbestätigungen automatisch versenden
  - [ ] Erinnerungen (24h vor Termin)
  - [ ] Stornierungsbestätigungen
  - [ ] Template-System für E-Mails

- [ ] **SMS Integration** (optional)
  - [ ] SMS-Erinnerungen
  - [ ] Last-Minute Benachrichtigungen

- [ ] **Dashboard Notifications**
  - [ ] Echte Benachrichtigungen für neue Buchungen
  - [ ] Push-Notifications für kritische Events
  - [ ] Notification Center im Dashboard

#### 🔄 Erweiterte Availability Engine
- [ ] **Recurring Availability Rules**
  - [ ] Verschiedene Öffnungszeiten für verschiedene Monate
  - [ ] Saisonale Anpassungen
  - [ ] Feiertage automatisch erkennen

- [ ] **Capacity Management**
  - [ ] Overbooking-Schutz
  - [ ] Waitlist-System
  - [ ] Resource-basierte Buchungen (Salon-Stühle)

- [ ] **Advanced Time Slots**
  - [ ] Variable Slot-Längen je nach Service
  - [ ] Break-Zeiten für Staff
  - [ ] Setup/Cleanup Zeiten

#### 🎨 UI/UX Verbesserungen
- [ ] **Booking Flow Optimierung**
  - [ ] Multi-Step Form mit Progress Bar
  - [ ] Calendar Widget statt Dropdown
  - [ ] Time Slot Visualization
  - [ ] Mobile-optimierte Auswahl

- [ ] **Dashboard Redesign**
  - [ ] Moderne Card-basierte Layouts
  - [ ] Drag & Drop für Buchungen
  - [ ] Quick Actions Toolbar
  - [ ] Advanced Filtering & Search

### Phase 3: Business Logic & Workflows (Woche 13-14)

#### 💳 Payment Integration
- [ ] **Stripe Integration**
  - [ ] Deposit-Zahlungen für Buchungen
  - [ ] Stornierungsgebühren
  - [ ] Recurring Payments (Memberships)
  - [ ] Webhook-Handling

- [ ] **PayPal Integration** (alternative)
- [ ] **Payment Dashboard**
  - [ ] Revenue Tracking
  - [ ] Refund Management
  - [ ] Financial Reports

#### 📋 Customer Management
- [ ] **Customer Profiles**
  - [ ] Buchungshistorie pro Kunde
  - [ ] Kundennotizen und Präferenzen
  - [ ] Loyalty Points System
  - [ ] Customer Segmentation

- [ ] **Customer Communication**
  - [ ] Direct Messaging
  - [ ] Marketing E-Mails
  - [ ] Birthday/Anniversary Reminders

#### 🔐 Advanced Authentication
- [ ] **Multi-User Business Accounts**
  - [ ] Owner, Manager, Staff Rollen
  - [ ] Granulare Berechtigungen
  - [ ] Team-Einladungen
  - [ ] Activity Logs

- [ ] **Social Login** (optional)
  - [ ] Google OAuth
  - [ ] Facebook Login
  - [ ] Apple Sign-In

### Phase 4: Analytics & Reporting (Woche 15-16)

#### 📊 Business Analytics
- [ ] **Revenue Analytics**
  - [ ] Tagesumsatz-Tracking
  - [ ] Service-Performance
  - [ ] Staff-Performance (Friseure)
  - [ ] Seasonal Trends

- [ ] **Booking Analytics**
  - [ ] Conversion Rates
  - [ ] Peak Hours Analysis
  - [ ] No-Show Tracking
  - [ ] Cancellation Patterns

- [ ] **Customer Analytics**
  - [ ] New vs. Returning Customers
  - [ ] Customer Lifetime Value
  - [ ] Demographic Analysis
  - [ ] Satisfaction Scores

#### 📈 Advanced Reporting
- [ ] **Automated Reports**
  - [ ] Weekly/Monthly Business Reports
  - [ ] PDF Export
  - [ ] E-Mail Report Delivery
  - [ ] Custom Report Builder

- [ ] **Data Export**
  - [ ] CSV/Excel Export
  - [ ] API für Third-Party Tools
  - [ ] Integration mit Buchhaltungssoftware

### Phase 5: Skalierung & Optimierung (Woche 17-18)

#### 🚀 Performance Optimierung
- [ ] **Database Optimization**
  - [ ] Query Optimierung
  - [ ] Indexing Strategy
  - [ ] Connection Pooling
  - [ ] Read Replicas

- [ ] **Caching Strategy**
  - [ ] Redis für Session Storage
  - [ ] API Response Caching
  - [ ] Static Asset Optimization
  - [ ] CDN Integration

- [ ] **Frontend Optimization**
  - [ ] Code Splitting
  - [ ] Lazy Loading
  - [ ] Image Optimization
  - [ ] Service Worker (PWA)

#### 🌐 Multi-Tenancy
- [ ] **White-Label Solution**
  - [ ] Custom Branding pro Business
  - [ ] Eigene Domains
  - [ ] Theme Customization
  - [ ] Logo/Color Schemes

- [ ] **Franchise Support**
  - [ ] Multi-Location Businesses
  - [ ] Central Management
  - [ ] Location-specific Settings
  - [ ] Cross-Location Analytics

#### 🔒 Security & Compliance
- [ ] **Security Hardening**
  - [ ] Rate Limiting
  - [ ] SQL Injection Prevention
  - [ ] XSS Protection
  - [ ] CSRF Tokens

- [ ] **GDPR Compliance**
  - [ ] Data Retention Policies
  - [ ] Right to be Forgotten
  - [ ] Data Export für Kunden
  - [ ] Privacy Controls

### Phase 6: Integration & API (Woche 19-20)

#### 🔗 External Integrations
- [ ] **Calendar Integration**
  - [ ] Google Calendar Sync
  - [ ] Outlook Integration
  - [ ] iCal Export
  - [ ] Two-way Sync

- [ ] **POS System Integration**
  - [ ] Square Integration
  - [ ] Toast Integration (Restaurants)
  - [ ] Custom POS APIs

- [ ] **Marketing Tools**
  - [ ] Mailchimp Integration
  - [ ] Google Analytics
  - [ ] Facebook Pixel
  - [ ] Instagram Business

#### 📱 Mobile Apps (Optional)
- [ ] **React Native Apps**
  - [ ] Business Dashboard Mobile App
  - [ ] Customer Booking App
  - [ ] Push Notifications
  - [ ] Offline Mode

#### 🤖 Automation & AI
- [ ] **Smart Scheduling**
  - [ ] AI-basierte Slot-Optimierung
  - [ ] Predictive No-Show Detection
  - [ ] Automatic Overbooking Suggestions
  - [ ] Dynamic Pricing

- [ ] **Chatbot Integration**
  - [ ] Automated Customer Support
  - [ ] Booking via Chat
  - [ ] FAQ Handling

## 🧪 Testing Strategy

### Unit Tests
- [ ] API Route Testing
- [ ] Database Function Testing
- [ ] Utility Function Testing
- [ ] Component Testing

### Integration Tests
- [ ] Booking Flow End-to-End
- [ ] Authentication Flow
- [ ] Payment Processing
- [ ] Email/SMS Delivery

### Performance Tests
- [ ] Load Testing für High-Traffic
- [ ] Database Performance
- [ ] API Response Times
- [ ] Frontend Performance

## 🚀 Deployment Plan

### Development Environment
- [x] Local Development Setup
- [ ] Docker Containerization
- [ ] Development Database
- [ ] Hot Reloading

### Staging Environment
- [ ] Heroku/Vercel Staging
- [ ] Staging Database
- [ ] End-to-End Testing
- [ ] Performance Monitoring

### Production Environment
- [ ] Production Hosting (Vercel/AWS)
- [ ] Production Database (AWS RDS/Heroku Postgres)
- [ ] CDN Setup
- [ ] Monitoring & Logging
- [ ] Backup Strategy
- [ ] CI/CD Pipeline

## 📊 Success Metrics

### Technical KPIs
- API Response Time < 200ms
- 99.9% Uptime
- Database Query Performance
- Frontend Load Times < 3s

### Business KPIs
- Booking Conversion Rate
- Customer Retention Rate
- Revenue per Business
- User Satisfaction Score

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## 📝 License

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

Bei Fragen oder Problemen:
1. Überprüfe die [Issues](https://github.com/your-repo/issues)
2. Erstelle ein neues Issue
3. Kontaktiere das Entwicklungsteam


## 🌐 Live Demo

- **🍽️ Restaurant Demo**: [bella-vista.booking-platform.com](https://your-demo-url.com/book/bella-vista)
- **💇 Salon Demo**: [salon-schmidt.booking-platform.com](https://your-demo-url.com/book/salon-schmidt)  
- **📊 Dashboard Demo**: [dashboard.booking-platform.com](https://your-demo-url.com/auth/signin)

**Test Login**: test@example.com / password123

---

**Status**: ✅ MVP Fertig - Ready für Phase 1 Implementierung
**Nächster Meilenstein**: Dashboard APIs & Echte Daten Integration