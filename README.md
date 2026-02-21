# 🛍 Ahara Shop

Tienda online estática basada en el tema WordPress **Ahara**, convertida para correr completamente en **GitHub + Cloudflare Pages + Workers** sin necesidad de servidor propio.

---

## 🏗 Stack Técnico (100% Gratuito)

| Componente | Tecnología | Coste |
|------------|-----------|-------|
| Hosting frontend | Cloudflare Pages | **Gratis** (500 builds/mes) |
| Backend API | Cloudflare Workers (via Functions) | **Gratis** (100K req/día) |
| Base de código | GitHub | **Gratis** |
| Pagos | Stripe | **Gratis** (solo comisión ~1.4% + 0.25€ por venta) |
| CDN global | Cloudflare | **Gratis** |
| SSL/HTTPS | Cloudflare | **Gratis** |

---

## 📁 Estructura del Proyecto

```
ahara-shop/
├── index.html              # Página principal
├── pages/
│   ├── shop.html           # Tienda / catálogo
│   ├── product.html        # Detalle de producto
│   ├── cart.html           # Carrito
│   ├── checkout.html       # Checkout con Stripe
│   └── success.html        # Confirmación de pedido
├── assets/
│   ├── css/ahara.css       # Estilos (diseño Ahara)
│   ├── js/shop.js          # Lógica carrito y tienda
│   └/fonts/               # Fuentes Lato locales
├── data/
│   └── products.json       # Catálogo de productos
├── functions/
│   └── api/[[route]].js    # Cloudflare Worker (pagos Stripe)
├── _redirects              # Cloudflare Pages redirects
├── _headers                # Headers HTTP / caché
├── wrangler.toml           # Configuración Cloudflare
└── .github/workflows/      # CI/CD automático
```

---

## 🚀 Despliegue Paso a Paso

### 1. GitHub

```bash
# Clonar / subir a GitHub
git init
git add .
git commit -m "Initial commit: Ahara Shop"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ahara-shop.git
git push -u origin main
```

### 2. Cloudflare Pages

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Pages** → **Create a project** → **Connect to Git**
3. Conecta tu repo de GitHub
4. Configuración:
   - **Project name:** `ahara-shop`
   - **Production branch:** `main`
   - **Build command:** *(dejar vacío)*
   - **Build output directory:** `/` (raíz)
5. **Save and Deploy**

### 3. Stripe (Pagos)

1. Crea cuenta gratuita en [stripe.com](https://stripe.com)
2. Obtén tus claves en **Dashboard → Developers → API Keys**
3. En **Cloudflare Dashboard → Pages → ahara-shop → Settings → Environment variables**:
   ```
   STRIPE_SECRET_KEY = sk_live_XXXXXXXXXXXX
   STRIPE_WEBHOOK_SECRET = whsec_XXXXXXXXXXXX (opcional)
   ```
4. En `pages/checkout.html`, línea 7:
   ```js
   const STRIPE_PK = 'pk_live_XXXXXXXXXXXX'; // Tu clave pública
   ```

### 4. CI/CD Automático (GitHub Actions)

En **GitHub → Settings → Secrets and variables → Actions** agrega:
- `CLOUDFLARE_API_TOKEN` → Genera en Cloudflare Dashboard → My Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` → En Cloudflare Dashboard → right sidebar

Ahora cada `git push` despliega automáticamente.

---

## 🛒 Gestión de Productos

Edita `data/products.json` para modificar el catálogo:

```json
{
  "products": [
    {
      "id": "prod_001",
      "slug": "mi-producto",         // URL del producto
      "name": "Nombre del Producto",
      "category": "ropa",            // ropa | calzado | accesorios | outerwear
      "price": 29.99,
      "comparePrice": 49.99,         // null si no hay precio tachado
      "description": "Descripción...",
      "details": "Material: ...\nMedidas: ...",
      "images": ["https://..."],     // Array de URLs de imágenes
      "variants": {
        "talla": ["S","M","L","XL"],
        "color": ["Negro","Blanco"]  // Nombre del color (mapea a hex automáticamente)
      },
      "badge": "Nuevo",              // "Nuevo" | "Oferta" | null
      "stock": 50
    }
  ]
}
```

---

## 🎨 Personalización

### Colores y Tipografía
En `assets/css/ahara.css`, modifica las variables CSS:
```css
:root {
  --bg: #111111;          /* Fondo principal */
  --white: #ffffff;       /* Texto principal */
  --font: 'Lato', sans-serif;
}
```

### Nombre y Datos de la Tienda
Busca y reemplaza en los archivos HTML:
- `Ahara` → Nombre de tu tienda
- `info@ahara.shop` → Tu email
- `+34 900 000 000` → Tu teléfono

### Códigos de Descuento
En `pages/checkout.html`:
```js
const PROMO_CODES = {
  'DESCUENTO10': 0.10,  // 10% descuento
  'BIENVENIDO': 0.15,   // 15% descuento
};
```

---

## 🔧 Modo Demo (sin Stripe)

Si no configuras Stripe, el checkout funciona en **modo demo**:
- El pago se simula con un delay de 1.8 segundos
- Se redirige a la página de éxito con un número de pedido aleatorio
- Útil para probar el flujo completo antes de integrar pagos reales

---

## 📱 Funcionalidades Incluidas

- ✅ Catálogo de productos con filtros por categoría y precio
- ✅ Página de detalle de producto con galería, variantes y cantidad
- ✅ Carrito persistente (localStorage)
- ✅ Sidebar de carrito con animaciones
- ✅ Checkout completo con Stripe
- ✅ Código de descuento
- ✅ Página de éxito post-compra
- ✅ Diseño responsive (móvil/tablet/escritorio)
- ✅ Menú móvil hamburguesa
- ✅ Header sticky
- ✅ Botón volver arriba
- ✅ Toast notifications
- ✅ Efecto noise texture (fiel al tema Ahara)
- ✅ Scrollbar personalizado
- ✅ Deploy automático con GitHub Actions
- ✅ Headers de seguridad HTTP
- ✅ Cache optimizado con Cloudflare

---

## ⚡ Rendimiento

- Sin framework JS (vanilla JavaScript)
- Fuentes Lato locales (sin Google Fonts)
- Imágenes cargadas con `loading="lazy"`
- CSS variables nativas (sin preprocesadores)
- Cloudflare CDN global automático

---

## 📞 Soporte

Para dudas sobre la configuración, revisa:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Stripe Docs](https://stripe.com/docs)
