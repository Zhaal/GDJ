// Fonction de traduction EN → FR
exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { text } = JSON.parse(event.body);

        if (!text) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Text is required' })
            };
        }

        // Limiter à 2000 caractères (MyMemory a des limites)
        const textToTranslate = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

        console.log('[Translate] Texte à traduire:', textToTranslate.substring(0, 100) + '...');

        // Utiliser l'API MyMemory (gratuite et fiable)
        const maxChunkSize = 450;
        let translatedText = '';

        if (textToTranslate.length <= maxChunkSize) {
            // Texte court
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|fr`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();
            translatedText = data.responseData.translatedText;
        } else {
            // Texte long : découper en phrases
            const sentences = textToTranslate.match(/[^.!?]+[.!?]+/g) || [textToTranslate];
            const chunks = [];
            let currentChunk = '';

            for (const sentence of sentences) {
                if ((currentChunk + sentence).length <= maxChunkSize) {
                    currentChunk += sentence;
                } else {
                    if (currentChunk) chunks.push(currentChunk);
                    currentChunk = sentence;
                }
            }
            if (currentChunk) chunks.push(currentChunk);

            // Traduire chaque morceau
            for (let i = 0; i < chunks.length && i < 5; i++) {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunks[i])}&langpair=en|fr`;
                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    translatedText += data.responseData.translatedText + ' ';
                }

                // Délai entre requêtes
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

        console.log('[Translate] Traduction réussie');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                translatedText: translatedText.trim()
            })
        };

    } catch (error) {
        console.error('Translation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Translation failed',
                details: error.message
            })
        };
    }
};
