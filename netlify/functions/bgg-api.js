// Netlify Function pour interroger l'API BoardGameGeek
// Évite les problèmes CORS en faisant les requêtes côté serveur

const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');

exports.handler = async (event, context) => {
  // Autoriser CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { action, query, id } = event.queryStringParameters || {};

    if (!action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Action requise' })
      };
    }

    let result;

    switch (action) {
      case 'search':
        result = await searchGames(query);
        break;

      case 'details':
        result = await getGameDetails(id);
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Action inconnue' })
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Erreur BGG API:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur lors de la requête à BoardGameGeek',
        message: error.message
      })
    };
  }
};

// Rechercher des jeux sur BGG
async function searchGames(query) {
  if (!query) {
    throw new Error('Query manquante');
  }

  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;

  const response = await fetch(url);
  const xml = await response.text();

  // Parser le XML en JSON
  const result = await parseStringPromise(xml);

  if (!result.items || !result.items.item) {
    return { games: [] };
  }

  const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];

  const games = items.map(item => ({
    id: item.$.id,
    name: item.name && item.name[0] ? item.name[0].$.value : 'Sans nom',
    yearPublished: item.yearpublished ? item.yearpublished[0].$.value : null
  }));

  return { games };
}

// Obtenir les détails d'un jeu
async function getGameDetails(id) {
  if (!id) {
    throw new Error('ID manquant');
  }

  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`;

  const response = await fetch(url);
  const xml = await response.text();

  // Parser le XML en JSON
  const result = await parseStringPromise(xml);

  if (!result.items || !result.items.item || result.items.item.length === 0) {
    throw new Error('Jeu non trouvé');
  }

  const item = result.items.item[0];

  // Extraire les informations
  const game = {
    id: item.$.id,
    name: extractValue(item.name, 'primary'),
    image: item.image ? item.image[0] : null,
    thumbnail: item.thumbnail ? item.thumbnail[0] : null,
    description: item.description ? item.description[0] : null,
    yearPublished: item.yearpublished ? item.yearpublished[0].$.value : null,
    minPlayers: item.minplayers ? item.minplayers[0].$.value : null,
    maxPlayers: item.maxplayers ? item.maxplayers[0].$.value : null,
    playingTime: item.playingtime ? item.playingtime[0].$.value : null,
    minPlayTime: item.minplaytime ? item.minplaytime[0].$.value : null,
    maxPlayTime: item.maxplaytime ? item.maxplaytime[0].$.value : null,
    minAge: item.minage ? item.minage[0].$.value : null,
    categories: extractLinks(item.link, 'boardgamecategory'),
    mechanics: extractLinks(item.link, 'boardgamemechanic'),
    designers: extractLinks(item.link, 'boardgamedesigner'),
    artists: extractLinks(item.link, 'boardgameartist'),
    publishers: extractLinks(item.link, 'boardgamepublisher'),
    rating: item.statistics && item.statistics[0].ratings
      ? {
          average: item.statistics[0].ratings[0].average[0].$.value,
          bayesAverage: item.statistics[0].ratings[0].bayesaverage[0].$.value,
          usersRated: item.statistics[0].ratings[0].usersrated[0].$.value,
          rank: extractRank(item.statistics[0].ratings[0].ranks)
        }
      : null
  };

  return { game };
}

// Extraire une valeur avec type
function extractValue(array, type) {
  if (!array || array.length === 0) return null;

  if (type) {
    const item = array.find(a => a.$.type === type);
    return item ? item.$.value : (array[0].$.value || null);
  }

  return array[0].$.value || null;
}

// Extraire les liens d'un certain type
function extractLinks(links, type) {
  if (!links || links.length === 0) return [];

  return links
    .filter(link => link.$.type === type)
    .map(link => ({
      id: link.$.id,
      name: link.$.value
    }));
}

// Extraire le rang
function extractRank(ranks) {
  if (!ranks || !ranks[0].rank) return null;

  const boardGameRank = ranks[0].rank.find(r => r.$.id === '1');

  if (!boardGameRank) return null;

  return {
    value: boardGameRank.$.value === 'Not Ranked' ? null : boardGameRank.$.value,
    name: boardGameRank.$.name
  };
}
