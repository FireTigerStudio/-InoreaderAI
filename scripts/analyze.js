/**
 * Gemini AI Analysis Wrapper
 * 封装 Gemini API 新闻分析功能
 * 使用 curl 命令绕过 Node.js 网络问题
 */

import { execSync } from 'child_process';

/**
 * 分析单篇文章
 * @param {Object} article - 文章对象
 * @param {string} article.title - 文章标题
 * @param {string} article.source - 来源名称
 * @returns {Promise<{summary: string, score: number}>} 返回摘要和评分
 */
export async function analyzeWithGemini(article) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('错误: 未设置 GEMINI_API_KEY 环境变量');
      return { summary: '分析失败', score: 0 };
    }

    // 构建 Prompt
    const prompt = `你是新闻分析师。用一句话（30字内）总结这篇新闻，并评估重要性。

标题：${article.title}
来源：${article.source}

返回JSON格式：{"summary":"一句话摘要","score":3}
score范围1-5，5最重要。只返回JSON，不要其他内容。`;

    // 构建请求体
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 256
      }
    };

    // 转义 JSON 中的特殊字符
    const bodyJson = JSON.stringify(requestBody).replace(/'/g, "'\\''");

    // 使用 curl 调用 Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const curlCmd = `curl -s --max-time 30 -X POST '${url}' -H 'Content-Type: application/json' -d '${bodyJson}'`;

    const responseText = execSync(curlCmd, {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024
    });

    const response = JSON.parse(responseText);

    // 检查 API 错误
    if (response.error) {
      console.error('Gemini API 错误:', response.error.message);
      return { summary: '分析失败', score: 0 };
    }

    // 提取生成的文本
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      console.error('Gemini 未返回内容');
      return { summary: '分析失败', score: 0 };
    }

    // 解析 JSON 响应
    const parsed = parseGeminiResponse(text);
    console.log(`分析完成: "${article.title.slice(0, 30)}..." -> score:${parsed.score}`);
    return parsed;

  } catch (error) {
    console.error(`分析失败 [${article.title}]:`, error.message);
    return { summary: '分析失败', score: 0 };
  }
}

/**
 * 解析 Gemini 返回的 JSON 响应
 */
function parseGeminiResponse(text) {
  try {
    let jsonText = text.trim();

    // 移除 markdown 代码块
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    jsonText = jsonText.trim();
    const parsed = JSON.parse(jsonText);

    if (!parsed.summary || typeof parsed.score !== 'number') {
      throw new Error('JSON格式不正确');
    }

    return {
      summary: String(parsed.summary).slice(0, 100),
      score: Math.max(0, Math.min(5, Math.round(parsed.score)))
    };

  } catch (error) {
    // 尝试正则提取
    const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);
    const scoreMatch = text.match(/"score"\s*:\s*(\d+)/);

    if (summaryMatch && scoreMatch) {
      return {
        summary: summaryMatch[1].slice(0, 100),
        score: Math.max(0, Math.min(5, parseInt(scoreMatch[1])))
      };
    }

    return { summary: '分析失败', score: 0 };
  }
}
