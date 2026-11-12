/**
 * Việt hóa tên sao / cung / tứ hóa / thiên can địa chi (chữ Hán giản thể → Hán-Việt).
 * Do Linh bổ sung — không thuộc bản gốc. Chỉ dùng cho HIỂN THỊ; dữ liệu lá số vẫn dùng chữ Hán.
 */

const STAR_VI: Record<string, string> = {
  // Chính tinh
  '紫微': 'Tử Vi', '天机': 'Thiên Cơ', '太阳': 'Thái Dương', '武曲': 'Vũ Khúc',
  '天同': 'Thiên Đồng', '廉贞': 'Liêm Trinh', '天府': 'Thiên Phủ', '太阴': 'Thái Âm',
  '贪狼': 'Tham Lang', '巨门': 'Cự Môn', '天相': 'Thiên Tướng', '天梁': 'Thiên Lương',
  '七杀': 'Thất Sát', '破军': 'Phá Quân',
  // Phụ tinh / cát tinh
  '左辅': 'Tả Phụ', '右弼': 'Hữu Bật', '文昌': 'Văn Xương', '文曲': 'Văn Khúc',
  '天魁': 'Thiên Khôi', '天钺': 'Thiên Việt', '禄存': 'Lộc Tồn', '天马': 'Thiên Mã',
  '红鸾': 'Hồng Loan', '天喜': 'Thiên Hỷ', '三台': 'Tam Thai', '八座': 'Bát Tọa',
  '台辅': 'Thai Phụ', '封诰': 'Phong Cáo', '恩光': 'Ân Quang', '天贵': 'Thiên Quý',
  '龙池': 'Long Trì', '凤阁': 'Phượng Các', '华盖': 'Hoa Cái', '咸池': 'Hàm Trì',
  '天姚': 'Thiên Diêu', '天官': 'Thiên Quan', '天福': 'Thiên Phúc', '天寿': 'Thiên Thọ',
  '天才': 'Thiên Tài', '天厨': 'Thiên Trù', '天巫': 'Thiên Vu', '天月': 'Thiên Nguyệt',
  '天德': 'Thiên Đức', '月德': 'Nguyệt Đức', '龙德': 'Long Đức', '解神': 'Giải Thần',
  '年解': 'Niên Giải',
  // Sát tinh / hung tinh
  '擎羊': 'Kình Dương', '陀罗': 'Đà La', '火星': 'Hỏa Tinh', '铃星': 'Linh Tinh',
  '地空': 'Địa Không', '地劫': 'Địa Kiếp', '天空': 'Thiên Không', '截空': 'Tiệt Không',
  '旬空': 'Tuần Không', '副截': 'Phó Tiệt', '副旬': 'Phó Tuần', '天刑': 'Thiên Hình',
  '天哭': 'Thiên Khốc', '天虚': 'Thiên Hư', '天伤': 'Thiên Thương', '天使': 'Thiên Sứ',
  '孤辰': 'Cô Thần', '寡宿': 'Quả Tú', '蜚廉': 'Phi Liêm', '破碎': 'Phá Toái',
  '劫煞': 'Kiếp Sát', '阴煞': 'Âm Sát', '大耗': 'Đại Hao',
};

const PALACE_VI: Record<string, string> = {
  '命宫': 'Mệnh', '兄弟': 'Huynh Đệ', '夫妻': 'Phu Thê', '子女': 'Tử Tức',
  '财帛': 'Tài Bạch', '疾厄': 'Tật Ách', '迁移': 'Thiên Di', '仆役': 'Nô Bộc',
  '交友': 'Nô Bộc', '官禄': 'Quan Lộc', '田宅': 'Điền Trạch', '福德': 'Phúc Đức',
  '父母': 'Phụ Mẫu',
};

const SIHUA_VI: Record<string, string> = { '禄': 'Lộc', '权': 'Quyền', '科': 'Khoa', '忌': 'Kỵ' };

const BRIGHTNESS_VI: Record<string, string> = {
  '庙': 'Miếu', '旺': 'Vượng', '得': 'Đắc', '利': 'Lợi', '平': 'Bình',
  '不': 'Bất', '闲': 'Nhàn', '陷': 'Hãm', '地': 'Địa',
};

export const STEMS_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const BRANCHES_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const JU_VI: Record<string, string> = {
  '水二局': 'Thủy nhị cục', '木三局': 'Mộc tam cục', '金四局': 'Kim tứ cục',
  '土五局': 'Thổ ngũ cục', '火六局': 'Hỏa lục cục',
};

/** Tên sao → Hán-Việt (không có trong bảng thì giữ nguyên). */
export const viStar = (name: string): string => STAR_VI[name] ?? name;

/** Tên cung → Hán-Việt, bỏ chữ 宫 ("命宫" → "Mệnh"). */
export const viPalace = (name: string): string =>
  PALACE_VI[name] ?? PALACE_VI[name.replace(/宫$/, '')] ?? name;

export const viSiHua = (s: string): string => SIHUA_VI[s] ?? s;
export const viBrightness = (s: string): string => BRIGHTNESS_VI[s] ?? s;
export const viJu = (s: string): string => JU_VI[s] ?? s;
export const viStem = (i: number): string => STEMS_VI[i] ?? '';
export const viBranch = (i: number): string => BRANCHES_VI[i] ?? '';

/** Dạng "Tử Vi (紫微)" — dùng khi gửi cho Claude để vừa dễ đọc vừa không mất gốc. */
export const viStarWithHan = (name: string): string =>
  STAR_VI[name] ? `${STAR_VI[name]} (${name})` : name;
