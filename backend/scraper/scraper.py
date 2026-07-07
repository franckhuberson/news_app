import requests
from bs4 import BeautifulSoup # type: ignore
from newspaper import Article # type: ignore
from pymongo import MongoClient # type: ignore
from dotenv import load_dotenv # type: ignore
from datetime import datetime, timedelta, timezone
import os
import time
import logging
import re
import random

# =====================
# DÉTECTION DE CATÉGORIE
# =====================

def detect_category(title, content):
    """Détecte la catégorie d'un article à partir de son titre et contenu"""
    text = (title + " " + content).lower()
    
    categories = {
        'Politique': ['politique', 'gouvernement', 'président', 'élection', 'ministre', 'député', 'sénat', 'assemblée', 'république', 'état', 'gouvernance', 'démocratie', 'parti', 'vote'],
        'Économie': ['économie', 'marché', 'investissement', 'cacao', 'prix', 'finance', 'bourse', 'entreprise', 'commercialisation', 'fmi', 'banque', 'business', 'commerce', 'croissance', 'devise'],
        'Sports': ['sport', 'football', 'match', 'can', 'basketball', 'stade', 'coupe', 'équipe', 'entraînement', 'fifa', 'sports', 'athlétisme', 'tennis', 'joueur', 'compétition'],
        'Tech': ['tech', 'technologie', 'ia', 'intelligence artificielle', 'digital', 'robot', 'visa connect', 'internet', 'satellite', 'orange', 'smartphone', 'logiciel', 'innovation', 'startup'],
        'Culture': ['culture', 'art', 'musique', 'cinéma', 'cuisine', 'caricature', 'festival', 'exposition', 'gastronomie', 'littérature', 'théâtre', 'danse', 'patrimoine'],
        'Faits Divers': ['accident', 'victime', 'mort', 'blessé', 'incendie', 'effondrement', 'drame', 'urgence', 'sécurité', 'camion', 'percuté', 'incident', 'décès', 'braquage'],
        'Buzz': ['buzz', 'viral', 'tendance', 'people', 'célébrité', 'influenceur', 'mème', 'scandale', 'polémique', 'instagram', 'tiktok', 'twitter', 'facebook', 'réseaux sociaux'],
        'Emploi': ['emploi', 'recrutement', 'offre d\'emploi', 'travail', 'carrière', 'stage', 'alternance', 'concours', 'recrute', 'poste à pourvoir', 'cv', 'entretien', 'job', 'opportunité']
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text:
                return category
    
    return 'Politique'

# =====================
# GÉNÉRATION DE RÉSUMÉ
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
if "amaya_news" in MONGO_URI:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
else:
    client = MongoClient(MONGO_URI)
    db = client["news_app"]

collection = db["articles"]

HEADERS_LIST = [
    {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
    {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
    {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
]

# ✅ 30 SITES SCRAPPABLES
SITES = [
    # Actualités générales (10 sites)
    "https://www.abidjan.net/",
    "https://www.fratmat.info/",
    "https://www.linfodrome.com/",
    "https://information.tv5monde.com/international",
    "https://www.rfi.fr/fr/afrique/",
    "https://www.jeuneafrique.com/",
    "https://www.lemonde.fr/afrique/",
    "https://www.bbc.com/afrique",
    "https://www.france24.com/fr/afrique/",
    "https://www.afrik.com/",
    
    # Emploi & Concours (5 sites)
    "https://emploi.educarriere.ci/emploi-accueil",
    "https://www.rmo-jobcenter.com/fr/cote-d-ivoire/offres-emploi.html",
    "https://agenceemploijeunes.ci/",
    "https://infoconcoursci.com/",
    "https://gucaci.ciconcours.com/",
    
    # Économie (3 sites)
    "https://www.eco.ci/",
    "https://www.agenceecofin.com/",
    "https://www.africanewshub.com/category/economy",
    
    # Sports (3 sites)
    "https://www.sport-ivoire.ci/",
    "https://www.africatopsports.com/",
    "https://www.lequipe.fr/",
    
    # Tech & Innovation (3 sites)
    "https://www.tech-news.ci/",
    "https://www.africatech.com/",
    "https://www.camer.be/",
    
    # Culture (2 sites)
    "https://www.musicinafrica.net/",
    "https://www.culturebene.com/",
    
    # Institutions & Développement (4 sites)
    "https://www.afro.who.int/fr",
    "https://www.un.org/africarenewal/fr",
    "https://www.banquemondiale.org/fr/region/afrique",
    "https://www.afdb.org/fr"
]

# Configuration des timeouts (augmentés)
REQUEST_TIMEOUT = 30      # 30 secondes pour la requête HTTP
ARTICLE_TIMEOUT = 25      # 25 secondes pour newspaper3k
MAX_ARTICLES_PER_SITE = 15  # Maximum d'articles par site

# =====================
# FONCTIONS OPTIMISÉES
# =====================

def get_random_headers():
    """Retourne des headers aléatoires pour éviter le blocage"""
    return random.choice(HEADERS_LIST)

def get_article_links(site_url):
    """Récupère tous les liens d'articles d'une page"""
    links = set()

    try:
        response = requests.get(site_url, headers=get_random_headers(), timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for a in soup.find_all("a", href=True):
            href = a["href"]
            
            if not href:
                continue

            if href.startswith("/"):
                href = site_url.rstrip("/") + href

            if href.startswith("http") and len(href) > 40:
                # Filtre les liens d'articles
                if any(ext in href.lower() for ext in ['article', 'news', 'actualite', 'politique', 'economie', 'sport', 'buzz', 'emploi', 'tech', 'culture', 'concours', 'recrutement']):
                    links.add(href)

    except requests.Timeout:
        logger.error(f"⏰ Timeout sur {site_url}")
    except Exception as e:
        logger.error(f"❌ Erreur sur {site_url}: {e}")

    return list(links)[:MAX_ARTICLES_PER_SITE]

def scrape_article(url):
    """Scrape un article individuel avec gestion des timeouts"""
    try:
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

        return {
            "title": article.title[:500] if article.title else "Sans titre",
            "originalContent": content[:10000],
            "summary": summary[:1000],
            "imageUrl": article.top_image if article.top_image else "",
            "source": source,
            "sourceUrl": url,
            "categorie": detect_category(article.title or "", content),
            "status": "pending",
            "scrapedAt": datetime.now(timezone.utc),
            "metadata": {
                "authors": article.authors if article.authors else [],
                "keywords": [],
                "wordCount": len(content.split()) if content else 0
            }
        }

    except requests.Timeout:
        logger.error(f"⏰ Timeout article {url[:80]}...")
        return None
    except Exception as e:
        logger.error(f"❌ Erreur article {url[:80]}...: {str(e)[:100]}")
        return None

def article_exists(url):
    """Vérifie si un article existe déjà dans la base"""
    try:
        return collection.find_one({"sourceUrl": url}) is not None
    except:
        return False

def clean_old_articles(days=30):
    """Nettoie les vieux articles non publiés"""
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        result = collection.delete_many({
            "status": "pending",
            "scrapedAt": {"$lt": cutoff_date}
        })
        if result.deleted_count > 0:
            logger.info(f"🗑️ Nettoyage: {result.deleted_count} vieux articles supprimés")
    except Exception as e:
        logger.error(f"❌ Erreur nettoyage: {e}")

# =====================
# PIPELINE PRINCIPAL
# =====================

def run_scraper():
    """Fonction principale de scraping optimisée"""
    logger.info("✅ Connecté à MongoDB (news_app)")
    logger.info("🚀 Lancement du scraping sur 30 sites...\n")

    total_inserted = 0
    total_errors = 0
    total_skipped = 0
    start_time = time.time()

    for i, site in enumerate(SITES, 1):
        logger.info(f"\n[{i}/{len(SITES)}] 🔹 SITE : {site}")
        
        article_links = get_article_links(site)
        logger.info(f"➡️ {len(article_links)} liens trouvés")

        for link in article_links:
            if article_exists(link):
                logger.info(f"⏭️ Doublon ignoré: {link[:50]}...")
                total_skipped += 1
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

            # Politesse entre les requêtes
            time.sleep(random.uniform(0.5, 1.5))
        
        # Pause entre les sites
        time.sleep(2)

    elapsed_time = time.time() - start_time
    
    logger.info("\n" + "="*60)
    logger.info(f"🎉 SCRAPING TERMINÉ")
    logger.info(f"   ⏱️  Temps écoulé: {elapsed_time/60:.1f} minutes")
    logger.info(f"   ✅ Nouveaux articles: {total_inserted}")
    logger.info(f"   ⏭️ Doublons ignorés: {total_skipped}")
    logger.info(f"   ❌ Erreurs: {total_errors}")
    logger.info("="*60)
    
    return total_inserted

if __name__ == "__main__":
    try:
        run_scraper()
    except KeyboardInterrupt:
        logger.info("\n⏹️ Scraping interrompu par l'utilisateur")
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")