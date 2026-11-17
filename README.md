# PocketFlow Demo

A small budget-tracking demo with a dark, fintech-style dashboard. There is no backend and no database: everything runs in the browser and is stored in `localStorage`.

## Features

- **Dashboard**: single-screen layout on desktop with KPI cards (sparklines), balance trend, monthly income/expense bars and a category donut chart.
- **Transactions**: sortable table with search, type and category filters, date presets and custom ranges, amount range, add and delete. Custom categories can be created right from the add dialog.
- **Settings**: monthly spending limit with progress and month-end projection, CSV (Excel) and JSON export, JSON import, demo data reset.
- **Balance in the top bar** with a show/hide toggle that is remembered between visits.
- **Responsive**: slide-in drawer menu and a collapsible filter panel on mobile.
- Deterministic demo data on first launch, so the charts are never empty.

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Lucide, Zustand (persist middleware).

## Getting started

```bash
git clone https://github.com/atillagungor/pocketflowdemo.git
cd pocketflowdemo
npm install
npm run dev
```

Open http://localhost:3000. Node.js 20.9 or newer is required.

## Project structure

```
src/
  app/(app)/     routes with a shared layout: dashboard, /transactions, /settings
  components/    sidebar, topbar, dashboard, charts, transactions, settings
  store/         Zustand stores (transactions, categories, settings)
  lib/           formatting, category helpers, stats
  data/          deterministic demo data generator
  types/         shared TypeScript types
```

## Notes

- Data never leaves your browser. Clearing the site data resets the app.
- This repository is the standalone, database-free demo version.

<details>
<summary><b>🇹🇷 Türkçe</b></summary>

## PocketFlow Demo

Koyu temalı, finans uygulaması görünümünde küçük bir bütçe takip demosu. Arka uç ve veritabanı yok: her şey tarayıcıda çalışır ve `localStorage`'da saklanır.

### Özellikler

- **Genel bakış**: masaüstünde tek ekrana sığan düzen, sparkline'lı KPI kartları, bakiye trendi, aylık gelir/gider çubukları ve kategori halka grafiği.
- **İşlemler**: sıralanabilir tablo; arama, tür ve kategori filtresi, tarih kısayolları ve özel aralık, tutar aralığı, ekleme ve silme. Özel kategoriler işlem ekleme penceresinden oluşturulabilir.
- **Ayarlar**: ilerleme çubuğu ve ay sonu tahminiyle aylık harcama limiti, CSV (Excel) ve JSON dışa aktarma, JSON içe aktarma, demo veriyi sıfırlama.
- **Üst çubukta bakiye**: göster/gizle düğmesiyle, tercih bir sonraki ziyarete kadar saklanır.
- **Mobil uyumlu**: soldan açılan menü ve katlanabilir filtre paneli.
- İlk açılışta deterministik demo veri yüklenir, grafikler hiç boş kalmaz.

### Kullanılan teknolojiler

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Lucide, Zustand (persist).

### Kurulum

```bash
git clone https://github.com/atillagungor/pocketflowdemo.git
cd pocketflowdemo
npm install
npm run dev
```

Tarayıcıda http://localhost:3000 adresini aç. Node.js 20.9 veya üstü gerekir.

### Notlar

- Veriler tarayıcından dışarı çıkmaz. Site verilerini temizlersen uygulama sıfırlanır.
- Bu repo, veritabanı olmayan bağımsız demo sürümüdür.

</details>

---

Made by [Atilla Güngör](https://github.com/atillagungor)