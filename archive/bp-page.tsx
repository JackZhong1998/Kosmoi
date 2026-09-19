'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Copy,Gamepad2,Globe2,Share2,Sparkles,Users,Zap} from 'lucide-react';
import './bp.css';

const modes=[['轻度','只想放松','像短剧一样自动播放'],['中度','愿意偶尔参与','只在关键节点做选择'],['重度','想深度沉浸','高频选择、改写角色与剧情']];
const directions=[['女性向恋爱互动','年轻女性','关系选择、专属角色、情绪价值'],['男性向逆袭/生存','年轻男性','身份升级、策略选择、掌控结果'],['悬疑与密室闯关','泛游戏用户','自由解法、即时反馈、多结局'],['改写剧情','短剧与影视用户','换角色、换走向、弥补遗憾']];
const milestones:[string,string[]][]=[
 ['0—6 个月',['上线多款面向年轻男女、核心卖点明确的互动游戏。','验证会员订阅、单款直卖和游戏包三种收入模式。','建立核心指标基线：付费转化率、互动率、完播率、多周目率、留存、单用户内容成本。','沉淀首版互动剧本 SOP 与制作管线。']],
 ['6—12 个月',['上线积分/Token 消费体系。','发布剧本 Agent、导演 Agent 和低门槛创作工具早期版本。','引入首批签约或邀请制创作者，验证 PUGC 供给。','小范围测试按用户输入生成的半开放剧情。']],
 ['12—24 个月',['扩充内容品类与创作者规模。','提升实时生成占比，逐步由固定分支过渡到无限流互动。','建立个性化推荐与内容安全体系。','验证品牌定制剧情和 IP 联运。']],
];

