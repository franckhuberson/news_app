import requests
import certifi
from bs4 import BeautifulSoup
from newspaper import Article
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import os
import time
import logging

# =====================
# DÉTECTION DE CATÉGORIE
# =====================

def detect_category(title, content):
    """Détecte la catégorie d'un article à partir de son titre et contenu"""
    text = (title + " " + content).lower()
    
    categories = {
        'Politique': ['politique', 'gouvernement', 'président', 'élection', 'ministre', 'député', 'sénat', 'assemblée', 'république', 'état'],
        'Économie': ['économie', 'marché', 'investissement', 'cacao', 'prix', 'finance', 'bourse', 'entreprise', 'commercialisation', 'fmi', 'banque'],
        'Sports': ['sport', 'football', 'match', 'can', 'basketball', 'stade', 'coupe', 'équipe', 'entraînement', 'fif'],
        'Tech': ['tech', 'technologie', 'ia', 'intelligence artificielle', 'digital', 'robot', 'visa connect', 'internet', 'satellite', 'orange'],
        'Culture': ['culture', 'art', 'musique', 'cinéma', 'cuisine', 'caricature', 'festival', 'exposition', 'gastronomie', 'ndole'],
        'Faits Divers': ['accident', 'victime', 'mort', 'blessé', 'incendie', 'effondrement', 'drame', 'urgence', 'sécurité', 'camion', 'percuté']
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text:
                return category
    
    return 'Politique'  # Catégorie par défaut

# =====================
# CONFIGURATION
# =====================
load_dotenv()

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Connexion MongoDB (adaptée à ta nouvelle base locale)
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/news_app")
client = MongoClient(MONGO_URI)
db = client.get_default_database()
collection = db["articles"]  # Correspond à ton modèle Mongoose

# Headers pour éviter d'être bloqué
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Sources à scraper (gardées de ton ancien script)
SITES = [
    "https://www.abidjan.net/",
    "https://www.linfodrome.com/",
    "https://information.tv5monde.com/international",
    "https://www.rfi.fr/fr/afrique/"
]

# =====================
# FONCTIONS
# =====================

def get_article_links(site_url):
    """Récupère tous les liens d'articles d'une page"""
    links = set()

    try:
        response = requests.get(site_url, headers=HEADERS, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for a in soup.find_all("a", href=True):
            href = a["href"]

            if href.startswith("/"):
                href = site_url.rstrip("/") + href

            if href.startswith("http") and len(href) > 40:
                links.add(href)

    except Exception as e:
        logger.error(f"❌ Erreur sur {site_url}: {e}")

    return list(links)


def scrape_article(url):
    """Scrape un article individuel - SANS résumé automatique NLTK"""
    try:
        article = Article(url, language="fr")
        article.download()
        article.parse()
        article.nlp()
        # 👇 IMPORTANT: article.nlp() est commenté pour éviter les erreurs NLTK
        # article.nlp()

        if not article.text or not article.text.strip():
            logger.warning(f"⚠️ Article vide: {url}")
            return None

        # Structure adaptée à ton modèle Mongoose
        return {
            "title": article.title[:500] if article.title else "Sans titre",
            "originalContent": article.text,
            "summary": article.summary,
            "imageUrl": article.top_image if article.top_image else "",
            "source": url.split('/')[2] if url.split('/')[2] else "inconnu",
            "sourceUrl": url,
            "categorie": detect_category(article.title, article.text),  # ← AJOUTE CETTE LIGNE
            "status": "pending",
            "scrapedAt": datetime.utcnow(),
            "metadata": {
                "authors": article.authors if article.authors else [],
                "keywords": [],
                "wordCount": len(article.text.split()) if article.text else 0
            }
        }

    except Exception as e:
        logger.error(f"❌ Erreur article {url}: {e}")
        return None


def article_exists(url):
    """Vérifie si un article existe déjà (évite les doublons)"""
    return collection.find_one({"sourceUrl": url}) is not None


# =====================
# PIPELINE PRINCIPAL
# =====================

def run_scraper():
    """Fonction principale de scraping"""
    logger.info("✅ Connecté à MongoDB (news_app)")
    logger.info("🚀 Lancement du scraping...\n")

    total_inserted = 0
    total_errors = 0

    for site in SITES:
        logger.info(f"\n🔹 SITE : {site}")
        article_links = get_article_links(site)

        logger.info(f"➡️ {len(article_links)} liens trouvés")

        for link in article_links[:10]:  # Limite à 10 par site pour les tests
            if article_exists(link):
                logger.info("⏭️ Doublon ignoré")
                continue

            article_data = scrape_article(link)

            if article_data:
                try:
                    collection.insert_one(article_data)
                    logger.info(f"✅ Article inséré: {article_data['title'][:50]}...")
                    total_inserted += 1
                except Exception as e:
                    logger.error(f"❌ Erreur insertion: {e}")
                    total_errors += 1
            else:
                total_errors += 1

            time.sleep(1)  # Politesse entre les requêtes

    logger.info("\n" + "="*50)
    logger.info(f"🎉 SCRAPING TERMINÉ")
    logger.info(f"   ✅ Nouveaux articles: {total_inserted}")
    logger.info(f"   ❌ Erreurs: {total_errors}")
    logger.info("="*50)


if __name__ == "__main__":
    try:
        run_scraper()
    except KeyboardInterrupt:
        logger.info("\n⏹️ Scraping interrompu par l'utilisateur")
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")