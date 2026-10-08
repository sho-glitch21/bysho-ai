import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const publicDir = join(root, 'public')
const port = Number(process.env.PORT || 8787)
const model = process.env.OPENAI_MODEL || 'gpt-5-mini'

const systemPrompt = `You are FORGE, an experimental idea-to-execution engine created by Shoaib Rahman.

Your job is not to hype an idea. Make it clearer, smaller, more testable and more useful.

Return ONLY valid JSON with this exact shape:
{
  "problem": "one concise statement",
  "data": ["up to 5 useful data inputs"],
  "questions": ["up to 5 questions the system should investigate"],
  "mvp": "the smallest useful experiment",
  "nextBuild": ["3 concrete next steps"],
  "verdict": "YES | MAYBE | NOT_YET",
  "reason": "one or two sentences"
}

Be intelligent, practical and occasionally dry/funny, but never gimmicky.
If the idea is vague, make reasonable assumptions and state them through the problem/questions.
Do not claim that an imagined product already exists.`

const demoResult = {
  problem: 'People can mistake short-term weight fluctuations for a real fat-loss plateau.',
  data: ['body weight', '7-day weight average', 'calorie intake', 'daily steps', 'training and sleep'],
  questions: [
    'Did the 7-day trend actually stop moving?',
    'Did calorie intake or adherence change?',
    'Did activity, training or sleep change?',
    'How much of the change could be normal water fluctuation?'
  ],
  mvp: 'Build a 14-day plateau analyzer that compares weight trend, intake and activity before giving an explanation.',
  nextBuild: [
    'Accept a simple CSV export.',
    'Calculate trend and adherence signals.',
    'Generate an evidence-based explanation with an AI layer.'
  ],
  verdict: 'YES',
  reason: 'There is a real question hiding inside the idea, and the first experiment can be small enough to test.'
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

async function analyzeIdea(idea) {
  if (!process.env.OPENAI_API_KEY) return demoResult

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Turn this rough idea into a Forge blueprint:\n\n${idea}` }
      ],
      text: { format: { type: 'json_object' } }
    })
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 500)}`)
  }

  const data = await response.json()
  const text = data.output_text

  if (!text) throw new Error('The AI returned no structured result.')

  return JSON.parse(text)
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/analyze') {
      let body = ''
      for await (const chunk of req) body += chunk

      const { idea } = JSON.parse(body || '{}')

      if (!idea || idea.trim().length < 8) {
        return sendJson(res, 400, { error: 'Give the Forge a little more to work with.' })
      }

      const result = await analyzeIdea(idea.trim())
      return sendJson(res, 200, result)
    }

    const requested = req.url === '/' ? '/index.html' : req.url
    const safePath = requested.replace(/\\/g, '/').replace(/^\/+/, '')
    const filePath = join(publicDir, safePath)

    if (!filePath.startsWith(publicDir)) {
      return sendJson(res, 403, { error: 'Forbidden.' })
    }

    const content = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' })
    res.end(content)
  } catch (error) {
    console.error(error)
    if (!res.headersSent) sendJson(res, 500, { error: error.message || 'Forge error.' })
  }
})

server.listen(port, () => {
  console.log(`FORGE // IDEA COMPILER listening on http://localhost:${port}`)
  console.log(process.env.OPENAI_API_KEY ? 'AI mode: ON' : 'AI mode: DEMO')
})
