print("✅ Script de test exécuté avec succès")
print("Connexion à MongoDB...")

import pymongo
import os
from dotenv import load_dotenv

load_dotenv()
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/news_app")

try:
    client = pymongo.MongoClient(mongo_uri)
    client.admin.command('ping')
    print("✅ MongoDB connecté")
    
    # Compte les articles
    count = client.news_app.articles.count_documents({})
    print(f"📊 {count} articles dans la base")
    
except Exception as e:
    print(f"❌ Erreur MongoDB: {e}")

print("✅ Test terminé")