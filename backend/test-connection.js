const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env' });

console.log('🔑 URI =', process.env.MONGODB_URI ? 'DÉFINIE ✓' : 'NON DÉFINIE ✗');

// Options de connexion avancées
const options = {
    serverSelectionTimeoutMS: 5000, // 5 secondes au lieu de 30
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
    retryWrites: true,
    retryReads: true,
    connectTimeoutMS: 10000
};

async function test() {
    console.log('🔄 Connexion avec options avancées...');
    console.log('⏱️  Timeout réduit à 5s pour diagnostic\n');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log('✅ CONNECTÉ AVEC SUCCÈS !');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📚 Collections trouvées:', collections.map(c => c.name).join(', ') || 'aucune');
        
        await mongoose.connection.close();
        console.log('🔌 Connexion fermée');
        
    } catch (error) {
        console.error('❌ Erreur détaillée:');
        console.error('   Nom:', error.name);
        console.error('   Message:', error.message);
        
        if (error.message.includes('timed out')) {
            console.error('\n🔧 SOLUTION: Essaie de désactiver temporairement ton antivirus/firewall');
            console.error('   ou change de réseau (partage connexion téléphone)');
        }
    }
}

test();