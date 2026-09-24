===SHOT_JOB===
{
  "shot_id": "SH-p01-01",
  "node_id": "p01",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "清点",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "SET-shelf-row-3", "SET-batch-records", "PROP-record-real", "LIGHT-ceiling-nw", "SOUND-record-friction"],
  "refs": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "SET-shelf-row-3", "SET-batch-records", "PROP-record-real"],
  "start_state": "右手食指在第 1 张唱片脊上，左手腕白痕在画右下角",
  "end_state": "食指停在第 41 张，指腹压住标签下缘",
  "t2v_prompt": "Extreme close-up, locked-off camera, no movement at all. A deep brown wooden shelf edge with a dark metal bracket catching a sliver of warm light sits at frame left. A tight row of record spines stands shoulder to shoulder left to right, handwritten paper labels facing out, corners slightly curled. A right hand enters and the index finger slides steadily across the spine tops, square short nails, clean, then stops on the forty-first record and presses its lower label edge without lifting. At frame bottom right the left wrist shows a pale two-centimetre band where an old watch used to sit, flat, no ridge. Behind, the third shelf row recedes into shadow. Warm tungsten from the upper right rims the hand and the wood. The hand fills roughly a third of the frame. Long-lens isolation, shallow focus, soft natural film grain.",
  "i2v_prompt": "Locked-off camera, absolutely no movement. Treat the still as given: shelf edge, spine row, handwritten labels, warm tungsten direction. Performance only: the right index finger glides left to right at a slow countable pace, then settles on the forty-first label and presses its lower edge without lifting. The palm stays out of frame, the left wrist band stays motionless at frame bottom right. Light fixed, only an imperceptible exposure settle. Keep nail shape, watch-tan band width and paleness, label curl, and spine spacing identical throughout.",
  "must_keep": ["锁定机位，零移动", "右手食指方短甲型", "左手腕白痕宽约两厘米、浅白无凸起", "第 41 张位置可数", "暖钨丝光从右上角"],
  "acceptance": "观众能数出第 41 张的位置，能看见左手腕旧表带白痕",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-02",
  "node_id": "p01",
  "branch": "trunk",
  "duration_sec": 12,
  "dramatic_verb": "打断",
  "camera_move": "handheld",
  "assets": ["CHAR-player", "LOOK-player-default", "PROP-phone-player", "SET-counter", "LIGHT-counter-lamp", "CHAR-landlord", "SOUND-phone-buzz"],
  "refs": ["CHAR-player", "LOOK-player-default", "PROP-phone-player", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-3"],
  "start_state": "右手搭在货架第 41 张唱片脊上，站在画中偏左",
  "end_state": "手机握在右手、屏幕朝下，视线从收银台回到货架",
  "t2v_prompt": "Medium close-up, handheld with a small breathing bob of about two centimetres, triggered by a phone buzzing, no pan and no dolly. Camera sits at the counter side looking over a warm lamp toward the shelf. A man stands slightly left of centre, right hand resting on the forty-first record spine. A phone vibrates in his right rear pocket and the denim twitches in a small patch at frame bottom right. He withdraws the hand from the shelf, reaches to the rear pocket, draws the phone, and raises it to his right ear. Cold screen glow rises from below and carves a hard edge along his jaw and chin; faint blue shadow under the eyes and light stubble read clearly. His left arm hangs at his side. A warm lamp pool glows at frame left rear. He lowers the phone, the cold glow sweeping across his chin, and his gaze travels back to the shelf.",
  "i2v_prompt": "Handheld camera, small breathing bob only, roughly two centimetres of vertical float, no pan, no dolly. Treat the still as given: shelf row, warm lamp pool, denim texture, phone model. Performance: the right hand leaves the record spine, travels to the right rear pocket, draws the phone, presses it to the right ear, then lowers it and ends with the screen facing down. Add only cold screen light sweeping the chin and a faint blue reflection under the eyes. The landlord is voice only, never on screen. Keep the left arm down, the gaze path from shelf to counter and back, and the garment silhouette unchanged. Two seconds of pure ambience after the hang-up.",
  "must_keep": ["轻手持，幅度约 2 厘米，跟呼吸，无 pan 无推轨", "手机从右后袋抽出", "屏幕冷光在脸上形成硬边", "房东只闻其声不出画", "右手结束时屏幕朝下"],
  "acceptance": "手机从右后袋抽出，屏幕冷光在脸上形成硬边；房东只闻其声不见其人",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-03",
  "node_id": "p01",
  "branch": "trunk",
  "duration_sec": 5,
  "dramatic_verb": "发现",
  "camera_move": "tilt down 45 degrees",
  "assets": ["LIGHT-ceiling-ne-dead", "DETAIL-ceiling-light-boundary", "SET-shelf-gap", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-row-5", "SET-ceiling", "SOUND-current-hiss"],
  "refs": ["LIGHT-ceiling-ne-dead", "DETAIL-ceiling-light-boundary", "SET-ceiling", "SET-shelf-gap", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-row-5"],
  "start_state": "视线在坏灯与天花板明暗分界",
  "end_state": "视线停在第三到第五排之间的空位，嘴角绷紧",
  "t2v_prompt": "Medium shot, tilting downward about forty-five degrees from the ceiling toward the shelving, starting high and ending level. Begin at the northeast corner of the ceiling where a dead lamp shade sits unlit beside three glowing warm tungsten bulbs; a hard diagonal boundary of light and dark cuts across the pale off-white matte ceiling plane. The camera arcs down through the ceiling surface and settles on the east shelves between the third and fifth rows, where a single bay stands empty, a short dark stretch of bare wooden channel with no spines. Densely packed records flank the gap on both sides and make the void read colder. Warm light pours from the upper right of frame. The empty slot sits low and slightly off-centre, roughly a quarter of the frame. Natural contrast, fine grain.",
  "i2v_prompt": "Tilt downward about forty-five degrees only, from the ceiling light boundary to the empty shelf bay; no pan and no dolly. Treat the still as given: dead shade beside lit bulbs, ceiling tone, flanking spine rows. Performance is gaze alone: the head tips down, the eyes travel from the ceiling to the empty bay and stop there, the jaw tightening without a spoken line. Light behaviour is fixed; only a slight exposure roll as the frame travels through the ceiling plane. Keep the empty gap between rows three and five, the flanking spine density, and the diagonal light boundary line consistent.",
  "must_keep": ["仅 tilt 向下约 45 度，起幅天花板明暗分界、落幅货架空位", "坏灯不亮、旁边三盏暖钨丝亮", "空位在第三排到第五排之间", "身体不动，只有视线", "电流嘶声为唯一声源"],
  "acceptance": "能同时看见坏灯明暗分界和货架空位；空位在第三排到第五排之间",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-04",
  "node_id": "p01",
  "branch": "trunk",
  "duration_sec": 6,
  "dramatic_verb": "闯入",
  "camera_move": "pan right 30 degrees",
  "assets": ["SET-door-front", "SET-door-chain", "SOUND-doorbell", "SOUND-door-hinge", "CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "PROP-bag-cheng", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1", "SET-shelf-row-2", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-row-5"],
  "refs": ["SET-door-front", "SET-door-chain", "SET-counter", "LIGHT-counter-lamp", "CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "PROP-bag-cheng"],
  "start_state": "门关，店内只有主角",
  "end_state": "门被推开未关严，程知遥站定在门内约 1 米处，视线从左到右扫货架",
  "t2v_prompt": "Wide shot, flat eye level, panning right about thirty degrees, triggered by the door pushing open. Inside a record store, the south door sits at frame left with a small bell above the frame and the interior chain hanging unhooked. A warm counter lamp glows at the front left, pooling on the counter top. Five shelf rows recede from frame right into depth, with one empty bay between rows three and five. The door swings inward, the bell sounds once, and a woman steps through: dark navy blazer left open, white shirt buttoned to the second button, straight black trousers, black flats, hair in a tight low ponytail. A kraft folder in her left hand, a dark leather bag on her shoulder. She does not look at the man behind the counter; she sweeps the shelves left to right and the door stays ajar.",
  "i2v_prompt": "Pan right about thirty degrees only, following the door as it opens and ending with the woman standing inside; no tilt, no zoom. Treat the still as given: store layout, counter lamp pool, five shelf rows, chain unhooked. Performance: the woman enters, settles about a metre past the threshold, folder held low at her left side, bag on shoulder, eyes sweeping the shelves left to right and never meeting the man. The door remains ajar. Light fixed; add only a thin moving highlight along the swinging door edge. Keep blazer state, ponytail tightness, shelf row count, and the empty bay position unchanged.",
  "must_keep": ["仅 pan 向右约 30 度，起幅门框、落幅程知遥站定", "不越轴，机位在轴线西侧", "门未关严、反锁链没挂", "深藏青西装外套不扣、白衬衫扣到第二颗、低马尾很紧", "左手牛皮文件夹、肩背深色皮包"],
  "acceptance": "门内全景，能看见门、收银台、五排货架的关系；程知遥入画，不越轴",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-05",
  "node_id": "p01",
  "branch": "trunk",
  "duration_sec": 10,
  "dramatic_verb": "试探",
  "camera_move": "pan right 60 degrees",
  "assets": ["CHAR-cheng", "CHAR-player", "LOOK-cheng-agent", "LOOK-player-default", "PROP-record-real", "PROP-record-fake", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue", "DETAIL-fake-pencil-mark", "DETAIL-real-handwritten-label", "SET-shelf-row-3", "SOUND-record-friction"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "CHAR-player", "LOOK-player-default", "PROP-record-real", "PROP-record-fake", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue", "DETAIL-fake-pencil-mark", "SET-shelf-row-3"],
  "start_state": "程知遥在货架前，右手从左到右扫货架",
  "end_state": "第二张已放回货架，程知遥手在文件夹上；主角右手拿着第一张",
  "t2v_prompt": "Medium shot, eye level, panning right about sixty degrees, triggered by the woman sweeping the shelves. She stands at the shelves seen from her rear three-quarter, kraft folder in the left hand, right hand travelling left to right across the record spines as if counting. Her left index and middle fingers pinch out the record the man is steadying, she turns it to the back for a beat, then hands it to him. He takes it and studies the handwritten label, corners curled. She draws a second record and holds it back instead of handing it over: no emboss on the rear, catalogue ink a bright blue, a faint pencil line along the label edge. She returns it to the shelf and sets her hand back down on the folder. Warm tungsten, natural contrast, fine grain.",
  "i2v_prompt": "Pan right about sixty degrees only, from shelf row one to row three, ending where she stops; no tilt, no dolly. Treat the still as given: shelf geometry, label curl, spine density, folder texture. Performance: her right hand sweeps left to right, her left hand pinches the first record and passes it over, then extracts the second and puts it back. Emphasise the fake's bright blue ink, the absent emboss, and the pale pencil mark when its back is visible. The first record keeps its real handwritten label. Light fixed, no new sources.",
  "must_keep": ["仅 pan 向右约 60 度，起幅第一排、落幅第三排", "第一张为真品手写标签、边角卷", "赝品背面无压纹、编号油墨偏亮蓝、标签边缘浅铅笔痕", "第二张最终放回货架原位", "END 状态主角右手拿第一张"],
  "acceptance": "能看见赝品无压纹、编号油墨偏亮蓝、标签边缘浅铅笔痕；第一张是真品手写标签",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-06",
  "node_id": "p01",
  "branch": "trunk",
  "duration_sec": 8,
  "dramatic_verb": "逼近",
  "camera_move": "dolly in 0.4m",
  "assets": ["PROP-intent-letter", "PROP-pen", "PROP-folder-kraft", "SET-counter", "LIGHT-counter-lamp", "DETAIL-intent-signature-field", "CHAR-cheng", "LOOK-cheng-agent"],
  "refs": ["PROP-intent-letter", "PROP-pen", "PROP-folder-kraft", "SET-counter", "LIGHT-counter-lamp", "DETAIL-intent-signature-field", "CHAR-cheng", "LOOK-cheng-agent"],
  "start_state": "A4 在文件夹里，收银台全景",
  "end_state": "A4 与笔在收银台，笔尖朝主角；程知遥双手插进外套口袋",
  "t2v_prompt": "Medium close-up of a counter top, camera dollying in about forty centimetres, triggered by sheets of paper being set down. Dark brown wood counter with worn edges and a metal corner plate at frame bottom right. A woman pulls two A4 sheets from a kraft folder and lays them flat; the top edge prints in black sans-serif as an acquisition letter of intent. A blank signature field sits low on the sheet. She sets a pen beside the paper, black body, tip pointing toward the man, nudges it two centimetres further with one finger, then steps back half a pace and slides both hands into her blazer pockets. The warm counter lamp rakes from the upper left, laying a soft sheen on the paper. The man's right hand stays off frame.",
  "i2v_prompt": "Dolly in about forty centimetres only, starting on the counter wide and landing on the signature field and the pen; no pan, no handheld. Treat the still as given: counter grain, metal corner plate, lamp pool, kraft folder. Performance: the woman lays the two sheets, places the pen, nudges it toward the man with one finger, then withdraws both hands into her pockets and steps back half a pace. Light fixed; only a subtle sheen shift across the paper as the camera closes. Keep the blank signature field, the pen tip pointing at the man, and her hands in pockets at the end.",
  "must_keep": ["仅缓推约 0.4 米，起幅收银台全景、落幅签名栏与笔", "意向书签名栏空白", "笔尖朝主角", "程知遥双手插进外套口袋、退后半步", "暖光自左上打下"],
  "acceptance": "意向书和笔在收银台；签名栏空白；笔尖朝主角；程知遥双手入袋",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-07",
  "node_id": "p01",
  "branch": "trunk",
  "duration_sec": 2,
  "dramatic_verb": "停住",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "PROP-pen", "PROP-intent-letter", "DETAIL-player-watch-tan", "DETAIL-intent-signature-field", "SET-counter", "LIGHT-counter-lamp", "SOUND-current-hiss"],
  "refs": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-pen", "PROP-intent-letter", "DETAIL-intent-signature-field", "SET-counter", "LIGHT-counter-lamp"],
  "start_state": "右手在画外",
  "end_state": "右手停在笔上方约 5 厘米，保持不动",
  "t2v_prompt": "Extreme close-up, locked-off camera, absolutely no movement, framed for a clean hold. Counter top local: the signature field at frame left, the pen at centre with the tip pointing right. From frame bottom right a right hand enters and stops about five centimetres above the pen; the fingers do not descend. A small stretch of the pale watch-tan band shows at frame bottom right. Warm lamp light rakes from the upper left, giving the back of the hand a soft sheen, while the pen body carries a thin cold highlight. Behind, counter wood grain falls into shadow. The hand fills about a third of the frame, the pen about a sixth. Long-lens isolation, shallow focus on the fingertips, fine grain.",
  "i2v_prompt": "Locked-off camera, no movement at all, must be pausable for a UI frame. Treat the still as given: counter wood, blank signature field, pen tip direction, lamp pool, watch-tan band. Performance: the right hand arrives from frame bottom right and halts roughly five centimetres above the pen, then holds completely still. No finger descends, no line is spoken. Light is fixed; only an imperceptible exposure settle. Keep the blank signature field, the five-centimetre gap between hand and pen, and the pale band at frame bottom right.",
  "must_keep": ["锁定机位，零移动，可暂停", "手与笔距离 5 厘米，不落笔", "签名栏空白", "能看见左手腕旧表带白痕", "坏灯电流嘶声为唯一声源"],
  "acceptance": "能暂停，手与笔距离 5 厘米；签名栏空白；能看见左手腕旧表带白痕",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-07a",
  "node_id": "p01",
  "branch": "p01-a",
  "duration_sec": 1,
  "dramatic_verb": "选择",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "PROP-pen", "PROP-intent-letter", "DETAIL-intent-signature-field", "SET-counter", "LIGHT-counter-lamp"],
  "refs": ["CHAR-player", "LOOK-player-default", "PROP-pen", "PROP-intent-letter", "DETAIL-intent-signature-field", "SET-counter", "LIGHT-counter-lamp"],
  "start_state": "右手停在笔上方 5 厘米",
  "end_state": "拇指微动，手仍未落笔",
  "t2v_prompt": "Extreme close-up matching the previous setup, locked-off camera, no movement. Counter top local: the signature field at frame left, the pen at centre, tip pointing right. The right hand holds about five centimetres above the pen. Only the thumb moves: it draws slightly inward, the pad angling toward the pen by a few millimetres. The index finger never drops. Warm lamp light from the upper left and the cold pen highlight remain exactly as before, and the counter wood grain and shadow behind are unchanged. The hand fills about a third of the frame. Duration is one second; the beat is a breath, not an action, and every other element stays frozen.",
  "i2v_prompt": "Locked-off camera, no movement whatsoever. Treat the still as given: counter, blank signature field, pen, lamp pool, hand pose held above the pen. Performance is one gesture only: the thumb draws inward a few millimetres, the pad turning toward the pen, while the index finger stays raised and nothing else shifts. Light, colour, and framing are identical to the still. The signature field must remain blank and the hand must not touch the pen. Ambience only, no other motion in the frame.",
  "must_keep": ["锁定机位，零移动", "只拍手将动，不拍签完", "只有拇指微动，食指不落", "签名栏仍空白", "灯光与背景不变"],
  "acceptance": "只拍手将动，不拍签完；签名栏仍空白",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-07b",
  "node_id": "p01",
  "branch": "p01-b",
  "duration_sec": 1,
  "dramatic_verb": "选择",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "DETAIL-fake-pencil-mark", "SET-shelf-row-3", "LIGHT-ceiling-nw"],
  "refs": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "DETAIL-fake-pencil-mark", "SET-shelf-row-3", "LIGHT-ceiling-nw"],
  "start_state": "左手在身侧",
  "end_state": "左手伸向赝品，未碰到",
  "t2v_prompt": "Extreme close-up, locked-off camera, no movement. Shelf row three local: the fake record spine sits at centre with a faint pencil mark along its label edge. From frame bottom left a left hand reaches in toward the fake, fingers not yet touching the spine. The right hand is absent from frame. Warm tungsten falls from the upper right, and the shelf wood sits in shadow at frame left. The fake spine fills about a quarter of the frame, the left hand about another quarter. Duration is one second; the beat is the instant before contact, so the hand stops short and holds. Natural skin, low contrast, fine grain.",
  "i2v_prompt": "Locked-off camera, no movement at all. Treat the still as given: shelf row, fake spine, pencil mark on the label edge, tungsten direction from upper right. Performance is a single reach: the left hand travels from the frame edge toward the fake record and stops short, fingertips still clear of the spine, then holds. Nothing else moves. Keep the fake record in its original shelf position with its bright blue catalogue ink, missing emboss, and visible pale pencil mark unaltered. Light fixed; no new sources.",
  "must_keep": ["锁定机位，零移动", "只拍手将动，未碰到唱片", "赝品仍在货架原位", "能看见标签边缘浅铅笔痕", "右手不入画"],
  "acceptance": "只拍手将动；赝品仍在货架原位；能看见标签边缘浅铅笔痕",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p01-07c",
  "node_id": "p01",
  "branch": "p01-c",
  "duration_sec": 1,
  "dramatic_verb": "选择",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "PROP-intent-letter", "PROP-pen", "SET-counter", "LIGHT-counter-lamp"],
  "refs": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "PROP-intent-letter", "PROP-pen", "SET-counter", "LIGHT-counter-lamp"],
  "start_state": "左手在身侧，意向书未签，笔未被碰",
  "end_state": "左手拿着赝品向收银台移动，未拍到台面",
  "t2v_prompt": "Extreme close-up, locked-off camera, no movement. Counter top local: the letter of intent lies at frame left, the pen at centre with the tip pointing right. From frame bottom left a left hand enters holding the fake record face down, moving toward the counter surface but not yet landing on it. The right hand stays out of frame and away from the pen. Warm lamp light rakes from the upper left and catches a thin warm rim along the record edge. The blank signature field remains visible at frame left. The letter is unsigned and the pen has not been touched. Duration is one second; the beat ends before contact. Natural skin, fine grain, shallow focus on the record edge.",
  "i2v_prompt": "Locked-off camera, no movement at all. Treat the still as given: counter grain, letter of intent, blank signature field, pen tip direction, lamp pool. Performance is a single travel: the left hand carries the fake record face down toward the counter and has not landed yet, then holds short of the surface. The right hand stays out of frame and away from the pen. Light fixed. Keep the letter unsigned, the signature field blank, and the pen untouched throughout. Ambience only, nothing else moves.",
  "must_keep": ["锁定机位，零移动", "只拍手将动，未拍到台面", "意向书未签、签名栏空白", "笔未被碰、笔尖朝向主角", "赝品正面朝下"],
  "acceptance": "只拍手将动；意向书未签；笔未被碰",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

已补齐 p01 全部 10 条 SHOT_JOB（trunk 7 条 + 分支 p01-a / p01-b / p01-c 各 1 条），shot_id 与镜头卡逐条一致，运镜保持原样（锁定 5 条、轻手持 1 条、tilt 1 条、pan 2 条、缓推 1 条），未新增资产 ID，未改写叙事。请把执行包交给视频 Agent。本阶段不调用模型。