export default function BusinessPlan(){
 const[copied,setCopied]=useState(false);
 const[scrolled,setScrolled]=useState(false);
 const pageRef=useRef<HTMLElement>(null);
 useEffect(()=>{const check=()=>setScrolled((pageRef.current?.scrollTop??0)>36);check();const timer=setTimeout(check,120);return()=>clearTimeout(timer)},[]);
 async function copyWechat(){await navigator.clipboard?.writeText('lifetour2026');setCopied(true);setTimeout(()=>setCopied(false),1800)}
 return <main ref={pageRef} className="bp-page" onScroll={e=>setScrolled(e.currentTarget.scrollTop>36)}>
  <nav className={`bp-nav${scrolled?' compact':''}`}><a href="../" aria-label="返回产品"><ArrowLeft/><span>返回产品</span></a><span className="bp-brand">火花<i/></span><button aria-label="分享" onClick={()=>navigator.share?.({title:'火花｜天使轮商业计划书',url:location.href}).catch(()=>{})}><Share2/><span>分享</span></button></nav>
  <section className="bp-hero"><div className="hero-copy"><span className="eyebrow">ANGEL ROUND · 2026</span><h1>让视频从<br/><em>观看</em>变成<em>参与</em></h1><p>可看、可选、可由用户输入实时生成。</p><a href="#overview">阅读商业计划书<ArrowRight/></a></div><div className="hero-visual"><span>WATCH</span><span>CHOOSE</span><span>GENERATE</span><i/></div></section>
  <section className="bp-metrics"><article><small>核心切入</small><strong>18<sup>亿元</sup></strong><span>互动影游 · 2026E</span></article><article><small>相邻市场</small><strong>677.9<sup>亿元</sup></strong><span>中国微短剧 · 2025</span></article><article><small>长期方向</small><strong>无限流</strong><span>生产即消费</span></article></section>

  <Section id="overview" no="01" en="PROJECT" title="项目概述">
   <Lead>火花是一个互动式的视频平台。从互动影视游戏的生产与消费切入，逐步走向无限视频消费平台。将成为继抖音、红果之后的第三大视频平台。</Lead>
   <div className="path-grid"><Step n="01" title="先做付费意愿已验证的互动影视游戏">建立“可看可选”心智。</Step><Step n="02" title="再把制作经验沉淀为 AI 创作工具">扩大供给。</Step><Step n="03" title="最终升级为实时生成的无限流互动">借助 LLM、视频模型和世界模型，让固定分支走向无限。</Step></div>
   <Callout label="长期目标">生产即消费的 AI 原生视频内容平台。</Callout>
  </Section>

  <Section no="02" en="OPPORTUNITY" title="市场机会：已验证市场 + 两个新变量" dark>
   <Lead>互动影游不是新需求。《完蛋！我被美女包围了！》已验证用户对真人互动叙事、角色关系和结局选择的付费意愿；短剧市场验证了用户对高密度虚构内容的长期消费需求。</Lead>
   <p className="body-copy">火花不做用户教育，而是在已验证市场中加入两个变量：</p>
   <div className="variable-grid"><article><span><Zap/>变量一</span><h3>供给低门槛化、规模化</h3><ul><li>剧本 Agent、导演 Agent、视频生成降低制作成本与周期。</li><li>精品 PGC 可扩展为 PUGC/UGC 供给。</li></ul></article><article><span><Sparkles/>变量二</span><h3>解锁无限消费</h3><ul><li>LLM、视频模型及未来世界模型，让互动从预拍固定分支升级。</li><li>根据用户输入实时生成新角色、新情节、新知识。</li></ul></article></div>
   <p className="formula">两个变量共同扩大 <b>供给</b>、<b>消费时长</b> 和 <b>可服务人群</b>。</p>
  </Section>

  <Section no="03" en="MARKET" title="市场规模">
   <SubTitle>3.1 三层市场口径</SubTitle>
   <div className="market-scales"><MarketScale kicker="核心切入 · 中国互动影游" now="2026E 约 18 亿元" future="2030E 约 37 亿元" note="前 2 年收入基础" ratio="49%"/><MarketScale kicker="相邻 · 中国微短剧" now="2025 年 677.9 亿元" future="2030E 1505.9 亿元" note="可被互动体验逐步渗透" ratio="45%"/><MarketScale kicker="技术扩张 · 全球 AI 视频" now="2026E 55 亿美元" future="2033E 423 亿美元" note="支撑实时生成与全球化" ratio="13%"/></div>
   <p className="source">来源：中信证券引述 DataEye、艾媒咨询、Grand View Research。</p>
   <SubTitle>3.2 火花定义的新市场</SubTitle>
   <Lead>现有互动影游依赖真人拍摄和固定分支。火花加入低成本 AI 供给与无限流互动后，目标市场 = <b>微短剧消费 × 互动渗透率</b>。</Lead>
   <Table heads={['年份','固定分支互动影游基准','AI 互动视频情景']} rows={[["2026E","约 18 亿元","产品验证期"],["2028E","约 26 亿元","约 33—66 亿元"],["2030E","约 37 亿元","约 75—151 亿元"]]}/>
   <p className="source">测算假设：AI 互动视频 2028 年占微短剧市场 3%—6%，2030 年占 5%—10%。这是情景测算，核心变量是互动渗透率。</p>
   <SubTitle>3.3 TAM / SAM / SOM</SubTitle>
   <div className="market-ladder"><article><span>TAM</span><strong>约 1506 亿元</strong><p>中国微短剧代表的虚构视频内容消费市场</p></article><article><span>SAM</span><strong>约 75—151 亿元</strong><p>AI 降本和无限流互动成熟后可服务的市场</p></article><article><span>SOM</span><strong>约 4—15 亿元年收入</strong><p>头部平台取得 SAM 的 5%—10%</p></article></div>
   <Callout label="市场空间">未计入海外发行、创作工具/API 收入和 IP 衍生收入。若完成从内容公司到平台的迁移，火花具备成长为十亿元级年收入平台的空间。</Callout>
  </Section>

  <Section no="04" en="USER VALUE" title="用户爽点" dark>
   <Lead>火花提供短剧无法持续提供的体验：</Lead>
   <div className="value-grid"><Value n="01" title="控制感">我的选择直接改变剧情。</Value><Value n="02" title="参与感">我不是观众，是故事中的角色和推动者。</Value><Value n="03" title="专属感">角色、关系和情节围绕我持续变化。</Value><Value n="04" title="沉浸感">每次选择都得到即时、可视化的内容反馈。</Value></div>
  </Section>

  <Section no="05" en="POSITIONING" title="产品定位">
   <SubTitle>5.1 与抖音、红果的区别</SubTitle>
   <div id="position-map" className="position-map"><span className="axis-y top">主动创造</span><span className="axis-y bottom">被动消费</span><span className="axis-x left">真实世界</span><span className="axis-x right">虚构世界</span><i className="axis-line x"/><i className="axis-line y"/><div className="map-point spark"><Sparkles/><b>火花</b><small>虚构世界，可看可选可生成</small></div><div className="map-point douyin"><b>抖音</b><small>记录真实、被动刷</small></div><div className="map-point hongguo"><b>红果短剧</b><small>虚构故事、被动看</small></div></div>
   <ul className="plain-list"><li><b>抖音：</b>记录和消费真实世界。</li><li><b>红果：</b>观看预先制作的虚构故事。</li><li><b>火花：</b>进入虚构世界，并决定它如何发展。</li></ul>
   <p className="body-copy">火花从第一天建立“可看也可选”心智。不强行把红果用户改造成创作者，而是让同一用户随时调整参与程度。</p>
   <SubTitle>5.2 三种消费强度</SubTitle>
   <div className="mode-grid">{modes.map(m=><article key={m[0]}><small>{m[0]}</small><h3>{m[1]}</h3><p>{m[2]}</p></article>)}</div>
   <Callout label="可调参与">短视频有信息疲劳，互动内容有决策疲劳。火花允许用户在“看”和“玩”之间无缝切换，把疲劳程度变成可调参数。</Callout>
  </Section>

  <Section no="06" en="SOLUTION" title="解决方案：三步走" dark>
   <div className="solution-stack"><StepBlock no="第一步 · 0→1" title="精品互动影视游戏" items={['自研多款面向年轻男女的精品互动游戏。','核心爽点明确：恋爱选择、身份逆袭、生存闯关、改写结局。','验证付费、互动率、完播率、多周目率、留存。','沉淀精品故事制作方法、互动剧本 SOP、用户选择数据和发行能力。']}/><StepBlock no="第二步 · 1→10" title="AI 创作工具扩大供给" items={['剧本 Agent：从一句设定生成角色、冲突、主线和分支。','导演 Agent：完成分镜、角色一致性、视频生成、配音和配乐。','低门槛编辑器：让创作者组合、测试和发布互动内容。','从自制精品扩展到 PUGC/UGC，丰富故事、知识、陪伴等品类。']}/><StepBlock no="第三步 · 10→100" title="无限流互动，实现生产即消费" items={['用户的点击、语言和偏好成为下一段内容的生产信号。','系统实时生成与上下文连续的新视频，不再局限于预拍分支。','故事无限分支：角色、情节和结局根据用户选择持续变化。','知识无限延伸：虚拟讲师按用户水平、问题和偏好继续讲解。','轻度模式自动推进；中度模式只在关键节点互动；重度模式允许高频控制。']}/></div>
   <p className="formula">生产不再发生在消费之前，而是在消费过程中按需完成。</p>
  </Section>

  <Section no="07" en="FIRST CONTENT" title="首批内容方向">
   <div className="content-grid">{directions.map((d,i)=><article key={d[0]}><span>0{i+1}</span><h3>{d[0]}</h3><small>{d[1]}</small><p>{d[2]}</p></article>)}</div><p className="source">首阶段聚焦娱乐内容和强付费意愿，不同时铺开所有场景。</p>
  </Section>

  <Section no="08" en="WHY NOW" title="为什么现在：视频生成成本快速下降">
   <div className="cost-chart"><div className="cost-chart-head"><div><b>15 秒视频成本</b><small>USD · 同一比例尺</small></div><div className="cost-axis"><span>$0</span><span>$0.75</span><span>$1.50</span><span>$2.25</span></div></div><CostRow name="Seedance 2.0" spec="约 720p · 约 US$0.15/秒*" value="约 US$2.25" width="100%"/><CostRow name="MiniMax H3 Max" spec="768p · US$0.08/秒标价" value="US$1.20" width="53.3%"/><CostRow name="H3 Max 发布期促销" spec="768p · US$0.02/秒" value="US$0.30" width="13.3%"/></div>
   <Lead>同档位 15 秒视频生成成本从约 US$2.25 降至 US$1.20；发布期可低至 US$0.30。成本下降与推理提速共同支持更高频、更低门槛的内容供给。</Lead>
   <p className="source">Seedance 2.0 公开报价因渠道与地区不同而变化，此处仅作趋势展示；正式材料应以尽调时官方商务报价统一口径。H3 Max 促销价格截至 2026 年 9 月 14 日。</p>
  </Section>

  <Section no="09" en="BUSINESS MODEL" title="商业模式" dark>
   <Table heads={['阶段','时间','收入模式']} rows={[["内容付费","0—6 个月","会员订阅、单款直卖、游戏包"],["生成消费","6—12 个月","订阅 + 积分/Token，按高级剧情、角色定制和生成次数消费"],["平台商业化","2 年后","原生植入式广告（PPL）、品牌定制剧情、IP 联运"]]}/>
   <Callout label="原则">先用内容收入验证需求和留存，再将生成成本透明映射为积分消费；广告不破坏早期沉浸体验。</Callout>
  </Section>

  <Section no="10" en="FLYWHEEL" title="增长与供给飞轮">
   <ol className="flywheel-list">{['自研精品游戏获取首批付费用户。','用户选择数据反哺剧本和互动机制。','制作经验沉淀为剧本 Agent、导演 Agent 和模板。','创作者门槛下降，内容数量与品类增加。','更多内容带来更多用户、数据与收入。','更强分发和更低生成成本继续扩大供给。'].map((x,i)=><li key={x}><span>{i+1}</span><p>{x}</p></li>)}</ol>
   <Callout label="网络效应">最终形成“创作者供给—用户消费—互动数据—工具优化”的双边网络效应。</Callout>
  </Section>

  <Section no="11" en="MILESTONES" title="里程碑">
   <div className="milestone-list">{milestones.map((m,i)=><article key={m[0]}><span>0{i+1}</span><div><h3>{m[0]}</h3><ul>{m[1].map(x=><li key={x}>{x}</li>)}</ul></div></article>)}</div>
  </Section>

  <Section no="12" en="VALIDATION" title="核心验证指标与证伪条件" dark>
   <div className="validation-grid"><article><h3><Check/>核心指标</h3><ul>{['互动节点触发率与连续互动率','剧情完播率与多周目率','D1 / D7 / D30 留存','付费转化率、ARPPU 与内容回收周期','单分钟有效内容成本','被动模式与主动模式的切换率','创作者首作完成率与有效供给量'].map(x=><li key={x}>{x}</li>)}</ul></article><article><h3><Zap/>证伪条件</h3><ul>{['多款内容上线后，用户仍长期以纯观看为主，关键互动率持续偏低。','互动没有显著提升留存、付费或多周目消费。','实时生成成本下降后，单位经济模型仍无法成立。','AI 生成内容在连续性、角色一致性和剧情质量上无法达到付费标准。'].map(x=><li key={x}>{x}</li>)}</ul></article></div>
  </Section>

  <Section no="13" en="TEAM" title="团队优势">
   <div className="team-card"><img src="../team-avatar.jpg" alt="钟镇杰"/><div><span>创始人 / 核心团队来自剪映 AI 产品一线</span><h3>能把精品内容的制作经验沉淀为工具和平台</h3><ul><li>负责剪映 AI 成片、AI 图片与剪映 Agent 等产品建设。</li><li>理解 AI 内容生产工具、创作者工作流与大规模消费产品。</li><li>能同时推进模型能力产品化、内容生产、增长分发与商业化。</li></ul></div></div>
   <div className="team-tags"><span><Gamepad2/>互动内容</span><span><Sparkles/>AI 产品</span><span><Users/>创作者生态</span><span><Globe2/>增长分发</span></div>
  </Section>

  <Section no="14" en="FUNDRAISING" title="融资用途">
   <div className="funding-ask"><span>天使轮</span><strong>500<sup>万人民币</sup></strong><p>本轮目标融资金额</p></div>
   <Lead>本轮资金主要用于：</Lead>
   <div className="fund-grid">{['首批互动影视游戏的内容制作与发行','核心产品、AI 工程与内容团队建设','剧本 Agent、导演 Agent 和互动编辑器研发','视频生成成本优化、模型评测与安全能力','用户增长与商业化验证'].map((x,i)=><article key={x}><span>0{i+1}</span><p>{x}</p></article>)}</div>
  </Section>

  <section className="bp-close"><span>15 / CLOSING</span><h2>互动影游已经证明用户愿意为<br/>“进入故事并做选择”付费</h2><p>火花将用 AI 把有限分支变成无限供给，把一款游戏扩展为一个新的视频内容平台。</p><a href="../">体验火花<ArrowRight/></a></section>
  <div className="bp-contact"><img src="../team-avatar.jpg" alt="钟镇杰"/><div><small>联系创始人 · 微信</small><b>lifetour2026</b></div><button onClick={copyWechat}>{copied?<><Check/>已复制</>:<><Copy/>复制微信号</>}</button></div>
 </main>
}

