const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Début du test');
console.log('🔑 URI:', process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

async function test() {
  console.log('1️⃣ Connexion...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('2️⃣ Connecté');
  
  console.log('3️⃣ Hashage...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  console.log('4️⃣ Hashé:', hashedPassword.substring(0, 20));
  
  console.log('5️⃣ Suppression...');
  await User.deleteOne({ email: 'admin@test.com' });
  
  console.log('6️⃣ Création...');
  const user = new User({
    name: 'Admin Test',
    email: 'admin@test.com',
    password: hashedPassword,
    role: 'admin'
  });
  await user.save();
  console.log('7️⃣ Créé');
  
  console.log('8️⃣ Vérification...');
  const found = await User.findOne({ email: 'admin@test.com' }).select('+password');
  const isValid = await bcrypt.compare('admin123', found.password);
  console.log('9️⃣ Résultat:', isValid);
  
  console.log('✅ TEST RÉUSSI');
  process.exit(0);
}

test().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});