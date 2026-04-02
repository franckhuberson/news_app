const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('📁 Fichier .env cherché à:', path.join(__dirname, '..', '.env'));
console.log('🔑 MONGODB_URI:', process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});

// VERSION CORRIGÉE - PAS DE next DANS LA FONCTION ASYNC
userSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  
  const self = this;
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(self.password, salt, function(err, hash) {
      if (err) return next(err);
      self.password = hash;
      next();
    });
  });
});

const User = mongoose.model('User', userSchema);

async function test() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI non définie dans le fichier .env');
    }
    
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté');

    // Supprimer l'utilisateur s'il existe déjà
    await User.deleteOne({ email: 'test@test.com' });
    
    const user = new User({
      name: 'Test',
      email: 'test@test.com',
      password: 'test123',
      role: 'admin'
    });

    await user.save();
    console.log('✅ Utilisateur créé:', user.email);
    
    // Vérifier le mot de passe
    const foundUser = await User.findOne({ email: 'test@test.com' }).select('+password');
    const isValid = await bcrypt.compare('test123', foundUser.password);
    console.log('✅ Mot de passe valide:', isValid);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

test();