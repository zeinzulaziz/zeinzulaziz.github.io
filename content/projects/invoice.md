---
title: "Invoice Generator"
summary: "An invoice workspace for makeup artists and small service businesses: multi-step invoice building, branded PDF templates, loyalty discounts, WhatsApp sharing, analytics, and Firebase-backed data sync."
repo: invoice
language: Vanilla JavaScript + Firebase
cover: assets/img/invoice.webp
private: true
tags: ["invoice", "firebase", "pwa"]
draft: false
---

Tinara is a web app for creating, sending, and managing professional invoices, designed for makeup artists and other small service businesses. Built with Vanilla JavaScript and Firebase, with no build tools, and installable on phones as a PWA.

### Invoice building

- Multi-step invoice form (client, line items, payment) with inline validation
- Invoice numbers that auto-increment from a configurable starting number
- Dynamic service items: name, price, quantity, add or remove rows freely
- Automatic totals: full amount, discounts, down payments, and remaining balance
- Custom notes per invoice
- Live PDF preview beside the form (desktop) or in a modal (mobile)

### Branding and PDF design

- Five invoice templates: Classic, Minimal, Bold, Elegant, and Modern
- Custom PDF accent color from a color picker
- Separate logo uploads for the app and the invoice header
- Brand name and subtitle shown on every screen

### Automatic loyalty discounts

- Discount rules based on the client's order count (every Nth order)
- Percentage off or a fixed amount off
- Shows up as a voucher when a returning client creates a new invoice

### Payments and management

- Manage a list of bank accounts; pick several or type one in manually
- Payment status: mark invoices paid or unpaid from the dashboard

### Sending and sharing

- Share to WhatsApp with an automatically formatted summary message (WhatsApp formatting, with iOS/Android/desktop detection)
- Download a PDF (jsPDF) straight from the browser
- Add the invoice to Google Calendar or download an `.ics` file

### Dashboard and analytics

- Stats: total invoices, total revenue, down payments received, pending settlements
- Client and number search, month filter, date sorting, pagination
- Business analytics: best-selling services, monthly revenue, top clients, payment status distribution
- KPIs: total orders, unique clients, average invoice value
- Automatically rotating motivation cards

### Sync and data safety

- Multi-user with Firebase Auth (email and password login or registration)
- Per-user data stored in Cloud Firestore plus automatic backups to localStorage
- Offline persistence: the app keeps working without internet
- Field-by-field audit log of every invoice change, searchable and exportable

### Admin panel

- Create new accounts, enable or disable them, and set admin/user roles
- Reset a user's password by email
- Export all data: full JSON, CSV for Excel or Sheets, or settings only
- Import invoices from CSV with a preview before anything is written (a ready-to-fill CSV template is included)

### The rest

- Installable PWA on phones (manifest and theme are set up)
- Mobile-first responsive layout (desktop sidebar, mobile bottom navigation)
- Terms of Service and Privacy Policy pages
- SEO-ready structure with sitemap and robots.txt
- Anti-XSS output sanitizing (`escapeHtml`) and try-catch error handling

### Tech stack

| Part | Technology |
| --- | --- |
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| Backend | Firebase Auth (Email/Password) + Cloud Firestore |
| PDF | jsPDF (CDN) |
| Hosting | Firebase Hosting |
| Build | None, files are edited directly |
