/**
 * /api/interpret — giải đoán lá số bằng Claude (do Linh tự bổ sung, không thuộc bản mã nguồn mở gốc).
 *
 * Giao thức khớp với ChatPanel / InsightPanel:
 *   POST { chart, messages: [{role, content}] }
 *   -> SSE: `data: {"delta":{"text":"..."}}\n\n` ... `data: [DONE]\n\n`
 *
 * Cấu hình (.env.local):
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   ANTHROPIC_MODEL=claude-sonnet-4-5   (tuỳ chọn)
 */
import Anthropic from '@anthropic-ai/sdk';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { chartToText } from '@/lib/ziwei/chart-to-text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 30;
const MAX_CHARS = 8000;

const SYSTEM_PROMPT = `Bạn là người giải đoán Tử Vi Đẩu Số theo hệ thống của thầy Nghê Hải Hạ (Thiên Kỷ). Bạn nhận dữ liệu lá số có cấu trúc và trả lời câu hỏi của người dùng.

Quy tắc:
- Luôn trả lời bằng TIẾNG VIỆT, văn phong rõ ràng, ấm áp, không phán quyết cực đoan.
- Tên sao, cung, cục dùng âm Hán-Việt quen thuộc (Tử Vi, Thiên Phủ, Tham Lang, Thất Sát, Mệnh, Quan Lộc, Tài Bạch...), lần đầu có thể kèm chữ Hán trong ngoặc.
- Chỉ dựa trên dữ liệu lá số được cung cấp (sao, cung, tứ hóa, đại hạn). Không bịa sao hay cung không có trong dữ liệu.
- Không bịa trích dẫn nguyên văn của thầy Nghê. Nếu nêu quan điểm của hệ thống này, diễn đạt lại bằng lời của mình và nói rõ là "theo hệ thống Nghê Hải Hạ".
- Tôn trọng cấu trúc (các mục in đậm) nếu yêu cầu của người dùng nêu rõ.
- Với sức khỏe, tài chính, pháp lý: chỉ nêu xu hướng mang tính tham khảo, không thay thế tư vấn chuyên môn.
- Kết thúc bằng gợi ý thực tế, cụ thể, có thể làm được.`;

function sse(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Chưa cấu hình ANTHROPIC_API_KEY trong .env.local' },
      { status: 500 },
    );
  }

  let body: { chart?: ZiweiChart; messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'JSON không hợp lệ' }, { status: 400 });
  }

  const { chart, messages } = body;
  if (!chart || !Array.isArray(chart.palaces) || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Thiếu chart hoặc messages' }, { status: 400 });
  }

  const apiMessages = messages
    .slice(-MAX_MESSAGES)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, MAX_CHARS),
    }));

  // Anthropic yêu cầu tin nhắn đầu là 'user'
  while (apiMessages.length > 0 && apiMessages[0].role !== 'user') apiMessages.shift();
  if (apiMessages.length === 0) {
    return Response.json({ error: 'Không có tin nhắn người dùng' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
  const system = `${SYSTEM_PROMPT}\n\n===== DỮ LIỆU LÁ SỐ =====\n${chartToText(chart)}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const upstream = await client.messages.create({
          model,
          max_tokens: 2500,
          system,
          messages: apiMessages,
          stream: true,
        });
        for await (const event of upstream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(sse({ delta: { text: event.delta.text } })));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Lỗi không xác định';
        controller.enqueue(encoder.encode(sse({ delta: { text: `\n\n[Lỗi khi gọi Claude: ${msg}]` } })));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