function Section({id,no,en,title,dark=false,children}:{id?:string;no:string;en:string;title:string;dark?:boolean;children:React.ReactNode}){return <section id={id} className={`bp-section${dark?' dark':''}`}><header><span>{no} / {en}</span><h2>{title}</h2></header>{children}</section>}
function SubTitle({children}:{children:React.ReactNode}){return <h3 className="sub-title">{children}</h3>}
function Lead({children}:{children:React.ReactNode}){return <p className="lead">{children}</p>}
function Callout({label,children}:{label:string;children:React.ReactNode}){return <div className="callout"><span>{label}</span><p>{children}</p></div>}
function Step({n,title,children}:{n:string;title:string;children:React.ReactNode}){return <article><span>{n}</span><h3>{title}</h3><p>{children}</p></article>}
function Value({n,title,children}:{n:string;title:string;children:React.ReactNode}){return <article><span>{n}</span><h3>{title}</h3><p>{children}</p></article>}
function MarketScale({kicker,now,future,note,ratio}:{kicker:string;now:string;future:string;note:string;ratio:string}){return <article><header><span>{kicker}</span><small>{note}</small></header><div className="scale-row"><b>当前</b><p>{now}</p><i className="current" style={{'--w':ratio} as React.CSSProperties}/></div><div className="scale-row"><b>预测</b><p>{future}</p><i className="future"/></div></article>}
function Table({heads,rows}:{heads:string[];rows:string[][]}){return <div className="data-table"><table><thead><tr>{heads.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}
function StepBlock({no,title,items}:{no:string;title:string;items:string[]}){return <article><span>{no}</span><h3>{title}</h3><ul>{items.map(x=><li key={x}>{x}</li>)}</ul></article>}
function CostRow({name,spec,value,width}:{name:string;spec:string;value:string;width:string}){return <article className="cost-row"><div><b>{name}</b><small>{spec}</small></div><div className="cost-track"><i style={{'--w':width} as React.CSSProperties}/><span>{value}</span></div></article>}
