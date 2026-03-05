# Auto-Post News Feature

Added an auto-posting feature that fetches the latest news from the BBC World RSS feed and uploads them as articles to the database.

## Implementation Details
- **RSS Source**: `http://feeds.bbci.co.uk/news/world/rss.xml`
- **Packages**: `rss-parser` for parsing the feed, `node-cron` for scheduling.
- **Schedule**: Runs immediately on startup and then every hour.
- **Files**:
  - `server/autoPost.ts`: Logic for fetching and posting.
  - `server/index.ts`: Initialization of the auto-post service.

## How it works
1. Fetches the latest 10 items from the RSS feed.
2. Checks if the article already exists in the database (by title).
3. If new, creates a new article with the 'World' category and 'system-bot' as the author.
