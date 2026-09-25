import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import { createClient } from '@supabase/supabase-js';

const LEGACY_CATALOG = [
  { slug: 'zh-f-404-bride', language: 'zh', gender: 'female', title: '《404号房的逃婚新娘》', hook: '婚礼前夜，你收到一张自己的死亡证明。想活到天亮，必须在未婚夫、失踪的姐姐和一名陌生警察之间选择信任。', themes: ['都市悬疑', '黑暗浪漫', '逃婚', '身份谜题', '多结局'] },
  { slug: 'zh-f-changan-coroner', language: 'zh', gender: 'female', title: '《长安女仵作：第七具无名尸》', hook: '你是长安最会让死人开口的女仵作，第七具无名尸却长着你的脸。三日内查清真相，否则下一个死的人就是现在的你。', themes: ['古风探案', '女强', '权谋', '身份反转', '宿命'] },
  { slug: 'zh-f-last-exhibit', language: 'zh', gender: 'female', title: '《分手博物馆的最后一件藏品》', hook: '你帮别人保存爱情遗物，却在闭馆前收到一封来自五年后的分手信。每打开一件藏品，都会改写你和他的过去。', themes: ['破镜重圆', '都市治愈', '时间奇幻', '成年人爱情', '遗憾'] },
  { slug: 'zh-f-dock-seven', language: 'zh', gender: 'female', title: '《第七码头没有她的名字》', hook: '九十年代的港口小城，四个厂妹约好一起南下，最后只有三人上车。二十年后，你必须决定是否说出那晚的真相。', themes: ['年代女性群像', '友谊', '小城悬疑', '成长', '和解'] },
  { slug: 'zh-f-apocalypse-roommates', language: 'zh', gender: 'female', title: '《末日合租守则》', hook: '城市封锁的第七天，你发现合租公寓里有一人已被感染。要带所有人活着离开，你得先决定谁能留在屋里。', themes: ['末日求生', '女性群像', '信任博弈', '慢热情感', '道德选择'] },

  { slug: 'zh-m-evacuation-72', language: 'zh', gender: 'male', title: '《72小时撤侨》', hook: '内战爆发，你是最后一支撤侨车队的临时指挥。二百一十三人、三条路、只够走一次的燃料，每个命令都会留下一串名字。', themes: ['军事行动', '撤侨', '领导力', '资源决策', '真实向'] },
  { slug: 'zh-m-delete-tomorrow', language: 'zh', gender: 'male', title: '《我在AI公司删掉了明天》', hook: '公司的预测模型能看见未来，而你在日志里发现了自己明天的死亡记录。你每删除一次预测，现实就会失去一个人。', themes: ['AI悬疑', '时间循环', '职场阴谋', '科技伦理', '高概念'] },
  { slug: 'zh-m-last-metro', language: 'zh', gender: 'male', title: '《凌晨0:17的末班地铁》', hook: '你误上了一辆站名不存在的末班车。每到一站，车厢都会少一人；每救下一人，现实里就会忘掉你的一部分。', themes: ['规则怪谈', '都市恐怖', '解谜逃生', '记忆代价', '多结局'] },
  { slug: 'zh-m-unfinished-city', language: 'zh', gender: 'male', title: '《破产后，我接手了一座烂尾城》', hook: '你负债三千万，被迫接管县城最大的烂尾项目。九十天内复工、交房、找出掏空资金的人，否则你和三千个家庭一起完蛋。', themes: ['商战逆袭', '县城现实', '项目管理', '阴谋', '小人物翻盘'] },
  { slug: 'zh-m-fallen-emperor', language: 'zh', gender: 'male', title: '《醒来时，我的反军已经进城》', hook: '你在自己的庆功宴上醒来，才知道三年前的自己失踪后，被替身皇帝逼成了反王。现在只有一夜，决定是夺回王座还是结束王朝。', themes: ['架空历史', '谋略', '身份谜题', '反王', '多结局'] },

  { slug: 'en-f-bride-404', language: 'en', gender: 'female', title: 'The Bride in Room 404', hook: 'On the eve of your wedding, a hotel key appears in your bouquet—and inside the room is proof that your perfect fiancé has married and murdered you before.', themes: ['Dark romance', 'Murder mystery', 'Runaway bride', 'Identity secrets', 'Multiple endings'] },
  { slug: 'en-f-borrowed-crown', language: 'en', gender: 'female', title: 'A Crown Borrowed at Midnight', hook: 'A dying queen hires you, a palace seamstress, to impersonate her for seven days. Three rivals know the truth, and each offers a different kind of love—and a different betrayal.', themes: ['Romantasy', 'Court intrigue', 'Hidden identity', 'Female ambition', 'Enemies to lovers'] },
  { slug: 'en-f-bellweather-train', language: 'en', gender: 'female', title: 'The Last Train to Bellweather', hook: 'Every night the last train returns you to the summer before your best friend vanished. You can save her or keep the life—and the love—you built after she was gone, but not both.', themes: ['Time loop', 'Small-town mystery', 'Second-chance romance', 'Female friendship', 'Bittersweet'] },
  { slug: 'en-f-influencer-murder', language: 'en', gender: 'female', title: 'Murder at the Influencer Retreat', hook: 'Five women built careers selling perfect lives. When one is found dead during a livestream blackout, your followers vote on who you should trust next.', themes: ['Locked-room mystery', 'Female ensemble', 'Social media', 'Dark comedy', 'Public choices'] },
  { slug: 'en-f-saltwater-letters', language: 'en', gender: 'female', title: 'Saltwater Letters', hook: 'As your island disappears beneath the sea, letters arrive from the woman who will live in your house fifty years from now. Together you can save one community—hers or yours.', themes: ['Climate fiction', 'Epistolary romance', 'Hopeful sci-fi', 'Community', 'Impossible choice'] },

  { slug: 'en-m-lunar-dead-drop', language: 'en', gender: 'male', title: 'Dead Drop at the Lunar Embassy', hook: 'You are the only diplomat on the Moon who knows Earth has already declared war. You have six hours to identify a double agent before the first missile launches.', themes: ['Sci-fi espionage', 'Lunar colony', 'Double agent', 'Political thriller', 'Countdown'] },
  { slug: 'en-m-murder-startup', language: 'en', gender: 'male', title: 'The Startup That Predicted Murders', hook: 'Your failing startup gets one prediction right: a murder twelve hours before it happens. Investors want a product, police want a suspect, and the algorithm names you next.', themes: ['Tech thriller', 'AI ethics', 'Startup noir', 'Conspiracy', 'Time pressure'] },
  { slug: 'en-m-blackridge-mall', language: 'en', gender: 'male', title: 'Last Shift at Blackridge Mall', hook: 'The abandoned mall reopens for one night, staffed by people who all died there in 1999. Your security handbook has twelve rules; the final rule is written in your handwriting.', themes: ['Survival horror', 'Rules mystery', 'Nineties nostalgia', 'Found footage', 'Multiple endings'] },
  { slug: 'en-m-own-rebellion', language: 'en', gender: 'male', title: 'The King Who Woke Inside His Own Rebellion', hook: 'You awaken with no memory as the masked rebel about to execute the king—then recognize the king as an older version of yourself.', themes: ['Epic fantasy', 'Strategy', 'Identity paradox', 'Rebellion', 'Moral choices'] },
  { slug: 'en-m-colony-vote', language: 'en', gender: 'male', title: 'Colony 13: Vote to Survive', hook: 'A failing Mars colony has oxygen for 312 people and a population of 487. As the newly elected governor, every player vote saves a district and condemns another.', themes: ['Mars survival', 'Leadership', 'Resource crisis', 'Political drama', 'Hard choices'] },
];

