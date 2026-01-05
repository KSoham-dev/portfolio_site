import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * GitHub Data Extractor
 * Fetches user's GitHub projects and converts them to portfolio data
 * 
 * Usage:
 * - Set GITHUB_USERNAME in .env
 * - Optional: Set GITHUB_TOKEN in .env for higher rate limits
 * - Run: node src/extractGitHubData.js
 */

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'your-username';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

// Configure axios instance
const githubApi = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
});

/**
 * Fetch user's repositories
 */
async function getUserRepos(username) {
  try {
    console.log(`\n📡 Fetching repositories for @${username}...`);
    
    const response = await githubApi.get(`/users/${username}/repos`, {
      params: {
        sort: 'updated',
        per_page: 100,
        type: 'owner',
      },
    });
    
    console.log(`✅ Found ${response.data.length} repositories`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching repos:', error.message);
    throw error;
  }
}

/**
 * Fetch README for a repository
 */
async function getRepoReadme(username, repoName) {
  try {
    const response = await githubApi.get(`/repos/${username}/${repoName}/readme`, {
      headers: {
        Accept: 'application/vnd.github.v3.raw',
      },
    });
    
    return response.data;
  } catch (error) {
    // README might not exist
    return null;
  }
}

/**
 * Convert repository data to portfolio item
 */
function convertRepoToPortfolioItem(repo, readme = null) {
  const languages = repo.language ? [repo.language] : [];
  
  // Extract key info from README if available
  let description = repo.description || 'Project without description';
  if (readme) {
    // Take first 500 chars of README as additional context
    const readmePreview = readme.substring(0, 500).replace(/^#+\s/gm, '');
    description = `${description}\n\nDetails from README:\n${readmePreview}`;
  }
  
  return {
    id: `github-${repo.id}`,
    title: repo.name,
    type: 'github-project',
    url: repo.html_url,
    stars: repo.stargazers_count,
    language: repo.language,
    languages: languages,
    topics: repo.topics || [],
    description: description,
    text: `
Project: ${repo.name}
Description: ${repo.description || 'No description'}
Language: ${repo.language || 'Unknown'}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}
Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}
Topics: ${(repo.topics || []).join(', ') || 'None'}
URL: ${repo.html_url}

${readme ? `README Preview:\n${readme.substring(0, 1000)}` : ''}
    `.trim(),
  };
}

/**
 * Extract all GitHub data
 */
async function extractGitHubData() {
  try {
    if (GITHUB_USERNAME === 'your-username') {
      console.error('❌ Please set GITHUB_USERNAME in .env file');
      console.error('   Example: GITHUB_USERNAME=octocat');
      process.exit(1);
    }

    // Fetch repositories
    const repos = await getUserRepos(GITHUB_USERNAME);
    
    // Filter out forks and archived repos (optional)
    const mainRepos = repos.filter(repo => !repo.fork && !repo.archived);
    console.log(`📦 ${mainRepos.length} active projects (excluding forks/archived)`);
    
    const portfolioItems = [];
    
    // Process each repository
    for (let i = 0; i < mainRepos.length; i++) {
      const repo = mainRepos[i];
      console.log(`\n⏳ Processing ${i + 1}/${mainRepos.length}: ${repo.name}`);
      
      try {
        // Fetch README if available
        const readme = await getRepoReadme(GITHUB_USERNAME, repo.name);
        
        // Convert to portfolio item
        const portfolioItem = convertRepoToPortfolioItem(repo, readme);
        portfolioItems.push(portfolioItem);
        
        console.log(`   ✅ Added: ${repo.name} (${repo.language || 'Unknown'} - ⭐ ${repo.stargazers_count})`);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`   ⚠️  Skipped: ${repo.name} (${error.message})`);
      }
    }
    
    console.log(`\n✅ Extracted ${portfolioItems.length} projects from GitHub`);
    
    return portfolioItems;
  } catch (error) {
    console.error('❌ Error extracting GitHub data:', error.message);
    throw error;
  }
}

/**
 * Filter repos by language (optional)
 */
function filterByLanguage(repos, language) {
  return repos.filter(repo => repo.language === language);
}

/**
 * Filter repos by stars (optional)
 */
function filterByStars(repos, minStars = 0) {
  return repos.filter(repo => repo.stars >= minStars);
}

/**
 * Sort by relevance (stars, recency, etc)
 */
function sortByRelevance(repos) {
  return repos.sort((a, b) => {
    // Sort by: stars (desc), then updated date (desc)
    if (b.stars !== a.stars) return b.stars - a.stars;
    return new Date(b.url) - new Date(a.url);
  });
}

export {
  extractGitHubData,
  getUserRepos,
  getRepoReadme,
  convertRepoToPortfolioItem,
  filterByLanguage,
  filterByStars,
  sortByRelevance,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const githubData = await extractGitHubData();
    
    console.log('\n' + '='.repeat(60));
    console.log('Sample extracted data:');
    console.log('='.repeat(60));
    
    // Show first 2 repos
    githubData.slice(0, 2).forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.title}`);
      console.log(`   Language: ${item.language}`);
      console.log(`   Stars: ${item.stars}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Text preview: ${item.text.substring(0, 100)}...`);
    });
    
    console.log('\n✅ GitHub data extraction complete!');
    console.log('💡 Next step: Update ingestData.js to include this GitHub data');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}
