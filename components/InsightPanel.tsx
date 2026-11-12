'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { viStar, viPalace, viSiHua } from '@/lib/ziwei/vi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: 'Mệnh cách' },
  { key: 'love',        label: 'Tình duyên' },
  { key: 'career',      label: 'Sự nghiệp' },
  { key: 'wealth',      label: 'Tài lộc' },
  { key: 'health',      label: 'Sức khỏe' },
  { key: 'personality', label: 'Tính cách' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Hãy lập bản tổng quan mệnh cách, trình bày theo cấu trúc sau:

**【Định tính mệnh cách】**
Một câu tóm tắt cách cục cốt lõi và khí chất của chủ mệnh.

**【Giải đọc chính tinh】**
Đặc điểm cốt lõi của chính tinh cung Mệnh theo hệ thống Nghê Hải Hạ.

**【Tam phương tứ chính】**
Liên động giữa các cung Tài Bạch, Quan Lộc, Thiên Di và cách cục chung.

**【Đại hạn hiện tại】**
Hướng vận của đại hạn đang đi và những việc đáng chú ý nhất.

**【Ưu thế và điều cần lưu ý】**
Thiên phú của lá số, cùng rủi ro hoặc bài học cần chú ý.`,

  love: `Hãy phân tích sâu về tình duyên hôn nhân, trình bày theo cấu trúc sau:

**【Cách cục tình cảm】**
Một câu định tính mệnh cách tình cảm.

**【Phân tích cung Phu Thê】**
Chính tinh, tứ hóa của cung Phu Thê và cách giải đọc theo hệ thống Nghê Hải Hạ.

**【Liên động tam phương】**
Ảnh hưởng của các cung liên quan đến tình cảm.

**【Vận tình cảm đại hạn hiện tại】**
Xu hướng tình cảm trong 10 năm đang đi và các mốc quan trọng.

**【Gợi ý thực tế】**
Những lời khuyên cụ thể, làm được trong chuyện tình cảm.`,

  career: `Hãy phân tích sâu về sự nghiệp, trình bày theo cấu trúc sau:

**【Cách cục sự nghiệp】**
Một câu định tính, hợp làm công ăn lương hay tự lập nghiệp.

**【Phân tích cung Quan Lộc】**
Chính tinh, tứ hóa của cung Quan Lộc và nhận định theo hệ thống Nghê Hải Hạ về cấu hình này.

**【Liên động cung Tài Bạch】**
Quan hệ giữa tài vận và sự nghiệp, nguồn tiền đến từ đâu.

**【Vận sự nghiệp đại hạn hiện tại】**
Xu hướng sự nghiệp trong 10 năm đang đi.

**【Gợi ý thực tế】**
Hướng đi, ngành nghề và chiến lược phù hợp.`,

  wealth: `Hãy phân tích sâu về tài vận, trình bày theo cấu trúc sau:

**【Cách cục tài vận】**
Một câu định tính mô thức tài vận: chủ động kiếm tiền hay thu nhập thụ động.

**【Phân tích cung Tài Bạch】**
Chính tinh, tứ hóa của cung Tài Bạch, nguồn tiền và cách tiền lưu chuyển.

**【Cung Điền Trạch (tài khố)】**
Khả năng tích lũy và vận bất động sản.

**【Tài vận đại hạn hiện tại】**
Xu hướng tài vận và những điều cần lưu ý trong giai đoạn này.

**【Gợi ý tài chính】**
Lời khuyên tài chính cụ thể, chỉ mang tính tham khảo.`,

  health: `Hãy phân tích vận sức khỏe, trình bày theo cấu trúc sau:

**【Sao cung Tật Ách】**
Các sao ở cung Tật Ách và ý nghĩa đối với sức khỏe.

**【Rủi ro chính】**
Kết hợp lý thuyết tý ngọ lưu chú của thầy Nghê Hải Hạ, nêu các vấn đề sức khỏe và bộ phận cần chú ý.

**【Xu hướng sức khỏe theo đại hạn】**
Xu hướng sức khỏe hiện tại và các giai đoạn then chốt.

**【Gợi ý phòng ngừa】**
Điều cần chú ý và hướng dưỡng sinh cụ thể. Nhắc rõ đây chỉ là tham khảo, không thay thế tư vấn y tế.`,

  personality: `Hãy giải đọc sâu về tính cách, trình bày theo cấu trúc sau:

**【Tính cách theo chính tinh cung Mệnh】**
Đặc điểm tính cách cốt lõi của chính tinh cung Mệnh.

**【Tổng hợp tam phương】**
Ảnh hưởng của các cung Tài, Quan, Di lên tính cách, bức tranh toàn diện.

**【Mô thức quan hệ với người khác】**
Cách tương tác, phong cách đối nhân xử thế.

**【Ưu thế và bài học cuộc đời】**
Thiên phú, cùng những bài học cần đối diện.`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   'bản thân, tính cách, cách cục bẩm sinh',
  '兄弟宫': 'anh chị em, đối tác hợp tác',
  '夫妻宫': 'quan hệ tình cảm, hôn nhân',
  '子女宫': 'duyên con cái, cấp dưới',
  '财帛宫': 'nguồn tài lộc, cách kiếm tiền',
  '疾厄宫': 'sức khỏe thân thể, tai nạn',
  '迁移宫': 'cơ hội bên ngoài, cách cục giao tiếp',
  '交友宫': 'bạn bè, quý nhân, tiểu nhân',
  '官禄宫': 'thành tựu sự nghiệp, địa vị xã hội',
  '田宅宫': 'bất động sản, môi trường gia đình',
  '福德宫': 'hưởng thụ tinh thần, phúc phần nội tâm',
  '父母宫': 'quan hệ cha mẹ, giấy tờ hợp đồng',
};

/** Render AI markdown: **【Title】** → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-generate 命格总览 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(TOPIC_PROMPTS.overview, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${viStar(s.name)}${s.siHua ? ' hóa ' + viSiHua(s.siHua) : ''}`).join(', ')
      : 'cung trống (mượn sao đối cung)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const prompt = `Hãy phân tích trọng tâm cung 【${viPalace(selectedPalace.name)}】 (chủ quản: ${role}), chính tinh của cung là ${starDesc}, trình bày theo cấu trúc sau:

