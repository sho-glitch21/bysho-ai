const idea = document.querySelector('#idea')
const compile = document.querySelector('#compile')
const status = document.querySelector('#status')
const result = document.querySelector('#result')

const setList = (selector, items, ordered = false) => {
  const list = document.querySelector(selector)
  list.innerHTML = ''
  for (const item of items || []) {
    const li = document.createElement('li')
    li.textContent = item
    list.appendChild(li)
  }
  if (ordered) list.type = '1'
}

compile.addEventListener('click', async () => {
  if (!idea.value.trim()) {
    status.textContent = 'BYSHO SAYS: ADD AN IDEA FIRST.'
    idea.focus()
    return
  }

  compile.disabled = true
  result.classList.add('hidden')
  status.textContent = 'BYSHO IS THINKING...'

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: idea.value })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Idea compiler failed.')

    document.querySelector('#verdict').textContent = data.verdict || 'MAYBE'
    document.querySelector('#problem').textContent = data.problem || ''
    document.querySelector('#mvp').textContent = data.mvp || ''
    document.querySelector('#reason').textContent = data.reason || ''
    setList('#data', data.data)
    setList('#questions', data.questions)
    setList('#nextBuild', data.nextBuild, true)

    result.classList.remove('hidden')
    status.textContent = 'BYSHO COMPLETE.'
  } catch (error) {
    status.textContent = `IDEA COMPILER ERROR: ${error.message}`
  } finally {
    compile.disabled = false
  }
})
