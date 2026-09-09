import express from 'express';
import cors from 'cors';
import * as DDG from 'duck-duck-scrape';

const app = express();
const port = 3001;

// 启用 CORS，允许前端访问
app.use(cors());
app.use(express.json());

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的搜索函数
async function searchWithRetry(query, maxRetries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试搜索 "${query}" (第 ${attempt}/${maxRetries} 次)...`);
      
      // 每次重试前等待一段时间，避免被反爬虫机制拦截
      if (attempt > 1) {
        await delay(delayMs * attempt); // 递增延迟
      }
      
      const searchResults = await DDG.search(query, {
        safeSearch: DDG.SafeSearchType.MODERATE,
      });
      
      console.log(`搜索成功: "${query}"`);
      return searchResults;
    } catch (error) {
      console.error(`第 ${attempt} 次尝试失败:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`搜索失败，已重试 ${maxRetries} 次: ${error.message}`);
      }
    }
  }
}

// 搜索接口
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: '缺少搜索查询参数 q' });
  }

  try {
    const searchResults = await searchWithRetry(query);
    res.json(searchResults);
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ 
      error: '搜索失败: ' + error.message,
      suggestion: 'DuckDuckGo 可能暂时阻止了请求，请稍后再试或使用其他搜索服务'
    });
  }
});

app.listen(port, () => {
  console.log(`后端服务器运行在 http://localhost:${port}`);
});
