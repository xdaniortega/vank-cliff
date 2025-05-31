/** @type {import('next').NextConfig} */

// Get the repository name from the environment or use a default
const isGithubActions = process.env.GITHUB_ACTIONS || false
const repo = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, '') || 'vank-cliff'
const assetPrefix = isGithubActions ? `/${repo}/` : ''
const basePath = isGithubActions ? `/${repo}` : ''

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configure for GitHub Pages deployment
  basePath: basePath,
  assetPrefix: assetPrefix,
}

module.exports = nextConfig 