const CATALOG = [
  { slug: 'zh-f-404-bride', language: 'zh', gender: 'female', title: '《恋爱综艺里，四个男人都选了我》', hook: '你只想替好友救场，却在首轮心动投票中同时收到四张票：温柔影帝、毒舌主理人、年下冠军和你的初恋。镜头之外，每个人都想让你只看他。', themes: ['恋综修罗场', '全员心动', '初恋重逢', '成年人恋爱', '多男主结局'] },
  { slug: 'zh-f-changan-coroner', language: 'zh', gender: 'female', title: '《长安第一女掌柜的四封婚书》', hook: '你要在长安重开家业，却同时收到冷面将军、腹黑王爷、温润御医与江湖少主的婚书。他们争的不只是你的心，还有你手中能改变长安商路的密钥。', themes: ['古风乙女', '多男主', '女商人', '权谋甜宠', '自主选择'] },
  { slug: 'zh-f-last-exhibit', language: 'zh', gender: 'female', title: '《离婚倒计时：前任们全回来了》', hook: '你在离婚冷静期第一天搬进海边公寓，门外却依次出现想复婚的前夫、最懂你的竹马、气场全开的新老板和当年不告而别的摄影师。', themes: ['都市成年人恋爱', '前任修罗场', '破镜重圆', '年上年下', '女性成长'] },
  { slug: 'zh-f-dock-seven', language: 'zh', gender: 'female', title: '《顶流女导演今天选谁做男主》', hook: '你的处女作杀入国际电影节，四位男人争着演你的男主角：顶流、实力派影帝、天才编剧和投资人。试戏结束后，他们的表白却都不在剧本里。', themes: ['娱乐圈', '女导演', '四角竞逐', '事业爱情', '电影感'] },
  { slug: 'zh-f-apocalypse-roommates', language: 'zh', gender: 'female', title: '《末日安全屋的心动合约》', hook: '你是安全屋唯一能修复净水系统的工程师，冷静队长、天才医生、危险雇佣兵和你失联的未婚夫都想带你离开，却只能选一条生路。', themes: ['末日恋爱', '强强联手', '守护与占有', '多男主', '生存抉择'] },

  { slug: 'zh-m-evacuation-72', language: 'zh', gender: 'male', title: '《全公司都在猜我最后选谁》', hook: '你空降成为濒临破产的工作室主理人，高冷合伙人、元气策划、秘密投资人和你的天才前任同时进组。她们争项目，也在争你下班后的时间。', themes: ['职场恋爱', '多女主', '创业逆袭', '前任重逢', '成年人拉扯'] },
  { slug: 'zh-m-delete-tomorrow', language: 'zh', gender: 'male', title: '《科技展上，四位天才女生向我宣战》', hook: '你带着一台未完成的陪伴机器人参展，却被冷艳女教授、青梅程序员、天才产品经理和竞争公司千金同时盯上。她们想抢你的代码，更想抢你的未来。', themes: ['科技圈恋爱', '天才女友', '欢喜冤家', '青梅竹马', '多结局'] },
  { slug: 'zh-m-last-metro', language: 'zh', gender: 'male', title: '《恋爱公寓的最后一间房》', hook: '你刚失业就抽中免费公寓，入住后才发现三位室友和神秘女房东都曾与你擦肩而过。一张共居合约，让四段错过的缘分同时开始。', themes: ['合租日常', '多女主', '治愈喜剧', '与女房东恋爱', '心动选择'] },
  { slug: 'zh-m-unfinished-city', language: 'zh', gender: 'male', title: '《回村开民宿后，她们都追来了》', hook: '你辞去大厂工作回海岛修老宅，青梅村医、直播博主、毒舌建筑师和前上司先后入住。民宿还没开业，小岛已经开始押注你会和谁留下。', themes: ['田园恋爱', '民宿创业', '青梅竹马', '御姐年上', '轻喜剧'] },
  { slug: 'zh-m-fallen-emperor', language: 'zh', gender: 'male', title: '《我的四位女谋士都想当皇后》', hook: '你被推上乱世的王座，冷艳女将、腹黑宰相、温柔医女和敌国公主各自为你献上胜策。朝堂要你立后，她们却都不肯让你只把这当成政治。', themes: ['架空宫廷', '多女主', '女将女相', '权谋恋爱', '王座与真心'] },

  { slug: 'en-f-bride-404', language: 'en', gender: 'female', title: 'Every Man at the Wedding Chose Me', hook: 'You attend a destination wedding determined to stay invisible, then receive confessions from the best man, the bride\'s guarded brother, a famous musician, and the ex who once broke your heart. By sunset, all four are openly competing for your next dance.', themes: ['Destination romance', 'Multiple male love interests', 'Second chances', 'Rivals in love', 'Choice-driven endings'] },
  { slug: 'en-f-borrowed-crown', language: 'en', gender: 'female', title: 'Four Princes, One Borrowed Crown', hook: 'You impersonate a missing princess for seven days and discover that four men—a loyal knight, a rival prince, a charming spy, and your childhood protector—know the truth. Each offers an alliance, a kiss, and a different future.', themes: ['Romantasy', 'Reverse harem rivalry', 'Hidden identity', 'Court intrigue', 'Multiple romance endings'] },
  { slug: 'en-f-bellweather-train', language: 'en', gender: 'female', title: 'The Summer All My Exes Came Home', hook: 'You return to save your family’s lakeside inn and find three former flames plus the infuriating architect next door competing to help. The town festival ends with one public declaration—and the choice is yours.', themes: ['Small-town romance', 'Second chance', 'Multiple suitors', 'Summer festival', 'Female ambition'] },
  { slug: 'en-f-influencer-murder', language: 'en', gender: 'female', title: 'The Bachelorette Bet Nobody Was Meant to Win', hook: 'You join a dating show to expose its producer, but the sincere single dad, the rebellious chef, the polished heir, and the cameraman who knows your secret all fall for you—and start breaking the show’s rules to prove it.', themes: ['Reality TV romance', 'Four suitors', 'Behind-the-scenes secrets', 'Romantic comedy', 'Player choice'] },
  { slug: 'en-f-saltwater-letters', language: 'en', gender: 'female', title: 'The Last Lighthouse Keeper Has Four Visitors', hook: 'You inherit a remote lighthouse for one stormy month. A rescue pilot, a marine biologist, a bestselling novelist, and the island mayor each arrive with a reason to stay—and none intends to let the others win your heart.', themes: ['Coastal romance', 'Forced proximity', 'Multiple male love interests', 'Cozy mystery', 'Emotional choice'] },

  { slug: 'en-m-lunar-dead-drop', language: 'en', gender: 'male', title: 'Four Women at the Lunar Embassy', hook: 'Your first week as Earth’s lunar diplomat becomes complicated when a fearless pilot, a brilliant scientist, a rival ambassador, and your former academy partner all request you for the same mission—and for reasons that are not strictly professional.', themes: ['Sci-fi romance', 'Multiple female love interests', 'Rivals to lovers', 'Moon colony', 'Choice-driven endings'] },
  { slug: 'en-m-murder-startup', language: 'en', gender: 'male', title: 'My Startup Has Four Co-Founders and One Impossible Choice', hook: 'You have thirty days to save your company while four remarkable women—your relentless COO, a playful designer, a mysterious investor, and the engineer who was your first love—compete for control of the launch and a place beside you afterward.', themes: ['Startup romance', 'Multiple heroines', 'Workplace rivalry', 'First love', 'Ambition and affection'] },
  { slug: 'en-m-blackridge-mall', language: 'en', gender: 'male', title: 'The Apartment Above the Midnight Bookshop', hook: 'A cheap room above a bookshop comes with four women already woven into its nights: the sharp-tongued owner, a warmhearted baker, a famous author in hiding, and your adventurous childhood friend. Their book-club rivalry soon becomes personal.', themes: ['Cozy urban romance', 'Multiple heroines', 'Roommates', 'Bookshop', 'Slow burn'] },
  { slug: 'en-m-own-rebellion', language: 'en', gender: 'male', title: 'The King and His Four Rival Queens', hook: 'On the eve of your coronation, a warrior general, a cunning chancellor, a compassionate healer, and a rebellious foreign princess each offers the alliance that could save your kingdom. Each also wants the man beneath the crown.', themes: ['Fantasy romance', 'Four heroines', 'Court rivalry', 'Political marriage', 'Multiple endings'] },
  { slug: 'en-m-colony-vote', language: 'en', gender: 'male', title: 'Mars Colony Dating Protocol', hook: 'You are selected for the colony’s compatibility trial, only to match equally with its daring commander, reserved botanist, mischievous mechanic, and charismatic rival candidate. The whole colony watches them compete—but the final decision belongs to you.', themes: ['Mars romance', 'Multiple female love interests', 'Dating experiment', 'Found family', 'Choice-driven endings'] },
];

