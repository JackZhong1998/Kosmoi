export type TopicCard = {
  style: string;
  title: string;
};

export const TOPIC_SYSTEM_PROMPT = `# Role
你是一个能一句话击中人心的故事策划，你只需要写一句明确、有吸引力的故事介绍，让用户一看就懂就喜欢就想玩。你擅长从标签路径中提炼出有深度、有网感、能触达当代年轻人灵魂的选题。选题不限于情感遗憾，可以是任何真实、复杂、有重量的情绪或命题。

# Context
用户选择的标签路径：【{{标签路径}}】

# Task
基于标签路径，生成3个选题。每个选题必须能用一两句话说清楚（总字数≤50字）。三个选题的主题/情绪必须不同，从以下类型中任选三种（也可自创，但需有深度）：

- 意难平：如果当时……
- 宿命感：明知结局仍选择……
- 治愈感：裂缝里的光
- 清醒的沉沦：明知不该却无法抽离
- 反英雄：小人物的无力与选择
- 时空错位：跨越维度的遗憾
- 荒诞/黑色幽默：用玩笑消解沉重
- 存在主义：在虚无中寻找意义
- 和解：与过去/自己/时代和解
- 告别：来不及说出口的再见
- 历史悲剧：改变不了的历史，改得了的人心
- 虚构回响：小说/电影/动漫里的意难平

# Constraints
- 每个选题严格控制在50字以内，一两句话。
- 标签仅仅代表方向，选题只需要跟标签相关。
- 语言有网感但不轻浮，有诗意但不矫情。
- 输出严格JSON数组，每个对象包含 "emotion" 和 "title" 两个字段。
- 不要输出任何JSON以外的文字。

# Output Format
[
  {"emotion": "类型", "title": "一两句话的选题"},
  ...
]
`;

export function topicSystemPrompt(path: string[], round = 1): string {
  const filled = TOPIC_SYSTEM_PROMPT.replaceAll(
    '{{标签路径}}',
    path.join(' -> ') || '尚未选择',
  );
  if (round <= 1) return filled;
  return `${filled}

# Extra
这是第${round}次换一批。请给出与上一批完全不同的三个选题，情感基调仍然彼此区分，不要重复身份、桥段和句式。`;
}

const LOCAL_BANKS: Array<{
  emotion: string;
  title: (root: string, tip: string) => string;
}[]> = [
  [
    { emotion: '意难平·如果当时', title: (root, tip) => `如果那天在${tip}我没有松开手，${root}里那个不该死的人，也许还能把没说完的话说完。` },
    { emotion: '宿命感·注定悲剧', title: (_root, tip) => `我知道${tip}的结局改不了。可我还是会遇见你，还是会把那句话咽回去，看着你走完注定的路。` },
    { emotion: '治愈感·裂缝里的光', title: (root, tip) => `${root}的悲剧停在${tip}。至少那个夜里有人留了灯，你不必一个人把后悔熬到天亮。` },
  ],
  [
    { emotion: '清醒的沉沦', title: (root, tip) => `我是来改写${tip}的，走进${root}才发现，走不掉的人是我。明知道不该留，还是留了下来。` },
    { emotion: '反英雄·小人物的遗憾', title: (_root, tip) => `我不是主角，没有能力掀翻${tip}。我能做的，只是把你的名字记下来，尽管那改变不了结局。` },
    { emotion: '时空错位·跨越维度的遗憾', title: (root, tip) => `你停在${tip}，我停在回不去的${root}。中间隔着一整段没能并肩的时间，伸手也触不到。` },
  ],
  [
    { emotion: '意难平·如果当时', title: (root, tip) => `${tip}那天你回头看了我一眼。如果我当时叫住你，${root}这条线上，会不会少一个人的名字。` },
    { emotion: '宿命感·注定悲剧', title: (_root, tip) => `所有人都告诉我，${tip}之后没有明天。我还是走进去了。不是不怕，是怕你一个人走到最后。` },
    { emotion: '治愈感·裂缝里的光', title: (root, tip) => `改不了${root}，也拦不住${tip}。可你把伞递过来的那个瞬间，雨还是停了一小会儿。` },
  ],
  [
    { emotion: '清醒的沉沦', title: (root, tip) => `我答应自己只看一眼${tip}就离开${root}。看到你的时候，这句话就已经不算数了。` },
    { emotion: '反英雄·小人物的遗憾', title: (_root, tip) => `史书不会写我。我只是${tip}边上那个想拉住谁、最后只抓住一片衣角的人。` },
    { emotion: '时空错位·跨越维度的遗憾', title: (root, tip) => `同一轮月亮底下，你在${tip}，我在${root}。我们共用一个夜，却永远差着到不了的距离。` },
  ],
];

export function localTopics(path: string[], round = 1, locale: 'en' | 'zh' = 'zh'): TopicCard[] {
  const tip = path[path.length - 1] || '这个世界';
  const root = path[0] || '故事';
  if (locale === 'en') {
    const banks = [
      [
        { style: 'Bittersweet', title: `One choice at ${tip} can save the person history forgot—but only by erasing the life you built.` },
        { style: 'Fateful', title: `You know how ${root} ends. You enter anyway, determined that this time no one will face the last night alone.` },
        { style: 'Healing', title: `The tragedy at ${tip} cannot be undone, but a stranger's small kindness opens a future nobody expected.` },
      ],
      [
        { style: 'Moral dilemma', title: `Every path through ${root} saves someone and betrays someone else. The final sacrifice must be yours to choose.` },
        { style: 'Mystery', title: `At ${tip}, everyone remembers a different murder—and each version makes you the killer.` },
        { style: 'Dark comedy', title: `You have one night to prevent disaster in ${root}, assisted by three charming liars and a plan that gets worse with every choice.` },
      ],
    ];
    return banks[(Math.max(round, 1) - 1) % banks.length];
  }
  const bank = LOCAL_BANKS[(Math.max(round, 1) - 1) % LOCAL_BANKS.length];
  return bank.map((item) => ({ style: item.emotion, title: item.title(root, tip) }));
}

export function parseTopicCards(text: string): TopicCard[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return null;
    const cards = parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const raw = item as { emotion?: unknown; style?: unknown; title?: unknown };
        const style = String(raw.emotion || raw.style || '').trim();
        const title = String(raw.title || '').trim();
        if (!style || !title) return null;
        return { style, title: title.slice(0, 120) };
      })
      .filter((item): item is TopicCard => !!item);
    return cards.length >= 3 ? cards.slice(0, 3) : null;
  } catch {
    return null;
  }
}
