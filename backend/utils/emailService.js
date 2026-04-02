const nodemailer = require('nodemailer');

// Configuration du transporteur Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'arthelp2024@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Générer un code aléatoire à 8 chiffres
const generateCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Envoyer un email avec le code de réinitialisation
const sendResetCodeEmail = async (email, code) => {
  const mailOptions = {
    from: '"Axio News" <arthelp2024@gmail.com>',
    to: email,
    subject: 'Code de réinitialisation - Axio News',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #FF4500;">Axio News</h1>
        </div>
        
        <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code ci-dessous :
        </p>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #FF4500;">${code}</span>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Ce code expire dans <strong>15 minutes</strong>.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${email} avec le code: ${code}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return false;
  }
};

// Envoyer un email avec le code de confirmation admin
const sendAdminCodeEmail = async (email, code) => {
  const mailOptions = {
    from: '"Axio News" <arthelp2024@gmail.com>',
    to: email,
    subject: 'Code de confirmation - Création administrateur',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #FF4500;">Axio News</h1>
        </div>
        
        <h2 style="color: #333;">Création d'un compte administrateur</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Vous avez demandé à créer un compte administrateur. Utilisez le code ci-dessous pour confirmer :
        </p>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #FF4500;">${code}</span>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Ce code expire dans <strong>15 minutes</strong>.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmation admin envoyé à ${email} avec le code: ${code}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email admin:', error);
    return false;
  }
};

module.exports = { sendResetCodeEmail, generateCode, sendAdminCodeEmail };