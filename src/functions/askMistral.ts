import { BotConfig } from "../types";
const config = require("../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { API_KEY } = config;

export async function askMistral(prompt: string) {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'open-mistral-nemo',
            max_tokens: 150, // réponse courte = moins de tokens en sortie
            temperature: 0.5, // réponses plus directes, moins de "bla-bla" créatif
            messages: [
                {
                    role: 'system',
                    content: 'Réponds de façon brève et concise, en 2-3 phrases maximum. Va droit au but, sans reformulation inutile.'
                },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erreur API Mistral (${response.status}) : ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}