**【Định tính cung vị】**
Ý nghĩa của cung ${viPalace(selectedPalace.name)} trong lá số và nhận định chung về cấu hình sao này.

**【Giải đọc chính tinh】**
Cách hệ thống Nghê Hải Hạ giải đọc chính tinh tại cung này.

**【Liên động tam phương tứ chính】**
Ảnh hưởng của các cung tam phương tứ chính lên cung này.

**【Gợi ý thực tế】**
Lời khuyên cụ thể dựa trên cung này.`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar?.name ?? 'cung không xác định';
    const viewLabel = selectedSiHua.view === 'daxian' ? 'Đại hạn' : 'Lưu niên';

    const prompt = `Hãy phân tích ảnh hưởng phi hóa của 【${viewLabel} ${viStar(selectedSiHua.starName)} hóa ${viSiHua(selectedSiHua.siHua)}】, trình bày theo cấu trúc sau:

**【Ý nghĩa cơ bản của hóa ${viSiHua(selectedSiHua.siHua)}】**
Ý nghĩa cốt lõi của hóa ${viSiHua(selectedSiHua.siHua)} trong hệ thống Nghê Hải Hạ, và ý nghĩa đặc thù của ${viStar(selectedSiHua.starName)} hóa ${viSiHua(selectedSiHua.siHua)}.

**【Ảnh hưởng khi nhập cung】**
${viStar(selectedSiHua.starName)} hóa ${viSiHua(selectedSiHua.siHua)} rơi vào cung 【${viPalace(palaceName)}】, lĩnh vực cung này chủ quản chịu tác động gì.

**【Đường phi hóa tam phương tứ chính】**
Sau khi hóa ${viSiHua(selectedSiHua.siHua)} nhập cung ${viPalace(palaceName)}, tác động liên động lên tam phương tứ chính của nó (đối cung và hai cung tam hợp).

**【Ảnh hưởng đến vận hiện tại】**
Dưới chiều thời gian ${viewLabel}, tứ hóa này ảnh hưởng cụ thể thế nào đến vận gần đây của chủ mệnh.

**【Gợi ý thực tế】**
Lời khuyên cụ thể, làm được, dựa trên tứ hóa này.`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) throw new Error('Yêu cầu thất bại');
      if (!res.body) throw new Error('Không có luồng phản hồi');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? 'Không tìm thấy API /api/interpret. Hãy kiểm tra lại mã nguồn.' : 'Giải đoán thất bại. Kiểm tra ANTHROPIC_API_KEY trong .env.local hoặc thử lại sau.' }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>Đang giải đoán mệnh cách…</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
                  Giải đoán
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Hỏi tiếp, ví dụ: Năm nay có hợp đổi việc không?"
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {loading ? '…' : 'Hỏi'}
          </button>
        </div>
      </div>

    </div>
  );
}
