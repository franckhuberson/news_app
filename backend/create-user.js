const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date
});

// Pas besoin de bcrypt pour ce script simple, on va utiliser l'API directement
const User = mongoose.model('User', userSchema);

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'utilisateur existe déjà
    const existing = await User.findOne({ email: 'admin@test.com' });
    if (existing) {
      console.log('👤 L\'utilisateur admin@test.com existe déjà');
      console.log('   Tu peux te connecter avec le mot de passe: admin123');
      process.exit(0);
    }

    // Créer l'utilisateur via l'API (plus simple)
    const fetch = await import('node-fetch').catch(() => null);
    
    if (fetch) {
      const response = await fetch.default('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Admin',
          email: 'admin@test.com',
          password: 'admin123'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('✅ Utilisateur admin créé avec succès via API');
        console.log('   Email: admin@test.com');
        console.log('   Mot de passe: admin123');
      } else {
        console.log('❌ Erreur:', data.message);
      }
    } else {
      // Fallback: insertion directe (mais le mot de passe ne sera pas hashé)
      const user = new User({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'admin123', // ⚠️ Non hashé, à utiliser seulement pour test
        role: 'admin',
        createdAt: new Date()
      });
      await user.save();
      console.log('✅ Utilisateur admin créé (attention: mot de passe non hashé)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createUser();