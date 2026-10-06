require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const config = require('./app/config/auth.config');
const db = require('./app/models');
const errorHandler = require('./app/middlewares/errorHandler');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
// FRONTEND_URL peut contenir plusieurs origines séparées par des virgules.
app.use(cors({ origin: config.frontendUrl.split(',').map((origin) => origin.trim()) }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// simple route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Chiabi application.' });
});

// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
app.use('/blogs', require('./app/routes/blog.routes'));
app.use('/products', require('./app/routes/product.route'));
app.use('/users', require('./app/routes/users.routes'));
app.use('/Appointments', require('./app/routes/AppRoutes'));
app.use('/records', require('./app/routes/Record'));
app.use('/ChatApp', require('./app/routes/ChatAppRoutes'));
app.use('/oauth', require('./app/routes/oauth.routes'));
app.use('/contacts', require('./app/routes/contact.routes'));
app.use('/stripe', require('./app/routes/payment.routes'));
app.use('/scrap', require('./app/routes/scrap.routes'));
app.use('/chatbot', require('./app/routes/chatbot.routes'));

// Build du front React, s'il est présent à côté du projet
const reactBuild = path.resolve(__dirname, '../react-app/build');
if (fs.existsSync(reactBuild)) {
    app.use(express.static(reactBuild));
    app.get('*', (req, res) => res.sendFile(path.join(reactBuild, 'index.html')));
}

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

// Crée les rôles de base s'ils n'existent pas encore.
async function initRoles() {
    for (const name of db.ROLES) {
        await db.role.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    }
}

async function start() {
    if (!process.env.ATLAS_URI) {
        throw new Error('ATLAS_URI manquant : définissez-le dans le fichier .env (voir .env.example)');
    }
    await mongoose.connect(process.env.ATLAS_URI);
    console.log('Successfully connect to MongoDB.');
    await initRoles();

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });
}

start().catch((err) => {
    console.error('Échec du démarrage :', err.message);
    process.exit(1);
});
