const express = require('express');
const app = express();
const PORT = 3000;

// 从环境变量读取敏感信息（安全！）
const APP_ID = process.env.APP_ID || 'f320465c37b9479e965735a4a44956ac';
const DASHSCOPE_API_KEY = 'sk-6e6286b1c442460e81e810ff337e9997';

if (!DASHSCOPE_API_KEY) {
  console.error('❌ 错误：未设置 DASHSCOPE_API_KEY 环境变量！');
  process.exit(1);
}

app.use(express.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/question.html');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // 调用阿里云 API
    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: { prompt },
          parameters: {},
          debug: {}
        })
      }
    );

    const data = await response.json();

    // 关键修复：正确解析响应结构
    if (response.ok) {
      let aiResponse = data.output?.text || 'AI 未返回有效内容';

        aiResponse = aiResponse
        .split('\n')
        .filter(line => !line.trim().match(/^\[\d+\]/)) // 过滤掉以 [1], [2] 等开头的行
        .join('\n')
        .trim();

        // 可选：进一步清理行内残留的 [1] 标记（如果出现在段落中）
        aiResponse = aiResponse.replace(/\s*\[\d+\]\s*/g, ' ');
      res.json({ text: aiResponse });
    } else {
      // 处理 API 错误（如 401, 400）
      console.error('阿里云 API 错误:', data);
      res.status(response.status).json({ 
        error: `AI 服务错误: ${data.message || '未知错误'}`
      });
    }
  } catch (error) {
    console.error('服务器内部错误:', error);
    res.status(500).json({ error: '服务暂时不可用，请稍后再试' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 服务已启动：http://localhost:${PORT}`);
});
