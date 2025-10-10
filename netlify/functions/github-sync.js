const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Autoriser CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_REPO = process.env.GITHUB_REPO || 'GDJ';
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN || !GITHUB_OWNER) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Configuration GitHub manquante dans Netlify' })
    };
  }

  const filePath = 'data/data.json';
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  try {
    // GET - Récupérer les données
    if (event.httpMethod === 'GET') {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

        return {
          statusCode: 200,
          headers,
          body: content
        };
      } else if (response.status === 404) {
        // Fichier n'existe pas encore, retourner structure vide
        const emptyData = {
          produits: [],
          membres: [],
          transactions: [],
          settings: {
            lastProductId: 0,
            lastMembreId: 0,
            lastTransactionId: 0
          }
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(emptyData)
        };
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    }

    // PUT - Mettre à jour les données
    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      // Récupérer le SHA du fichier actuel
      let sha = null;
      const getResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }

      // Mettre à jour le fichier
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      const updateResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Mise à jour des données - ${new Date().toLocaleString()}`,
          content: content,
          sha: sha,
          branch: GITHUB_BRANCH
        })
      });

      if (updateResponse.ok) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Données synchronisées' })
        };
      } else {
        const errorText = await updateResponse.text();
        throw new Error(`Erreur de mise à jour: ${errorText}`);
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    };

  } catch (error) {
    console.error('Erreur complète:', error);
    const errorMessage = error.message || error.toString() || 'Erreur inconnue lors de la synchronisation';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        details: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'Pas de détails disponibles'
      })
    };
  }
};