function loadEnv(text) {
  return Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => {
    const at = line.indexOf('=');
    return [line.slice(0, at), line.slice(at + 1)];
  }));
}

function request(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST', family: 4, headers: {
      Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'X-Title': 'Spark Launch Library', 'HTTP-Referer': 'http://localhost:3000',
    } }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode || 500, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(240000, () => req.destroy(new Error('generation timed out')));
    req.write(payload);
    req.end();
  });
}

function storyPrompt(item) {
  const language = item.language === 'zh' ? '简体中文' : 'English';
  const protagonist = item.gender === 'female'
    ? 'The player-character is an adult woman pursued by at least three distinct adult men.'
    : 'The player-character is an adult man pursued by at least three distinct adult women.';
  const lengthRule = item.language === 'zh'
    ? '每个非结局节点正文为 700–1100 个汉字，每个结局为 500–800 个汉字。'
    : 'Every non-ending body must be 550–800 words and every ending 350–500 words.';
  return `Create a complete, polished short interactive novel in ${language} for Spark Story Studio.

TITLE: ${item.title}
PREMISE: ${item.hook}
AUDIENCE: ${item.gender}
THEMES: ${item.themes.join(', ')}

CORE ROMANCE REQUIREMENTS:
- ${protagonist}
- All love interests actively like the protagonist, notice one another's feelings, and compete through dates, gifts, protection, teasing, jealousy, or open declarations.
- Give every love interest a distinctive worldview, chemistry, flaw, and emotionally credible reason to love the protagonist. The protagonist must have agency and a meaningful personal goal beyond being desired.
- Keep the rivalry consensual and entertaining. No coercion, stalking presented as romantic, sexual violence, incest, or underage characters. Intimacy may be sensual but never explicit.
- The final three ending nodes n09, n10, and n11 must each be a complete, satisfying romantic ending with a DIFFERENT named love interest. No generic single ending, harem ending, death ending, or cliffhanger.
- Use at least three visible affection stats, one for each endgame love interest. Choices must change relevant affection stats and produce visible emotional consequences.

Return strict JSON only with two top-level fields: meta and nodes.

The novel must be complete and playable, not an outline. Create EXACTLY 11 substantial scenes with IDs n01 through n11. Use this topology: n01→n02; n02 has a meaningful choice to n03 or n04; n03 and n04 both lead to n05; n05 has a meaningful choice to n06 or n07; n06 and n07 both lead to n08; n08 has three consequential choices leading to the distinct romantic endings n09, n10, and n11. Use second-person narration, concrete cinematic prose, plenty of dialogue, and recurring rivalry among the love interests. ${lengthRule} Avoid explicit sexual content, hate, and gratuitous gore.

{"meta":{"title":"...","logline":"...","start":"n01","stats":[{"id":"trust","name":"...","initial":5,"min":0,"max":10,"visible":true}],"factLabels":{"key":"..."}},"nodes":[{"id":"n01","chapter":"...","title":"...","kind":"linear|choice|branch|merge|ending","isEnding":false,"endingId":null,"body":"full narrative prose","choices":[{"id":"c1","text":"...","meaning":"...","next":"n02","effects":{"trust":1},"setFacts":["key"],"conditions":{}}]}]}

All choices must point to existing node IDs. Every reachable path must end. Ending nodes use isEnding:true, a non-null endingId, and an empty choices array. Keep JSON valid: escape newlines inside strings and do not use markdown fences around the response.`;
}

