export interface DropdownItem {
  id: string;
  label: string;
  path: string;
  description?: string;
}

export interface NavMenu {
  id: string;
  label: string;
  path: string;
  isDropdown: boolean;
  dropdownItems?: DropdownItem[];
  enabled: boolean;
}

export interface HighlightStat {
  id: string;
  icon: string;
  label: string;
  value: string;
  useCustomGradient?: boolean;
  bgGradientFrom?: string;
  bgGradientTo?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  primaryHoverColor?: string;
  headerBgColor?: string;
  navbarBgColor?: string;
  navbarTextColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  accentColor?: string;
  footerBgColor?: string;
  isCustom?: boolean;
}

export interface ThemeConfig {
  presetId?: string;
  primaryColor: string;
  primaryHoverColor?: string;
  headerBgColor?: string;
  navbarBgColor?: string;
  navbarTextColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  accentColor?: string;
  footerBgColor?: string;
  bannerOverlayColor?: string;
  bannerOverlayOpacity?: number;
  cardStrokeColor?: string;
  cardStrokeWidth?: number;
  statCardUseGradient?: boolean;
  statCardGradientFrom?: string;
  statCardGradientTo?: string;
  customPresets?: ThemePreset[];
}

export interface SchoolIdentity {
  name: string;
  shortName?: string;
  tagline: string;
  npsn: string;
  akreditasi: string;
  logoUrl: string;
  faviconUrl: string;
  tickerEnabled: boolean;
  tickerText: string;
  accreditationTickerEnabled?: boolean;
  accreditationTickerText?: string;
  accreditationTickerSpeed?: 'slow' | 'normal' | 'fast';
  accreditationTickerBgColor?: string;
  primaryColor: string;
}

export interface ImportantAnnouncement {
  enabled: boolean;
  badge: string;
  text: string;
  theme: 'warning' | 'danger' | 'info' | 'emerald' | 'slate' | 'purple' | 'orange';
  speed?: 'slow' | 'normal' | 'fast';
  customBgColor?: string;
  title?: string;
  buttonEnabled?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  isMarquee?: boolean;
  isSticky?: boolean;
  dismissible?: boolean;
  targetArticleId?: string;
  detailTitle?: string;
  detailContent?: string;
  detailImageUrl?: string;
  popupMode?: 'article' | 'custom' | 'none';
}

export interface HeaderConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCtaText: string;
  heroCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  highlights: HighlightStat[];
  carouselEnabled?: boolean;
  carouselImages?: string[];
  carouselInterval?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalPosition?: 'top' | 'center' | 'bottom';
  showPrimaryButton?: boolean;
  showSecondaryButton?: boolean;
}

export interface MobileBottomNavConfig {
  enabled: boolean;
  positionMode?: 'floating' | 'full-bottom'; // Melayang vs Menutupi Area Bawah Penuh
  presetId?: string; // Preset ID dari koleksi desain
  showHome: boolean;
  showNews: boolean;
  showAchievements: boolean;
  showExtracurriculars: boolean;
  showContact: boolean;
  showProfile?: boolean;
  styleVariant?: 'floating-dock' | 'glass-bar' | 'minimal-pill' | 'solid-dock' | 'curved-notch';
  themeColor?: 'dark-slate' | 'deep-navy' | 'royal-indigo' | 'emerald-green' | 'light-modern' | 'pastel-pink' | 'ocean-gradient' | 'sunset-magenta' | 'custom';
  customBgColor?: string;
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'custom';
  customAccentColor?: string;
  centerButtonShape?: 'circle' | 'rounded-square' | 'diamond' | 'pill' | 'flat';
  glowEffect?: boolean;
  showLabels?: boolean;
  elevatedCenterButton?: boolean;
  showActiveIndicator?: boolean;
}

export interface LayoutSections {
  showHero: boolean;
  showQuickStats: boolean;
  showAccreditation?: boolean;
  showPrincipalSpeech: boolean;
  showNews: boolean;
  showAgenda: boolean;
  showFacilities: boolean;
  showExtracurriculars: boolean;
  showVideoEmbed: boolean;
  showMapEmbed: boolean;
  showPublicComments?: boolean;
}

export interface CommentItem {
  id: string;
  targetId: string; // 'general' or article ID e.g. 'article_1'
  targetTitle?: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likesCount: number;
  likedByEmails?: string[];
  status: 'approved' | 'rejected' | 'pending';
  isFlaggedProfanity?: boolean;
  flaggedWords?: string[];
  isPinned?: boolean;
  parentId?: string;
  parentUserName?: string;
}

export interface CommentModerationConfig {
  enabled: boolean;
  allowGuestComments: boolean;
  profanityFilterEnabled: boolean;
  badWords: string[];
  autoHideFlagged: boolean;
}

export interface PrincipalConfig {
  name: string;
  title: string;
  nip: string;
  imageUrl: string;
  quote: string;
  fullSpeech: string;
}

export interface EmbedsConfig {
  youtubeTitle: string;
  youtubeUrl: string;
  youtubeSubtitle: string;
  mapIframeUrl: string;
  mapTitle: string;
}

export interface FacilityItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
}

export interface ExtracurricularItem {
  id: string;
  name: string;
  category: string;
  coach: string;
  schedule: string;
  icon: string;
  description: string;
  imageUrl?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  isVisible?: boolean;
}

export interface FooterConfig {
  aboutText: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  socialLinks: {
    instagram: string;
    youtube: string;
    facebook: string;
    twitter: string;
  };
  copyright: string;
}

export interface PPDBConfig {
  enabled: boolean;
  buttonLabel: string;
  buttonLink: string;
  openInNewTab: boolean;
  academicYear: string;
  statusText: string;
  badgeText?: string;
  announcement?: string;
  contactPerson?: string;
  brochureUrl?: string;
}

export interface GoogleAppsScriptConfig {
  enabled: boolean;
  webAppUrl: string;
  folderId?: string;
  spreadsheetId?: string;
  autoCreateFolder?: boolean;
  lastTestedAt?: string;
  testStatus?: 'success' | 'error' | 'untested';
  testMessage?: string;
}

export interface SchoolUser {
  name: string;
  password: string;
}

export interface SchoolConfig {
  adminPassword?: string;
  users?: SchoolUser[];
  identity: SchoolIdentity;
  importantAnnouncement?: ImportantAnnouncement;
  header: HeaderConfig;
  navMenus: NavMenu[];
  layoutSections: LayoutSections;
  mobileBottomNav?: MobileBottomNavConfig;
  principal: PrincipalConfig;
  ppdb?: PPDBConfig;
  embeds: EmbedsConfig;
  facilities: FacilityItem[];
  extracurriculars: ExtracurricularItem[];
  agendas: AgendaItem[];
  footer: FooterConfig;
  themeConfig?: ThemeConfig;
  googleAppsScript?: GoogleAppsScriptConfig;
  commentsConfig?: CommentModerationConfig;
  newsCategories?: string[];
  facilitiesTabTitle?: string;
  ekskulTabTitle?: string;
  facilitiesSectionTitle?: string;
  facilitiesSectionSubtitle?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Prestasi' | 'Kegiatan' | 'Akademik' | 'Pengumuman' | 'Ekstrakurikuler' | string;
  summary: string;
  content: string;
  coverImage: string;
  author: string;
  date: string;
  isPinned: boolean;
  views: number;
  likes?: number;
  likedByEmails?: string[];
  status: 'published' | 'draft';
  galleryImages?: string[];
  actionLink?: {
    label: string;
    url: string;
  };
  embedUrl?: string;
  embedTitle?: string;
  isLocalDraft?: boolean;
}
