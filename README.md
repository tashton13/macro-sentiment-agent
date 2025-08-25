# Macro Sentiment Agent

A **free** real-time macro-sentiment analysis agent that ingests market-relevant posts from **Twitter** and **Reddit**, performs sentiment analysis on key macro topics, and visualizes them as interactive sentiment bubbles.

![Demo Screenshot](https://via.placeholder.com/800x400?text=Macro+Sentiment+Bubbles)

## 🌟 Features

- **Real-time sentiment analysis** on 8 macro-economic topics
- **Interactive bubble visualization** - size represents volume, color represents sentiment
- **Dual data sources** - Twitter API v2 + Reddit JSON API with automatic fallback
- **Zero hosting cost** - GitHub Pages + GitHub Actions
- **Custom topic management** - Add/edit topics without touching code
- **Historical trending** - 24-hour sentiment trend charts
- **Mobile responsive** - Works on all devices

## 🚀 Live Demo

Visit the live demo: [https://tashton13.github.io/macro-sentiment-agent/](https://tashton13.github.io/macro-sentiment-agent/)

## 📊 Default Topics Tracked

1. **Inflation** - CPI, PPI, prices rising, consumer prices
2. **Interest Rates** - FOMC, Fed policy, Treasury yields
3. **Employment** - Jobs reports, unemployment, labor market
4. **Housing Market** - Home prices, real estate, mortgage rates
5. **Economic Growth** - GDP, recession, expansion
6. **Financial Markets** - Stock indices, market volatility
7. **Energy** - Oil prices, gas prices, energy costs
8. **Trade & Supply Chain** - Trade wars, tariffs, global trade

## 🛠️ Setup Instructions

### 1. Fork & Clone Repository

```bash
git clone https://github.com/tashton13/macro-sentiment-agent.git
cd macro-sentiment-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure GitHub Pages

1. Go to your repo **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. The site will be available at `https://tashton13.github.io/macro-sentiment-agent/`

### 4. Configure API Keys (Optional but Recommended)

#### Twitter API Setup (Optional)
1. Get Twitter API v2 Bearer Token from [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Add to **Repository Secrets**:
   - `TWITTER_BEARER_TOKEN` - Your Bearer Token
   - `TWITTER_API_KEY` - Your API Key  
   - `TWITTER_API_SECRET` - Your API Secret

#### Reddit API (No Setup Required)
Uses public JSON endpoints - no API key needed!

### 5. Enable GitHub Actions

The workflows will automatically:
- **Deploy**: Build and deploy to GitHub Pages on push to `main`
- **Ingest Data**: Fetch and analyze sentiment data every 5 minutes

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   GitHub Pages  │◄───│  Static SPA  │◄───│  Data Polling   │
│   (Hosting)     │    │  (React)     │    │  (60s interval) │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                     ▲
                              ┌─────────────────────┴─────────────────────┐
                              │                                           │
                    ┌─────────▼──────┐                        ┌─────────▼──────┐
                    │ GitHub Actions │                        │     Public     │
                    │ (Data Ingestion)│                        │    Data File   │
                    │ Runs every 5min │                        │sentiment.json  │
                    └─────────┬──────┘                        └────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │Twitter API│  │Reddit API │  │ Sentiment │
        │   (v2)    │  │ (JSON)    │  │ Analysis  │
        └───────────┘  └───────────┘  └───────────┘
```

## 🎯 How It Works

### Data Ingestion (Serverless)
1. **GitHub Actions** runs every 5 minutes (configurable)
2. **Node.js script** queries Twitter API v2 recent search + Reddit JSON endpoints
3. **VADER sentiment analysis** with macro-economic keyword weighting
4. **Results saved** to `/public/data/sentiment.json` and committed to repo

### Frontend (React SPA)
1. **Polls** `/data/sentiment.json` every 60 seconds
2. **Animates bubbles** when new data detected
3. **Interactive visualization** with detailed drill-down

### Sentiment Analysis
- **VADER** for base sentiment scoring
- **Macro context weighting** using economic keywords
- **Post aggregation** by topic with top examples
- **Historical trending** over 24-hour windows

## 🎨 Customization

### Adding New Topics

#### Method 1: Config File
Edit `src/config/topics.ts`:

```typescript
export const defaultTopics: TopicConfig[] = [
  // ... existing topics
  {
    id: "crypto",
    label: "Cryptocurrency",
    keywords: ["bitcoin", "crypto", "blockchain", "DeFi", "NFT"],
    color: "#f97316",
    description: "Cryptocurrency and blockchain sentiment"
  }
];
```

#### Method 2: Frontend UI (Coming Soon)
- Add **Topic Manager** component for live editing
- Persist custom topics to localStorage
- Sync with ingestion script

### Adjusting Update Intervals

**Frontend polling** (in App.tsx):
```typescript
const [pollingInterval, setPollingInterval] = useState(60000); // 1 minute
```

**GitHub Actions** (in `.github/workflows/ingest-sentiment.yml`):
```yaml
schedule:
  - cron: '*/5 * * * *'  # Every 5 minutes
```

## 📈 Performance & Costs

- **Hosting**: Free (GitHub Pages)
- **Compute**: Free (GitHub Actions - 2000 minutes/month)
- **Data Storage**: Free (Git repository)
- **API Costs**: 
  - Twitter API v2: $100/month for higher limits (optional)
  - Reddit API: Free (public endpoints)

**Estimated monthly costs: $0-100** depending on Twitter API usage.

## 🛡️ Rate Limits & Quotas

- **GitHub Actions**: 2000 minutes/month (free tier)
- **Twitter API v2**: 500k tweets/month (free tier)
- **Reddit API**: No limits on public JSON endpoints
- **GitHub Pages**: 100GB bandwidth/month

## 🔧 Development

### Local Development
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Run Data Ingestion Locally
```bash
# Set environment variables
export TWITTER_BEARER_TOKEN="your_token"
export UPDATE_INTERVAL="5"

# Run ingestion
npm run ingest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### No Data Showing
1. Check if GitHub Actions are enabled in your repository
2. Verify API keys are set in repository secrets
3. Check Actions tab for failed workflows
4. Review browser console for errors

### GitHub Actions Failing
1. Ensure repository permissions allow Actions to write
2. Check if secrets are properly configured
3. Review workflow logs in Actions tab

### Bubble Layout Issues
1. Try refreshing the page
2. Check browser console for JavaScript errors
3. Ensure container has sufficient height

## 🔗 Resources

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Reddit JSON API Guide](https://github.com/reddit-archive/reddit/wiki/JSON)
- [VADER Sentiment Analysis](https://github.com/cjhutto/vaderSentiment)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and GitHub Actions** 

Test Auto Upload