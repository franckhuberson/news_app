# Axio News - Application de veille médiatique

Application complète de scraping d'actualités avec dashboard administrateur.

## Fonctionnalités
- 🤖 Scraping automatique de sites d'actualités (Python)
- 🔐 Authentification JWT avec gestion des rôles
- 📊 Dashboard admin avec statistiques
- ✏️ Modification des articles (titre, résumé, contenu, image)
- 📸 Upload d'images
- 👥 Gestion des administrateurs (ajout/suppression avec code de vérification)
- 📧 Réinitialisation de mot de passe par email
- 🎨 Interface moderne avec Tailwind CSS

## Technologies
- **Backend**: Node.js, Express, MongoDB, JWT, Multer, Nodemailer
- **Scraper**: Python, BeautifulSoup, Newspaper3k
- **Frontend**: React, TypeScript, Tailwind CSS, Lucide React

## Installation
1. Cloner le dépôt
2. Backend: `cd backend && npm install && npm run dev`
3. Frontend: `cd frontend && npm install && npm run dev`
4. Scraper: `cd backend/scraper && python -m venv venv && pip install -r requirements.txt`

## Identifiants de test
- Email: admin@test.com
- Mot de passe: admin123
