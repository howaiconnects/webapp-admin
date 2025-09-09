import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import { join } from 'path'

function getGitLogSinceYesterday() {
  // Get ISO date string for yesterday
  const yesterday = new Date(Date.now() - 86400000)
  const since = yesterday.toISOString()

  // Get git log since yesterday with pretty format
  const gitLog = execSync(
    `git log --since="${since}" --pretty=format:"- %h %s (%an)"`,
    { encoding: 'utf-8' }
  )
  return gitLog.trim()
}

function generateMarkdownContent(log: string) {
  const date = new Date().toISOString().slice(0, 10)
  return `# Project Status Update - ${date}

This file contains the project changes committed in the last 24 hours.

## Changes

${log || 'No commits in the last 24 hours.'}
`
}

function main() {
  const log = getGitLogSinceYesterday()
  const date = new Date().toISOString().slice(0, 10)
  const outputDir = join(process.cwd(), 'project-status')
  const outputPath = join(outputDir, \`\${date}.md\`)

  // Ensure output directory exists
  try {
    execSync(\`mkdir -p "\${outputDir}"\`)
  } catch {
    // ignore errors (directory may already exist)
  }

  const content = generateMarkdownContent(log)
  writeFileSync(outputPath, content, { encoding: 'utf-8' })

  console.log(\`Status update generated at \${outputPath}\`)
}

main()