// api/chat.js
import { NextResponse } from 'next/server';

const APP_ID = process.env.APP_ID || 'f320465c37b9479e965735a4a44956ac';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

if (!DASHSCOPE_API_KEY) {
  console.error('❌ 错误：未设置 DASHSCOPE_API_KEY 环境变量！');
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '缺少 prompt 参数' }, { status: 400 });
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

      // 清理引用标记 [1], [2]...
      aiResponse = aiResponse
        .split('\n')
        .filter(line => !line.trim().match(/^\[\d+\]/))
        .join('\n')
        .trim()
        .replace(/\s*\[\d+\]\s*/g, ' ');

      return NextResponse.json({ text: aiResponse });
    } else {
      console.error('阿里云 API 错误:', data);
      return NextResponse.json(
        { error: `AI 服务错误: ${data.message || '未知错误'}` },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('服务器内部错误:', error);
    return NextResponse.json(
      { error: '服务暂时不可用，请稍后再试' },
      { status: 500 }
    );
  }
}
