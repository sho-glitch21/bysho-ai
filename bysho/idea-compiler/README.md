# BYSHO // IDEA COMPILER

An experimental BYSHO prototype for turning rough ideas into structured things worth building.

> Ideas enter. Something real comes out.

## What it does

Give the compiler a messy idea. BYSHO's idea compiler uses an AI model to turn it into:

- the problem
- the useful data
- the important questions
- a smallest viable experiment
- a practical next build

This is **v0.1** and intentionally incomplete.

## Why it exists

The long-term BYSHO direction is to build tools that use AI, data and automation to make complicated things easier to understand and act on.

This prototype explores one small piece of that idea.

## Run locally

Requires Node.js 18+.

```bash
cd bysho/idea-compiler
npm install
OPENAI_API_KEY=your_key_here npm start
```

On Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="your_key_here"
npm start
```

Then open http://localhost:8787

If no API key is provided, the prototype runs in **demo mode** so the interface can still be explored.

## Architecture

```
idea
  ↓
BYSHO prompt
  ↓
AI model
  ↓
structured JSON
  ↓
BYSHO blueprint
```

The API key is server-side only.

## Status

**Prototype / v0.1**

Planned experiments:

- CSV/data upload
- evidence-aware idea analysis
- project memory
- model routing
- execution planning
- real BYSHO project generation

Built by **Shoaib Rahman** as part of **BYSHO**.
