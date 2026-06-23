// Carousel Hero 背景图
import heroArchiveLibrary from './hero-archive-library.jpg';
import heroArchivesHall from './hero-archives-hall.jpg';
import heroBooksShelves from './hero-books-shelves.jpg';
import heroGlobalMap from './hero-global-map.jpg';
import avatarDefault from './avatar-default.jpg';
import suggestionLaw from './suggestion-law.jpg';
import suggestionAi from './suggestion-ai.jpg';
import reportArchives from './report-archives.jpg';
import shouyebackground from './shouye-background.jpg';

// ─── Hero 轮播图 ────────────────────────────────────────────
export const HERO_SLIDES = [
  {
    image: heroArchiveLibrary,
    label: '特色馆藏',
    title: '档案存储库与智能情报',
    description: '通过我们集成了智能检索技术的先进管理系统，访问跨区域、专题性和立法类档案记录。',
  },
  {
    image: heroArchivesHall,
    label: '数字赋能',
    title: '全周期档案治理体系',
    description: '从采集、归档到审计追溯，覆盖档案全生命周期的管理平台。',
  },
  {
    image: heroBooksShelves,
    label: '知识发现',
    title: '海量文献精准检索',
    description: '基于全文索引，秒级定位跨领域档案文献与研究报告。',
  },
  {
    image: heroGlobalMap,
    label: '协同共享',
    title: '跨区域档案资源共享',
    description: '连接京津冀、长三角、粤港澳等重点区域，实现档案资源一体化协作。',
  },
];

// ─── 本地图片 ───────────────────────────────────────────────
export const IMAGES = {
  avatarDefault,
  suggestionLaw,
  suggestionAi,
  reportArchives,
  shouyebackground,
} as const;

// ─── 外部 CDN ───────────────────────────────────────────────
export const AVATAR_URL = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
