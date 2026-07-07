const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync("admin123", salt);
console.log("🔐 Hash pour 'admin123':", hash);
console.log("📝 Commande à copier dans MongoDB:");
console.log(`db.users.insertOne({
  name: "Admin",
  email: "admin@test.com",
  password: "${hash}",
  role: "admin",
  createdAt: new Date()
})`);