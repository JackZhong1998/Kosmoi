export const PHASE_STARTERS = {
  topic: `先选题。`,

  design: (title?: string, extra = '') => {
    const clean = title?.replace(/《|》/g, '').trim();
    if (!clean || clean === '未命名故事') {
      return extra.trim() ? `就用推荐的。${extra.trim()}\n\n开始设计。` : '就用推荐的';
    }
    return extra.trim()
      ? `就用《${clean}》。${extra.trim()}

开始设计。`
      : `就用《${clean}》，开始设计。`;
  },

  style: (title?: string) => {
    const clean = title?.replace(/《|》/g, '').trim();
    return clean && clean !== '未命名故事'
      ? `《${clean}》的设计可以。推荐几种写法。`
      : '故事设计可以。推荐几种写法。';
  },

  lockStyle: (name: string) => `文风就用「${name}」。`,

  proseStart: `开始写正文。`,

  proseContinue: (hint = '') => hint.trim() || `继续往下写。`,

  playContinue: (fromTitle: string, nextTitle: string, choiceText: string, pageTurn: boolean) => {
    const lead = pageTurn
      ? `已经写完「${fromTitle}」，读者点了下一章。`
      : `读者在「${fromTitle}」选了「${choiceText}」。`;
    return `继续往下写。${lead}下一节点是「${nextTitle}」。立刻用 ===DOC:prose+=== 只追加这个节点（或顺着这条路写到下一个选择或翻页），写透再停。不要重写已经有的节点，不要改故事设计。`;
  },

  shortLoop: `写个短篇。先选题。`,

  longTopic: `写个长篇，大约十万字。气质接近《完蛋了！我被美女包围了》：五个可攻略女性，现实向都市或小城。不要穿越、系统、重生、后宫收编。先选题。`,

  consumeStart: (wish: string) => wish,

  tagPick: (audience: string, path: string[], style: string, title: string) =>
    `用户已用标签选定故事方向，不要再问写什么，不要另给三个完全不同的候选。

受众：${audience}
标签路径：${path.join(' -> ')}
选定选题（${style}）：${title}

请立刻按这个选题写【选题】：书名、简介、互动卖点都围绕这一句来。推荐必须就是它。写完请用户确认后进入故事设计。`,

  revise: (request: string) => request,

  themeTopic: (theme: string) => `短篇。就按这个主题来：${theme}。先选题。`,
};
