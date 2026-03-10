// Charger les variables d'environnement
require('dotenv').config({ 
    path: 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env' 
});

const mongoose = require('mongoose');
const Article = require('./models/Article');

console.log('🧪 Test du modèle Article...');

async function testModel() {
    try {
        // Connexion à MongoDB
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Créer un article de test
        const testArticle = new Article({
            title: 'Test Article ' + new Date().toLocaleTimeString(),
            originalContent: 'Ceci est un contenu de test pour vérifier que le modèle fonctionne correctement.',
            summary: 'Résumé de test',
            source: 'Le Monde',
            sourceUrl: 'https://test.com/article-' + Date.now(),
            imageUrl: 'https://test.com/image.jpg',
            metadata: {
                authors: ['Testeur'],
                keywords: ['test', 'mongodb']
            }
        });

        // Sauvegarder
        console.log('📝 Sauvegarde de l\'article de test...');
        const saved = await testArticle.save();
        console.log('✅ Article sauvegardé avec ID:', saved._id);

        // Lire l'article
        console.log('🔍 Lecture de l\'article...');
        const found = await Article.findById(saved._id);
        console.log('✅ Article trouvé:', found.title);

        // Tester la méthode publish
        console.log('📤 Test de publication...');
        await found.publish();
        console.log('✅ Statut après publication:', found.status);

        // Compter les articles par statut
        console.log('📊 Statistiques:');
        const stats = await Article.countByStatus();
        console.log(stats);

        // Nettoyer
        console.log('🧹 Nettoyage...');
        await Article.findByIdAndDelete(saved._id);
        console.log('✅ Article de test supprimé');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        // Fermer la connexion
        await mongoose.connection.close();
        console.log('🔌 Connexion fermée');
    }
}

testModel();