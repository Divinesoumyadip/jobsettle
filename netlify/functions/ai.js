// Netlify Function — Claude AI Proxy
// File location: netlify/functions/ai.js
//
// Set CLAUDE_API_KEY in: Netlify dashboard → Site settings →
// Environment variables. Never put the key in client-side code.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  if (!process.env.CLAUDE_API_KEY) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Server misconfigured: CLAUDE_API_KEY is not set in Netlify environment variables.' })
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    const text = await response.text()
    // Pass through Anthropic's real status so the client can detect failures
    return {
      statusCode: response.status,
      headers: CORS,
      body: text
    }
  } catch (e) {
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Upstream request failed: ' + e.message })
    }
  }
}
