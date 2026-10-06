# Medical-AI (NearestDoctor) – API

API Express/MongoDB : comptes patients et médecins, rendez-vous, dossiers médicaux, blog,
chatbots Dialogflow (symptômes et prise de rendez-vous) et paiement Stripe.

## Installation

```bash
npm install
cp .env.example .env   # puis remplir les valeurs
npm run dev            # ou npm start
```

`SECRET_KEY` et `ATLAS_URI` sont obligatoires : le serveur refuse de démarrer sans eux.
Dialogflow, Stripe, LinkedIn et l'envoi d'emails sont optionnels : sans configuration,
les routes concernées renvoient une erreur, mais le reste de l'API fonctionne.

## Authentification

Les routes protégées attendent le jeton renvoyé par `POST /api/auth/signin`
dans l'en-tête `x-access-token`.

| Accès | Routes |
|---|---|
| Public | `/api/auth/*`, lecture des blogs et produits, `/contacts/create-contact`, `/chatbot`, `/scrap` |
| Utilisateur connecté (ses propres données) | `/users/update-user/:id`, `/Appointments/*`, `/ChatApp/*`, `/records/:id` |
| Médecin ou admin | liste des dossiers médicaux, liste des patients, création de blog |
| Admin | liste et création d'utilisateurs, gestion des produits |

## Structure

```
server.js              point d'entrée (Express, connexion MongoDB, routes)
app/
  config/              auth (secrets lus dans .env), envoi d'emails
  controllers/         logique métier (auth, rendez-vous, chatbot, dossiers)
  middlewares/         authJwt (jeton, rôles), upload, gestion des erreurs
  models/              schémas Mongoose
  routes/              définition des routes
  services/            Dialogflow, scraping WebMD
  utils/               helpers HTTP et jetons
views/                 page de callback LinkedIn
public/                images uploadées (non versionnées)
```

## Notes pour le front

- Envoyer `x-access-token` sur toutes les routes protégées.
- LinkedIn : `/oauth` renvoie le jeton de connexion dans le message `postMessage` (champ `auth`).
- Mot de passe oublié : `POST /api/auth/forgot` envoie le lien, puis
  `POST /api/auth/reset-password` avec `{ token, password }`.
- Paiement : `POST /stripe` avec `{ source, productId, quantity }` (le prix est calculé côté serveur).
- Blogs : `PUT /blogs/like/:id` et `PUT /blogs/view/:id` pour les compteurs.
