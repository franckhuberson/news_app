#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de génération de résumés pour les articles déjà scrapés
Exécute les résumés sur les articles qui n'en ont pas encore
"""

import sys
import os
import time
import logging
from pymongo import MongoClient
from dotenv import load_dotenv
from newspaper import Article
from datetime import datetime

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Charger les variables d'environnement
load_dotenv()

def connect_to_mongodb():
    """Établit la connexion à MongoDB"""
    try:
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/news_app")
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        collection = db["articles"]
        
        # Test de connexion
        client.admin.command('ping')
        logger.info("✅ Connecté à MongoDB")
        return collection
    except Exception as e:
        logger.error(f"❌ Erreur de connexion MongoDB: {e}")
        sys.exit(1)

def get_articles_without_summary(collection, limit=50):
    """Récupère les articles sans résumé"""
    articles = list(collection.find({
        "$or": [
            {"summary": ""},
            {"summary": None},
            {"summary": {"$exists": False}}
        ]
    }).limit(limit))
    
    logger.info(f"📊 {len(articles)} articles sans résumé trouvés")
    return articles

def generate_summary(url, title):
    """Génère un résumé pour un article à partir de son URL"""
    try:
        article = Article(url, language="fr")
        article.download()
        article.parse()
        article.nlp()  # Génère le résumé
        
        return {
            "summary": article.summary,
            "keywords": article.keywords,
            "success": True
        }
    except Exception as e:
        logger.error(f"❌ Erreur pour {title}: {e}")
        return {
            "summary": "",
            "keywords": [],
            "success": False,
            "error": str(e)
        }

def update_article_summary(collection, article_id, summary_data):
    """Met à jour l'article avec son résumé"""
    try:
        result = collection.update_one(
            {"_id": article_id},
            {"$set": {
                "summary": summary_data["summary"],
                "metadata.keywords": summary_data["keywords"],
                "metadata.summarizedAt": datetime.utcnow()
            }}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"❌ Erreur mise à jour: {e}")
        return False

def main():
    """Fonction principale"""
    logger.info("="*60)
    logger.info("🚀 DÉMARRAGE DE LA GÉNÉRATION DES RÉSUMÉS")
    logger.info("="*60)
    
    # Connexion à MongoDB
    collection = connect_to_mongodb()
    
    # Récupérer les articles sans résumé
    articles = get_articles_without_summary(collection, limit=50)
    
    if not articles:
        logger.info("🎉 Tous les articles ont déjà un résumé !")
        return
    
    success_count = 0
    error_count = 0
    
    for i, article in enumerate(articles, 1):
        title = article.get("title", "Sans titre")[:50]
        url = article.get("sourceUrl")
        
        if not url:
            logger.warning(f"⚠️ Article {i}/{len(articles)}: Pas d'URL, ignoré")
            error_count += 1
            continue
        
        logger.info(f"\n[{i}/{len(articles)}] 📝 Traitement: {title}...")
        
        # Générer le résumé
        summary_data = generate_summary(url, title)
        
        if summary_data["success"]:
            # Mettre à jour dans MongoDB
            if update_article_summary(collection, article["_id"], summary_data):
                logger.info(f"   ✅ Résumé ajouté ({len(summary_data['summary'])} caractères)")
                success_count += 1
            else:
                logger.error(f"   ❌ Échec de la mise à jour")
                error_count += 1
        else:
            error_count += 1
        
        # Pause pour éviter de surcharger les serveurs
        time.sleep(1)
    
    # Rapport final
    logger.info("\n" + "="*60)
    logger.info("📊 RAPPORT FINAL")
    logger.info(f"   ✅ Résumés générés: {success_count}")
    logger.info(f"   ❌ Échecs: {error_count}")
    logger.info(f"   📈 Total traités: {len(articles)}")
    logger.info("="*60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n⏹️ Interruption utilisateur")
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")