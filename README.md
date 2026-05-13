# ⚔️ Portal de Westeros — Game of Thrones App

Aplicación web con **Login, Registro y Logout** usando **Supabase** como base de datos en la nube, consumiendo la [ThronesAPI](https://thronesapi.com/) para mostrar personajes.

---

## 📸 Funcionalidades

| Pantalla | Descripción |
|---|---|
| 🔐 **Login** | Verifica credenciales contra Supabase |
| 📝 **Registro** | Crea usuario en la tabla `usuarios` de Supabase |
| 🏰 **Dashboard** | Muestra personajes desde ThronesAPI |
| 🚪 **Logout** | Cierra sesión y limpia el estado |

---

## 🗄️ Base de datos — Supabase

Tabla `usuarios`:

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria auto-generada |
| `nombre` | TEXT | Nombre completo del usuario |
| `username` | TEXT UNIQUE | Nombre de usuario único |
| `casa` | TEXT | Casa de Westeros elegida |
| `password` | TEXT | Contraseña (texto plano — solo académico) |
| `created_at` | TIMESTAMP | Fecha de registro |

### SQL para crear la tabla:
```sql
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  casa TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a anon" ON usuarios
  FOR ALL USING (true) WITH CHECK (true);
```

---

## 🚀 Cómo ejecutar

```bash
git clone https://github.com/TU_USUARIO/got-auth-app.git
cd got-auth-app
# Abrir index.html en el navegador o usar un servidor local:
npx serve .
```

### GitHub Pages
1. Settings → Pages → Branch: main → Save
2. URL: `https://TU_USUARIO.github.io/got-auth-app`

---

## 🧱 Estructura

```
got-auth-app/
├── index.html        ← Pantallas: Login, Registro, Dashboard
├── css/
│   └── styles.css    ← Tema medieval oscuro
├── js/
│   └── app.js        ← Supabase + ThronesAPI + Auth
└── README.md
```

---

## 🔌 APIs utilizadas

| API | URL | Auth |
|---|---|---|
| **ThronesAPI** | `https://thronesapi.com/api/v2/Characters` | Sin API Key |
| **Supabase** | `https://ktjdfzuvopqrcesfjtxi.supabase.co` | Publishable Key |

---

## 🎨 Tecnologías

- HTML5 · CSS3 · JavaScript ES6+
- [Supabase JS SDK v2](https://supabase.com/docs/reference/javascript)
- Google Fonts: Cinzel + Crimson Text
- ThronesAPI (datos de personajes)

---

> ⚠️ Proyecto académico. Las contraseñas se guardan en texto plano — no usar en producción.
