const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Page d'accueil
app.get('/', (req, res) => {
    res.send('<h1>Jacob</h1>');
});

// Connexion MongoDB
mongoose.connect('mongodb+srv://missimahoujacob:fQz6cFw4TU55nWWJ@cluster0.6gfegwu.mongodb.net/', {
    dbName: 'gestionPanneau'
})
.then(() => console.log('✅ Connecté à MongoDB'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Schéma de message
const messageSchema = new mongoose.Schema({
    text: String,
    font: { type: String, default: 'Arial' },
    size: { type: String, default: 'medium' },
    source: { type: String, required: true }, // Pour savoir d'où vient le message
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Middleware pour sauvegarder tous les messages
const saveMessage = async (text, source, font = 'Arial', size = 'medium') => {
    try {
        // Supprime les anciens messages
        await Message.deleteMany();
        
        // Sauvegarde le nouveau message
        const nouveauMessage = new Message({ 
            text, 
            font,
            size,
            source
        });
        await nouveauMessage.save();
        
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        return false;
    }
};

// Route POST : Sauvegarde du message avec style
app.post('/api/saisis-message', async (req, res) => {
    try {
        const { message, font, size } = req.body;

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Le message est requis' 
            });
        }

        const saved = await saveMessage(message, 'saisis-message', font, size);

        if (saved) {
            res.json({ 
                success: true,
                message: 'Message enregistré avec succès'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Erreur sauvegarde' 
            });
        }
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur' 
        });
    }
});

// Route POST simple pour message sans style
app.post('/api/choix-message', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Le message est requis' 
            });
        }

        const saved = await saveMessage(message, 'choix-message');

        if (saved) {
            res.json({ 
                success: true,
                message: 'Message enregistré avec succès'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Erreur sauvegarde' 
            });
        }
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur' 
        });
    }
});

// Route GET : Récupération du dernier message
app.get('/api/recuperer-message', async (req, res) => {
    try {
        const message = await Message.findOne().sort({ createdAt: -1 });

        if (!message) {
            return res.json({ 
                success: true,
                message: null 
            });
        }

        res.json({
            success: true,
            message: {
                text: message.text,
                font: message.font,
                size: message.size,
                source: message.source
            }
        });
    } catch (error) {
        console.error('Erreur récupération:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur' 
        });
    }
});

// Endpoint pour l'ESP32 - Retourne seulement le texte
app.get('/api/dernier-message', async (req, res) => {
    try {
        const message = await Message.findOne().sort({ createdAt: -1 });

        if (!message) {
            return res.json({ 
                success: true,
                message: null 
            });
        }

        res.json({
            success: true,
            message: message.text
        });
    } catch (error) {
        console.error('Erreur récupération:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur' 
        });
    }
});


let dernierRCWL = null;  // 🔴 Une seule variable, plus de tableau

// POST : reçoit une valeur RCWL
app.post('/api/rcwl', (req, res) => {
  const { etat } = req.body;
  if (etat === undefined) {
    return res.status(400).json({ success: false, error: "Valeur RCWL manquante" });
  }

  const timestamp = new Date().toLocaleTimeString();
  dernierRCWL = { value: parseInt(etat), time: timestamp };

  console.log("📩 RCWL reçu :", dernierRCWL);
  res.json({ success: true, received: etat });
});

// GET : renvoie juste la dernière valeur reçue
app.get('/api/rcwl', (req, res) => {
  if (!dernierRCWL) {
    return res.json({ success: true, data: null });
  }
  res.json({ success: true, data: dernierRCWL });
});



// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});