function extractJson(text) {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?|```/gi, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('model returned no JSON');
  return JSON.parse(clean.slice(start, end + 1));
}

function validateStory(item, story) {
  const nodes = Array.isArray(story.nodes) ? story.nodes : [];
  const endings = nodes.filter((node) => node.isEnding);
  const bodyChars = nodes.reduce((sum, node) => sum + String(node.body || '').length, 0);
  const minimumChars = item.language === 'zh' ? 5000 : 18000;
  if (nodes.length !== 11 || endings.length !== 3) throw new Error(`incomplete story (${nodes.length} nodes, ${endings.length} endings)`);
  if ((story.meta?.stats || []).length < 3) throw new Error('story needs at least three affection stats');
  if (bodyChars < minimumChars) throw new Error(`story is too short (${bodyChars}/${minimumChars} characters)`);
  if (new Set(endings.map((node) => node.endingId)).size !== 3) throw new Error('romantic endings must be distinct');
  const ids = new Set(nodes.map((node) => node.id));
  for (const node of nodes) for (const choice of node.choices || []) if (!ids.has(choice.next)) throw new Error(`broken choice ${choice.next}`);
  return story;
}

function buildDocuments(item, story) {
  const zh = item.language === 'zh';
  const topicDoc = zh
    ? `# 选题\n\n## 书名\n${item.title}\n\n## 核心钩子\n${item.hook}\n\n## 主题\n${item.themes.join('、')}`
    : `# Story Idea\n\n## Title\n${item.title}\n\n## Hook\n${item.hook}\n\n## Themes\n${item.themes.join(', ')}`;
  const scenePlan = story.nodes.map((node) => {
    const exits = (node.choices || []).map((choice) => `${choice.text} → ${choice.next}`).join(' | ');
    return `- ${node.id} · ${node.chapter} · ${node.title}${exits ? `: ${exits}` : ''}`;
  }).join('\n');
  const designDoc = zh
    ? `# 故事设计\n\n## 一句话简介\n${story.meta?.logline || item.hook}\n\n## 目标读者\n${item.gender === 'female' ? '女性向' : '男性向'}\n\n## 主题与气质\n${item.themes.join('、')}\n\n## 互动结构\n${scenePlan}`
    : `# Story Design\n\n## Logline\n${story.meta?.logline || item.hook}\n\n## Audience\n${item.gender === 'female' ? 'Women' : 'Men'}\n\n## Themes and tone\n${item.themes.join(', ')}\n\n## Interactive structure\n${scenePlan}`;
  const chaptersDoc = `${zh ? '# 章节与节点' : '# Chapters and Nodes'}\n\n${scenePlan}`;
  const styleDoc = zh
    ? '# 已锁定文风\n\n电影化沉浸叙事；第二人称；具体场景、克制对话、选择后果清晰。'
    : '# Locked Style\n\nCinematic immersive prose in second person, with concrete scenes, restrained dialogue, and legible consequences.';
  const proseDoc = `===STORY_PATCH===\n${JSON.stringify(story)}\n===END_STORY_PATCH===`;
  return { topicDoc, designDoc, chaptersDoc, styleDoc, proseDoc };
}

