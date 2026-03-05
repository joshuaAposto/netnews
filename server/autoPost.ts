import Parser from 'rss-parser';
import { storage } from './storage';
import cron from 'node-cron';
import axios from 'axios';
import { parse } from 'node-html-parser';

const parser = new Parser();
const BBC_FEED_URL = 'http://feeds.bbci.co.uk/news/world/rss.xml';

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

async function scrapeArticle(url: string) {
  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    const root = parse(response.data);

    // Get Meta Image (og:image)
    const metaImg = root.querySelector('meta[property="og:image"]');
    const imageUrl = metaImg ? metaImg.getAttribute('content') : null;

    // Get Content from <article> paragraphs
    const articleTag = root.querySelector('article');
    let content = "";
    if (articleTag) {
      const paragraphs = articleTag.querySelectorAll('p');
      content = paragraphs.map(p => p.text.trim()).filter(t => t.length > 0).join('\n\n');
    }

    return { imageUrl, content };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return { imageUrl: null, content: "" };
  }
}

export async function fetchAndPostNews() {
  console.log('Fetching and scraping latest news from BBC...');
  try {
    const feed = await parser.parseURL(BBC_FEED_URL);
    const latestArticles = feed.items.slice(0, 10);

    for (const item of latestArticles) {
      if (!item.link || !item.title) continue;

      // Check if article already exists by title
      const existing = await storage.getArticles({ search: item.title });
      const alreadyExists = existing.some(a => a.title === item.title);

      if (!alreadyExists) {
        console.log(`Scraping and posting: ${item.title}`);
        
        const scrapedData = await scrapeArticle(item.link);
        
        // Use snippet if scraping failed to get content
        const finalContent = scrapedData.content || item.contentSnippet || item.content || 'No content available';
        const finalImageUrl = scrapedData.imageUrl || null;

        await storage.createArticle({
          title: item.title,
          content: finalContent,
          category: 'World',
          imageUrl: finalImageUrl,
          videoUrl: null,
          isFeatured: true,
          authorId: 'system-bot',
          sourceUrl: item.link,
          sourceName: 'BBC News',
        });

        // Small delay to avoid being blocked
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('Error in auto-post service:', error);
  }
}

export function initAutoPost() {
  // Initial fetch
  fetchAndPostNews();
  
  // Schedule: Every hour
  cron.schedule('0 * * * *', () => {
    fetchAndPostNews();
  });
  
  console.log('Advanced Auto-post (Scraper) service initialized (Hourly)');
}
