require('dotenv').config({ 
    path: 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env' 
});

const mongoose = require('mongoose');
const Article = require('./models/Article');

async function testExistingDB() {
    console.log('🔍 Test de connexion à la base existante "newspulse"');
    console.log('==================================================');
    
    try {
        // Connexion à MongoDB (utilise ta variable MONGODB_URI)
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');
        
        // Vérifier que la base "newspulse" existe
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        const newspulseExists = dbs.databases.some(db => db.name === 'newspulse');
        console.log(`📊 Base "newspulse" existante: ${newspulseExists ? '✅ OUI' : '❌ NON'}`);
        
        if (!newspulseExists) {
            console.log('⚠️  La base "newspulse" n\'existe pas encore. Elle sera créée au premier insert.');
        }
        
        // Lister les collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📚 Collections disponibles:');
        collections.forEach(col => console.log(`   - ${col.name}`));
        
        // Compter les articles existants
        const count = await Article.countDocuments();
        console.log(`\n📝 Nombre d'articles dans la collection: ${count}`);
        
        // Afficher un échantillon (si des articles existent)
        if (count > 0) {
            const sample = await Article.findOne();
            console.log('\n🔬 Échantillon d\'un article existant:');
            console.log(`   ID: ${sample._id}`);
            console.log(`   Titre: ${sample.title}`);
            console.log(`   Statut: ${sample.status}`);
            console.log(`   Source: ${sample.source}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connexion fermée');
    }
}

testExistingDB();