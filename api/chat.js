// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许 POST 请求' });
  }

  const APP_ID = process.env.APP_ID || 'f320465c37b9479e965735a4a44956ac';
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

  if (!DASHSCOPE_API_KEY) {
    console.error('❌ 错误：未设置 DASHSCOPE_API_KEY 环境变量！');
    return res.status(500).json({ error: '服务器配置错误' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt 参数' });
    }

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

    if (response.ok) {
      let aiResponse = data.output?.text || 'AI 未返回有效内容';
      aiResponse = aiResponse
        .split('\n')
        .filter(line => !line.trim().match(/^\[\d+\]/))
        .join('\n')
        .trim()
        .replace(/\s*\[\d+\]\s*/g, ' ');

      return res.status(200).json({ text: aiResponse });
    } else {
      console.error('阿里云 API 错误:', data);
      return res.status(response.status).json({ 
        error: `AI 服务错误: ${data.message || '未知错误'}`
      });
    }
  } catch (error) {
    console.error('服务器内部错误:', error);
    return res.status(500).json({ error: '服务暂时不可用，请稍后再试' });
  }
}
