/** Chuyển lá số thành văn bản gọn để đưa cho Claude (dùng ở /api/interpret). */
import type { ZiweiChart } from './types';
import { STEMS, BRANCHES } from './constants';
import { viStarWithHan, viPalace, viSiHua, viBrightness, viJu } from './vi';

export function chartToText(chart: ZiweiChart): string {
  const b = chart.birthInfo;
  const L = chart.lunarInfo;
  const out: string[] = [];

  out.push(`Giới tính: ${b.gender === 'male' ? 'Nam' : 'Nữ'}${chart.yinYangGender ? ` (${chart.yinYangGender})` : ''}`);
  out.push(`Ngày dương lịch (đã quy về ngày an sao): ${b.day}/${b.month}/${b.year}, giờ chi số ${b.hour} (${BRANCHES[b.hour]})`);
  out.push(`Âm lịch: năm ${STEMS[L.yearStem]}${BRANCHES[L.yearBranch]}, tháng ${Math.abs(L.lunarMonth)}${L.isLeapMonth ? ' (nhuận)' : ''}, ngày ${L.lunarDay}`);
  out.push(`Cục: ${viJu(chart.wuxingJuName)} (${chart.wuxingJuName}); Mệnh cung tại ${BRANCHES[chart.mingGongBranch]}; Thân cung tại ${BRANCHES[chart.shenGongBranch]}`);
  if (chart.mingZhu) out.push(`Mệnh chủ: ${viStarWithHan(chart.mingZhu)}; Thân chủ: ${chart.shenZhu ? viStarWithHan(chart.shenZhu) : '?'}`);
  out.push(`Tuổi hiện tại (tuổi mụ): ${chart.currentAge}`);
  out.push('');
  out.push('12 CUNG (tên cung — can chi — sao):');

  for (const p of chart.palaces) {
    const stars = p.stars
      .map((s) => {
        let t = viStarWithHan(s.name);
        if (s.brightnessRaw) t += `[${viBrightness(s.brightnessRaw)}]`;
        if (s.siHua) t += `{hóa ${viSiHua(s.siHua)}}`;
        return t;
      })
      .join(', ');
    const flags = [
      p.isMingGong ? 'MỆNH' : '',
      p.isShenGong ? 'THÂN' : '',
      p.isCurrentDaXian ? 'ĐẠI HẠN HIỆN TẠI' : '',
      p.isEmpty && p.borrowedStars?.length ? `vô chính diệu, mượn sao đối cung: ${p.borrowedStars.map(viStarWithHan).join(', ')}` : '',
    ].filter(Boolean).join('; ');
    const self = p.selfSihua?.length
      ? ` | tự hóa: ${p.selfSihua.map((m) => `${viStarWithHan(m.starName)} hóa ${viSiHua(m.siHua)}`).join(', ')}`
      : '';
    const age = p.daXianAge ? ` | đại hạn ${p.daXianAge[0]}–${p.daXianAge[1]}` : '';
    out.push(`- ${viPalace(p.name)} (${STEMS[p.stem]}${BRANCHES[p.branch]})${age}${flags ? ` | ${flags}` : ''}${self}\n    Sao: ${stars || '(trống)'}`);
  }

  out.push('');
  out.push('ĐẠI HẠN:');
  for (const d of chart.daXians) {
    const sh = d.siHua
      ? ` | tứ hóa đại hạn: Lộc ${viStarWithHan(d.siHua.lu)}, Quyền ${viStarWithHan(d.siHua.quan)}, Khoa ${viStarWithHan(d.siHua.ke)}, Kỵ ${viStarWithHan(d.siHua.ji)}`
      : '';
    out.push(`- ${d.startAge}–${d.endAge} tuổi: cung ${viPalace(d.palaceName)}${sh}`);
  }
  const cur = chart.daXians[chart.currentDaXianIndex];
  if (cur) out.push(`Đại hạn hiện tại: ${cur.startAge}–${cur.endAge} tuổi (cung ${viPalace(cur.palaceName)})`);

  return out.join('\n');
}
