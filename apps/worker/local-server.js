/**
 * Simple local HTTP server to run the worker logic locally
 * Because wrangler keeps crashing
 */

const http = require('http');
const fetch = require('node-fetch');

const PORT = 8787;
const REMOVE_BG_API_KEY = "JVtFYBFEBzByiVhbduGmiyAb";
const ALLOWED_ORIGIN = "http://localhost:3001";

function handleCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    handleCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url !== '/remove-background' || req.method !== 'POST') {
    handleCors(res);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    // Collect the entire request body
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const bodyBuffer = Buffer.concat(buffers);

    // Forward directly to remove.bg
    // Content-Type is already multipart/form-data from client
    const requestHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() === 'content-type') {
        requestHeaders['Content-Type'] = value;
      }
    }
    requestHeaders['X-Api-Key'] = REMOVE_BG_API_KEY;

    const fetchResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: requestHeaders,
      body: bodyBuffer,
    });

    // Set CORS
    handleCors(res);

    // Copy content type
    const contentType = fetchResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', 'image/png');
    }
    res.setHeader('Content-Disposition', 'attachment; filename="background-removed.png"');

    // Send status
    res.writeHead(fetchResponse.status);

    // Stream the response back to client
    fetchResponse.body.pipe(res);
  } catch (error) {
    console.error('Server error:', error);
    handleCors(res);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }));
  }
}).listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`   CORS allowed origin: ${ALLOWED_ORIGIN}`);
  console.log(`   API Key: ${REMOVE_BG_API_KEY.substring(0, 6)}...`);
});