function recommendPrompt(item, designDoc) {
  const language = item.language === 'zh' ? '简体中文' : 'English';
  return `You are Spark's novel recommendation agent. Analyze the story design below. Return strict JSON only with gender (female, male, or all), tags (exactly 5 or 6 concise tags), and a vivid spoiler-light summary. Write tags and summary in ${language}.\n\n${designDoc}`;
}

async function complete(apiKey, model, prompt, maxTokens = 12000) {
  const reasoningConfig = model.includes('max-prime')
    ? { enabled: true, max_tokens: Math.min(2048, Math.floor(maxTokens / 4)), exclude: true }
    : { enabled: false, exclude: true };
  const payload = JSON.stringify({ model, stream: false, temperature: .72, max_tokens: maxTokens, response_format: { type: 'json_object' }, reasoning: reasoningConfig, messages: [
    { role: 'system', content: 'Follow the requested schema exactly. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ] });
  const response = await request(apiKey, payload);
  if (response.status >= 400) throw new Error(`OpenRouter ${response.status}: ${response.body.slice(0, 300)}`);
  const envelope = JSON.parse(response.body);
  const message = envelope.choices?.[0]?.message || {};
  const visible = String(message.content || '');
  const reasoning = String(message.reasoning_content || message.reasoning || '');
  try {
    return extractJson(visible || reasoning);
  } catch (error) {
    console.error('  response diagnostics', {
      finish: envelope.choices?.[0]?.finish_reason,
      messageKeys: Object.keys(message),
      contentLength: visible.length,
      reasoningLength: reasoning.length,
      usage: envelope.usage,
    });
    throw error;
  }
}

function excerptFrom(story) {
  const start = story.nodes.find((node) => node.id === story.meta.start) || story.nodes[0];
  return String(start?.body || '').slice(0, 900);
}

async function publishAll(env, records, model) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id').limit(1).single();
  if (profileError || !profile) throw new Error(`No publishing profile: ${profileError?.message || 'missing'}`);
  const probe = await supabase.from('publications').select('language, recommendation_summary').limit(1);
  if (probe.error) throw new Error(`Database migration required before publishing: ${probe.error.message}`);
  const current = await supabase.from('publications').select('id,title,logline,audience,tag_path,design_doc,prose_doc,language,recommendation_summary,recommendation_tags');
  if (current.error) throw new Error(current.error.message);
  for (const publication of current.data || []) {
    const sample = `${publication.title || ''}${publication.logline || ''}${publication.prose_doc || ''}`.slice(0, 1600);
    const language = /[\u3400-\u9fff]/.test(sample) ? 'zh' : 'en';
    if (publication.recommendation_summary && (publication.recommendation_tags || []).length >= 5 && publication.language === language) continue;
    const legacyItem = { language, gender: publication.audience === 'female' || publication.audience === 'male' ? publication.audience : 'all' };
    const source = publication.design_doc || publication.logline || sample;
    let recommendation;
    try {
      recommendation = await complete(env.OPENROUTER_API_KEY, 'qwen/qwen3.8-omni-flash', recommendPrompt(legacyItem, source.slice(0, 7000)), 1200);
    } catch {
      const fallbacks = language === 'zh'
        ? ['互动叙事', '命运选择', '多结局', '角色成长', '沉浸体验']
        : ['Interactive fiction', 'Choices matter', 'Multiple endings', 'Character growth', 'Immersive'];
      recommendation = {
        gender: legacyItem.gender,
        tags: [...new Set([...(publication.tag_path || []), ...fallbacks])].slice(0, 6),
        summary: publication.logline || source.replace(/[#*_>`\[\]]/g, '').replace(/\s+/g, ' ').slice(0, language === 'zh' ? 180 : 320),
      };
    }
    const updated = await supabase.from('publications').update({ language, recommendation_gender: recommendation.gender, recommendation_tags: recommendation.tags, recommendation_summary: recommendation.summary }).eq('id', publication.id);
    if (updated.error) throw new Error(updated.error.message);
    console.log(`recommended existing publication ${publication.id}`);
  }
  for (const record of records) {
    const item = record.item;
    const result = record.result;
    const story = record.story;
    const recommendation = record.recommendation;
    const { data: existing } = await supabase.from('stories').select('id').eq('user_id', profile.id).eq('topic_title', `[launch:${item.slug}]`).maybeSingle();
    let storyId = existing?.id;
    const storyPayload = { user_id: profile.id, title: item.title.replace(/^[《]|[》]$/g, ''), topic_title: `[launch:${item.slug}]`, audience: item.gender, tag_path: recommendation.tags, topic_doc: result.topicDoc, design_doc: result.designDoc, chapters_doc: result.chaptersDoc, style_doc: result.styleDoc, style_name: item.language === 'zh' ? '电影化沉浸叙事' : 'Cinematic immersive prose', prose_doc: result.proseDoc, messages: [] };
    if (storyId) {
      const updated = await supabase.from('stories').update(storyPayload).eq('id', storyId);
      if (updated.error) throw new Error(updated.error.message);
    } else {
      const inserted = await supabase.from('stories').insert(storyPayload).select('id').single();
      if (inserted.error) throw new Error(inserted.error.message);
      storyId = inserted.data.id;
    }
    const publication = { story_id: storyId, author_id: profile.id, status: 'published', title: story.meta.title || item.title, logline: story.meta.logline || item.hook, excerpt: excerptFrom(story), chapter: story.nodes[0]?.chapter || (item.language === 'zh' ? '序章' : 'Prologue'), word_count: result.proseDoc.split(/\s+|(?=[\u4e00-\u9fff])/).filter(Boolean).length, audience: item.gender, tag_path: recommendation.tags, topic_doc: result.topicDoc, design_doc: result.designDoc, chapters_doc: result.chaptersDoc, style_doc: result.styleDoc, prose_doc: result.proseDoc, language: item.language, recommendation_gender: recommendation.gender, recommendation_tags: recommendation.tags, recommendation_summary: recommendation.summary };
    const saved = await supabase.from('publications').upsert(publication, { onConflict: 'story_id' });
    if (saved.error) throw new Error(saved.error.message);
    console.log(`published ${item.slug}`);
  }
}

async function main() {
  const env = loadEnv(await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8'));
  if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is missing');
  // Long, schema-heavy launch assets need a non-reasoning model so the output
  // budget is spent on the actual novel rather than hidden chain-of-thought.
  const model = process.env.OPENROUTER_LIBRARY_MODEL || env.OPENROUTER_LIBRARY_MODEL || 'qwen/qwen3.8-max-prime';
  const outputDir = path.join(process.cwd(), 'output', 'romance-library');
  await fs.mkdir(outputDir, { recursive: true });
  const shardCount = Math.max(1, Number.parseInt(process.env.LIBRARY_SHARD_COUNT || '1', 10) || 1);
  const shardIndex = Math.max(0, Number.parseInt(process.env.LIBRARY_SHARD_INDEX || '0', 10) || 0);
  const selected = CATALOG.filter((_, index) => index % shardCount === shardIndex);
  const records = [];
  for (let index = 0; index < selected.length; index++) {
    const item = selected[index];
    const file = path.join(outputDir, `${item.slug}.json`);
    let saved;
    try {
      const raw = await fs.readFile(file, 'utf8');
      const normalized = raw.replaceAll('女仄作', '女仵作').replaceAll('沈仄作', '沈仵作');
      saved = JSON.parse(normalized);
      if (normalized !== raw) await fs.writeFile(file, normalized);
      validateStory(item, saved.story);
      console.log(`[${index + 1}/${selected.length}] cached ${item.slug}`);
    } catch {
      console.log(`[${index + 1}/${selected.length}] generating ${item.slug}`);
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const story = validateStory(item, await complete(env.OPENROUTER_API_KEY, model, storyPrompt(item)));
          const result = buildDocuments(item, story);
          const recommendation = await complete(env.OPENROUTER_API_KEY, model, recommendPrompt(item, result.designDoc), 900);
          saved = { item, result, story, recommendation, generatedAt: new Date().toISOString() };
          await fs.writeFile(file, `${JSON.stringify(saved, null, 2)}\n`);
          break;
        } catch (error) {
          lastError = error;
          console.error(`  attempt ${attempt}: ${error.message}`);
        }
      }
      if (!saved) throw lastError;
    }
    records.push(saved);
  }
  if (shardCount === 1) {
    await fs.writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(records.map(({ item, recommendation, story }) => ({ ...item, recommendation, nodes: story.nodes.length })), null, 2)}\n`);
  }
  if (process.argv.includes('--publish')) await publishAll(env, records, model);
  console.log(`complete: ${records.length} stories`);
}

main().catch((error) => { console.error(error); process.exit(1); });
