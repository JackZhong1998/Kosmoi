export type Locale = 'en' | 'zh';
export type ReaderGender = 'female' | 'male' | 'all';

export const DEFAULT_LOCALE: Locale = 'en';

export function asLocale(value: unknown): Locale {
  return value === 'zh' ? 'zh' : 'en';
}

export function asReaderGender(value: unknown): ReaderGender {
  return value === 'female' || value === 'male' ? value : 'all';
}

const COPY = {
  en: {
    home: 'Home',
    create: 'Create',
    me: 'Me',
    all: 'All',
    female: 'For women',
    male: 'For men',
    language: 'Language',
    english: 'English',
    chinese: '中文',
    loadingStories: 'Loading stories…',
    noStories: 'No stories are available yet.',
    writeOne: 'Write one',
    startPlaying: 'Start story',
    words: 'words',
    signInTitle: 'Sign in to enter Spark',
    signInBody: 'Your stories, reading progress, language, and recommendations will follow your account.',
    signIn: 'Sign in',
    chooseLanguage: 'Choose your language',
    chooseLanguageBody: 'You can change this any time from the bottom-left corner.',
    continue: 'Continue',
    chooseGender: 'What would you like to discover?',
    chooseGenderBody: 'This sets your default home feed. You can still browse every tab.',
    finish: 'Enter Spark',
    onboardingSaving: 'Saving…',
    aboutStory: 'About this story',
    themes: 'Themes',
    audience: 'Recommended for',
    begin: 'Begin the story',
    backHome: 'Back to home',
    published: 'Published',
    draft: 'Draft',
  },
  zh: {
    home: '首页',
    create: '创作',
    me: '我的',
    all: '全部',
    female: '女性向',
    male: '男性向',
    language: '语言',
    english: 'English',
    chinese: '中文',
    loadingStories: '正在载入故事…',
    noStories: '还没有可以读的小说。',
    writeOne: '去写一本',
    startPlaying: '开始游戏',
    words: '字',
    signInTitle: '登录后进入火花',
    signInBody: '你的故事、阅读进度、语言和推荐会跟随账号。',
    signIn: '登录',
    chooseLanguage: '选择你的语言',
    chooseLanguageBody: '之后可以随时在左下角更改。',
    continue: '继续',
    chooseGender: '你想看哪类故事？',
    chooseGenderBody: '这会设置首页默认频道，你仍然可以浏览全部分类。',
    finish: '进入火花',
    onboardingSaving: '正在保存…',
    aboutStory: '故事简介',
    themes: '主题标签',
    audience: '面向读者',
    begin: '开始阅读',
    backHome: '返回首页',
    published: '已发布',
    draft: '草稿',
  },
} as const;

export type CopyKey = keyof (typeof COPY)['en'];

export function translate(locale: Locale, key: CopyKey): string {
  return COPY[locale][key];
}

export function localeInstruction(locale: Locale): string {
  return locale === 'zh'
    ? '\n\n# 输出语言\n用户当前选择了中文。所有面向用户的回复、作品文档、标题、正文、选项和状态名称都必须使用简体中文。'
    : '\n\n# Output language\nThe user selected English. Write every user-facing response, story document, title, narrative passage, choice, label, and state name in natural English. Do not switch to Chinese even if earlier templates or messages are Chinese; preserve only required machine-readable delimiters and JSON keys.';
}
