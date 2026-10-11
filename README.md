# 🏨 Royal Hotel — Digital Menu & Ordering System

A complete restaurant digital menu with:

- **Customer menu page** (`index.html`) — browse & search dishes, filter by category/sort, add to cart, checkout, and **track orders in real time** (as the kitchen updates status).
- **Admin panel** (`admin.html`) — manage menu items, categories, tables + QR codes, orders, and hotel settings.
- **QR codes** for every table — customers scan and their table number is auto-filled at checkout.
- **Firebase Realtime Database** as the cloud database — all pages/devices stay in sync instantly.
- Automatic **localStorage fallback** so the app works even before Firebase is configured.

---

## 🚀 Quick start (no Firebase)

Just open `index.html` in a browser — everything runs offline using `localStorage`.
Open `admin.html`, log in with the default credentials:

```
Username: admin
Password: admin123
```

> ⚠️ Change these credentials in production (see *Security rules* below).

---

## 🔥 Connect your Firebase Realtime Database

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. In your project: **Build → Realtime Database → Create Database**.
3. Go to **Project Settings (⚙️) → General → Your apps → Web (</>)**, register a web app, and copy the `firebaseConfig` values.
4. Open **`firebase-config.js`** and paste the values, e.g.:

```js
const FIREBASE_CONFIG = {
    apiKey: "AIzaSy...",
    authDomain: "my-hotel-menu.firebaseapp.com",
    databaseURL: "https://my-hotel-menu-default-rtdb.firebaseio.com",
    projectId: "my-hotel-menu",
    storageBucket: "my-hotel-menu.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef"
};
```

5. Set the **Realtime Database security rules** (below).
6. Reload the pages — the console will show `✅ Firebase Realtime Database connected`.

All menu items, categories, tables, orders, and settings are stored under the
`hotel-menu` root path in your database.

---

## 🔐 Recommended Realtime Database security rules

```json
{
  "rules": {
    "hotel-menu": {
      "settings": {
        ".read": true,
        ".write": false
      },
      "items": {
        ".read": true,
        ".write": false
      },
      "categories": {
        ".read": true,
        ".write": false
      },
      "tables": {
        ".read": true,
        ".write": false
      },
      "orders": {
        ".read": true,
        ".write": true,
        "$orderId": {
          ".validate": "newData.hasChildren(['id','tableNumber','items','total','status']) && newData.child('status').val() == 'pending'"
        }
      }
    }
  }
}
```

> These rules let *anyone* read the menu and *create* orders (customers don't need
> an account), but **only** you can change `items`, `categories`, `tables`, and
> `settings` — those writes must be done from the Firebase Console, or you can add
> Firebase Authentication if you want to allow admin writes from the browser too.

---

## 🗂️ Data structure

```
hotel-menu/                     (root, configured in firebase-config.js)
├── settings/                   { hotelName, currency, taxRate }
├── items/                      List of menu items
├── categories/                 Menu categories
├── tables/                     Tables used for QR code ordering
└── orders/                     All customer orders
```

---

## ✅ Bugs fixed in this version

- **App would not start** — a stray `addToCart(itemId)` call (undefined variable)
  crashed the data loader, so `initializeApp()` never ran.
- **Settings page crashed** — `saveSettings()` called itself recursively (infinite
  recursion → stack overflow).
- ~10 **duplicate function definitions** removed (later broken versions were
  overriding good ones).
- **Cart persistence** restored (cart was reset on every page load).
- **Cart icon toggle** fixed (tap toggled twice).
- **Category form** now saves without reloading the page (added `onsubmit`).
- Fake "sample orders" no longer auto-inserted into the database.
- Malformed admin-button markup (`<!button>`) in the header fixed.
- Non-existent `fa-all` icon replaced.
- README merge-conflict markers removed.

---

## 📁 Files

| File                 | Purpose                                        |
|----------------------|------------------------------------------------|
| `index.html`         | Customer menu / ordering page                  |
| `admin.html`         | Admin dashboard                                |
| `script.js`          | All app logic (Firebase + localStorage layer)  |
| `firebase-config.js` | Your Firebase project settings                 |
| `style.css`          | Styles                                         |

---

*Built with plain HTML/CSS/JavaScript, Firebase Realtime Database, and qrcodejs.*