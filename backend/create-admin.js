const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer l'ancien
    await User.deleteOne({ email: 'admin@amaya.com' });
    
    // Créer le nouveau
    const hash = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Administrateur Principal',
      email: 'admin@amaya.com',
      password: hash,
      role: 'admin'
    });
    
    await admin.save();
    console.log('✅ Admin créé: admin@amaya.com / admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

createAdmin();