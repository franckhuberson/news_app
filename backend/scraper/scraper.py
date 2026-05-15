import requests
from bs4 import BeautifulSoup
from newspaper import Article
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timezone
import os
import time
import logging
import re

# =====================
# DÉTECTION DE CATÉGORIE
# =====================

def detect_category(title, content):
    """Détecte la catégorie d'un article à partir de son titre et contenu"""
    text = (title + " " + content).lower()
    
    categories = {
        'Politique': ['politique', 'gouvernement', 'président', 'élection', 'ministre', 'député', 'sénat', 'assemblée', 'république', 'état'],
        'Économie': ['économie', 'marché', 'investissement', 'cacao', 'prix', 'finance', 'bourse', 'entreprise', 'commercialisation', 'fmi', 'banque'],
        'Sports': ['sport', 'football', 'match', 'can', 'basketball', 'stade', 'coupe', 'équipe', 'entraînement', 'fifa'],
        'Tech': ['tech', 'technologie', 'ia', 'intelligence artificielle', 'digital', 'robot', 'visa connect', 'internet', 'satellite', 'orange'],
        'Culture': ['culture', 'art', 'musique', 'cinéma', 'cuisine', 'caricature', 'festival', 'exposition', 'gastronomie'],
        'Faits Divers': ['accident', 'victime', 'mort', 'blessé', 'incendie', 'effondrement', 'drame', 'urgence', 'sécurité', 'camion', 'percuté'],
        'Buzz': ['buzz', 'viral', 'tendance', 'people', 'célébrité', 'influenceur', 'mème', 'scandale', 'polémique', 'instagram', 'tiktok', 'twitter', 'facebook'],
        'Emploi': ['emploi', 'recrutement', 'offre d\'emploi', 'travail', 'carrière', 'stage', 'alternance', 'concours', 'recrute', 'poste à pourvoir', 'cv', 'entretien']
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text:
                return category
    
    return 'Politique'

# =====================
# GÉNÉRATION DE RÉSUMÉ MANUEL
# =====================

def generate_summary(text, max_sentences=3):
    """Génère un résumé simple sans NLTK"""
    if not text:
        return ""
    
    text = re.sub(r'\s+', ' ', text)
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    
    if not sentences:
        return text[:300] + "..." if len(text) > 300 else text
    
    summary_sentences = sentences[:max_sentences]
    summary = '. '.join(summary_sentences)
    
    if len(summary) > 500:
        summary = summary[:500] + "..."
    
    return summary + "."

# =====================
# CONFIGURATION
# =====================
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Connexion MongoDB
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
if "news_app" in MONGO_URI:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
else:
    client = MongoClient(MONGO_URI)
    db = client["news_app"]

collection = db["articles"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Sources à scraper
SITES = [
    "https://www.abidjan.net/",
    "https://www.linfodrome.com/",
    "https://information.tv5monde.com/international",
    "https://www.rfi.fr/fr/afrique/"
]

# Configuration des timeouts
REQUEST_TIMEOUT = 15
ARTICLE_TIMEOUT = 10  # Timeout pour newspaper3k

# =====================
# FONCTIONS
# =====================

def get_article_links(site_url):
    """Récupère tous les liens d'articles d'une page"""
    links = set()

    try:
        response = requests.get(site_url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for a in soup.find_all("a", href=True):
            href = a["href"]
            
            if not href:
                continue

            if href.startswith("/"):
                href = site_url.rstrip("/") + href

            if href.startswith("http") and len(href) > 40:
                if any(ext in href.lower() for ext in ['article', 'news', 'actualite', 'politique', 'economie', 'sport', 'buzz', 'emploi']):
                    links.add(href)

    except Exception as e:
        logger.error(f"❌ Erreur sur {site_url}: {e}")

    return list(links)[:20]  # Limiter à 20 liens

def scrape_article(url):
    """Scrape un article individuel avec gestion des timeouts"""
    try:
        # Configuration du timeout pour newspaper3k
        article = Article(url, language="fr", request_timeout=ARTICLE_TIMEOUT)
        article.download()
        article.parse()

        if not article.text or not article.text.strip():
            logger.warning(f"⚠️ Article vide: {url}")
            return None

        content = article.text
        summary = generate_summary(content)
        
        try:
            source = url.split('/')[2].replace('www.', '')
        except:
            source = "inconnu"

        # ✅ Correction de l'avertissement utcnow()
        return {
            "title": article.title[:500] if article.title else "Sans titre",
            "originalContent": content[:10000],
            "summary": summary[:1000],
            "imageUrl": article.top_image if article.top_image else "",
            "source": source,
            "sourceUrl": url,
            "categorie": detect_category(article.title or "", content),
            "status": "pending",
            "scrapedAt": datetime.now(timezone.utc),  # ✅ Correction
            "metadata": {
                "authors": article.authors if article.authors else [],
                "keywords": [],
                "wordCount": len(content.split()) if content else 0
            }
        }

    except Exception as e:
        logger.error(f"❌ Erreur article {url[:80]}...: {str(e)[:100]}")
        return None

def article_exists(url):
    """Vérifie si un article existe déjà"""
    try:
        return collection.find_one({"sourceUrl": url}) is not None
    except:
        return False

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

        for link in article_links:
            if article_exists(link):
                logger.info(f"⏭️ Doublon ignoré: {link[:50]}...")
                continue

            logger.info(f"📄 Scraping: {link[:80]}...")
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
    
    return total_inserted

if __name__ == "__main__":
    try:
        run_scraper()
    except KeyboardInterrupt:
        logger.info("\n⏹️ Scraping interrompu par l'utilisateur")
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")