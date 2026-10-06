const crypto = require("crypto");
const dialogflow = require("@google-cloud/dialogflow");

// Les identifiants sont lus dans les variables d'environnement <prefix>_PROJECT_ID,
// <prefix>_CLIENT_EMAIL et <prefix>_PRIVATE_KEY (jamais dans le code).
// Le client est créé au premier appel : le serveur démarre même si Dialogflow n'est pas configuré.
function createAgent(prefix) {
  let client;

  return async function detectIntent(sessionId, text) {
    const projectId = process.env[`${prefix}_PROJECT_ID`];
    const clientEmail = process.env[`${prefix}_CLIENT_EMAIL`];
    const privateKey = (process.env[`${prefix}_PRIVATE_KEY`] || "").replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(`Dialogflow non configuré : variables ${prefix}_* manquantes dans .env`);
    }

    client ??= new dialogflow.SessionsClient({
      projectId,
      credentials: { client_email: clientEmail, private_key: privateKey },
    });

    // Une session par utilisateur : sinon tous les utilisateurs partagent le même contexte.
    // Dialogflow limite l'identifiant de session à 36 caractères.
    const session = crypto.createHash("sha256").update(String(sessionId)).digest("hex").slice(0, 36);

    const [response] = await client.detectIntent({
      session: client.projectAgentSessionPath(projectId, session),
      queryInput: {
        text: {
          text: String(text),
          languageCode: process.env.DIALOGFLOW_LANGUAGE_CODE || "en-US",
        },
      },
    });
    return response.queryResult;
  };
}

module.exports = {
  // Chatbot de symptômes (route publique /chatbot)
  symptomChatbot: createAgent("SYMPTOM_DIALOGFLOW"),
  // Chatbot de prise de rendez-vous (/ChatApp)
  appointmentChatbot: createAgent("APPOINTMENT_DIALOGFLOW"),
};
