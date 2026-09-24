===SHOT_JOB===
{
  "shot_id": "SH-p03merge-01",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "停住",
  "camera_move": "锁定，无任何运动",
  "assets": ["SCENE-echo-store", "SET-door-front", "SET-door-chain", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1", "SET-shelf-row-2", "SET-floor", "SET-ceiling", "DETAIL-ceiling-light-boundary", "LIGHT-ceiling-ne-dead", "LIGHT-ceiling-sw", "LIGHT-ceiling-se", "CHAR-cheng", "CHAR-player"],
  "refs": ["SCENE-echo-store", "CHAR-cheng", "CHAR-player"],
  "start_state": "程知遥手搭门把未拉；主角在货架侧半步外",
  "end_state": "两人位置不变，主角停住，视线落在程知遥的手上",
  "t2v_prompt": "Wide locked-off shot inside a small Chinese record store at night. Left third: the side of a checkout counter, warm glow from a counter lamp pooling on the corner, small objects on the surface. Center-right: a closed south-wall door with a chain hanging on the inside, a cold glint on the doorbell housing above the frame. Right third: the sides of two dark brown wooden shelf rows receding into depth. A woman in a dark navy coat stands about one meter inside the door, back to camera, three-quarter turned, right hand already resting on the door handle, not pulling. A second figure at the shelves enters frame only as one shoulder and half an arm, standing at the edge of the bright zone between two ceiling lights. The ceiling light boundary cuts diagonally from the upper right; the northeast corner light stays dead. Wood floor grain runs south to north toward the door. Nobody moves except the second figure takes half a step toward the right edge and stops. Camera completely locked off, no pan, no push, no handheld.",
  "i2v_prompt": "The frame is already composed: counter side on the left with its warm lamp, closed door with chain center-right, two shelf rows on the right, the woman at the door with her right hand on the handle, the second figure at the shelf edge. Only performance changes. The woman stays perfectly still, hand on the handle, no pull. The second figure takes half a step toward the right edge of frame and stops, gaze settling on the woman's hand. Warm counter lamp holds steady; the dead northeast corner stays unlit; the cold glint on the doorbell housing does not change. Camera locked off, no movement of any kind.",
  "must_keep": "门、柜台台灯、至少两排货架同框；程知遥右手在门把上；东北角灯不亮；不越轴",
  "acceptance": "一帧内同时看见门、柜台台灯、至少两排货架；程知遥的手在门把上；镜头无运动",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-02",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 5,
  "dramatic_verb": "告知",
  "camera_move": "缓推约0.4米，胸口中近景到肩头近景",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "LIGHT-ceiling-se", "LIGHT-street-leak"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "DETAIL-cheng-scar-ring"],
  "start_state": "她视线在门把，嘴闭；右手搭门把",
  "end_state": "她抬眼看主角方向，嘴刚说完；手始终没离门把",
  "t2v_prompt": "Medium close-up of a woman, framed slightly left, a sliver of door frame and metal doorbell edge on the right. Her face sits at the warm edge of a ceiling light: left cheek slightly darker, right cheek lit. White shirt buttoned to the second button, open dark navy coat. Her gaze first rests on the door handle; she speaks without looking toward camera, then lifts her eyes half an inch toward the other person. A thin scar ring on her left ring finger shows briefly at the bottom edge of frame; her fingers do not touch it. Background is a soft-focus door interior and hanging chain, with a thin cold line of street light leaking through the door gap. Camera slowly pushes in about 0.4 meters, from chest medium close-up to shoulder close-up, the door frame sliding out of the right edge.",
  "i2v_prompt": "The still already shows her medium close-up, slightly left, door frame and doorbell edge on the right, warm light on her right cheek, darker left cheek, white shirt, open navy coat, thin scar ring at the bottom edge, soft-focus chain and a thin cold street-light line behind. Only performance and camera change. Her gaze stays on the door handle, lips closed, then she lifts her eyes half an inch toward the other person as she finishes speaking. Her right hand never leaves the handle, left hand hangs still. Camera slowly pushes in about 0.4 meters, from chest medium close-up to shoulder close-up, the door frame sliding out of the right edge. Light on her face holds steady.",
  "must_keep": "缓推0.4米；门把不出画；DETAIL-cheng-scar-ring至少露一次；左颊暗右颊亮",
  "acceptance": "落幅能看清她抬眼；疤戒至少露一次；门把未出画；推镜方向与幅度符合",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-03",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 2,
  "dramatic_verb": "隐瞒",
  "camera_move": "锁定，无任何运动",
  "assets": ["PROP-bag-cheng", "PROP-folder-kraft", "LOOK-cheng-agent", "SET-door-chain", "LIGHT-street-leak"],
  "refs": ["PROP-bag-cheng", "PROP-folder-kraft", "LOOK-cheng-agent"],
  "start_state": "包静止；条件A外侧鼓硬边扣已扣，条件B外侧平整扣半开",
  "end_state": "包静止，扣的状态被看清；条件A包带被肩顶起1厘米",
  "t2v_prompt": "Insert close-up, slightly high angle, telephoto, flattening the surface. Only the side of a shoulder bag on a woman's right shoulder. Bottom edge of frame: dark navy coat fabric. Top edge: bag strap and metal clasp. Condition A: a rectangular hard edge bulges the outer leather, a kraft folder outline pushing the surface up, clasp fully closed and tongue pressed flat. Condition B: outer surface flat, no hard edge, no bulge visible from the side, clasp half open. Background is soft-focus door interior wood, cold street light leaving a small highlight on the clasp. Camera locked off, no movement.",
  "i2v_prompt": "The still already shows the bag side close-up, coat fabric at the bottom, strap and clasp at the top, soft-focus door wood behind, cold highlight on the clasp. Only micro change. Condition A: the outer leather keeps its rectangular hard edge, clasp closed and flat; the strap lifts about one centimeter as her shoulder shifts. Condition B: outer surface stays flat, clasp half open, no lift. Camera locked off, no movement. Nothing else in frame changes.",
  "must_keep": "条件A外侧硬边加已扣扣；条件B外侧平整加半开扣；两者不混；锁定",
  "acceptance": "条件A看见外侧硬边与已扣扣；条件B看见外侧平整与半开扣；扣的状态最清楚那一帧可剪",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-04",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "清点",
  "camera_move": "pan约30度，从台面摇到货架",
  "assets": ["SET-counter", "LIGHT-counter-lamp", "PROP-record-fake", "PROP-pen", "PROP-intent-letter", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-gap", "CHAR-player"],
  "refs": ["SET-counter", "PROP-record-fake", "SET-shelf-row-3", "CHAR-player"],
  "start_state": "台面被灯罩住；起幅台面占画框下三分之二",
  "end_state": "视线落到货架或台面物件上；落幅货架占画框右三分之二；条件差异被看清",
  "t2v_prompt": "Insert medium shot starting on a checkout counter top, warm counter lamp covering the corner, then panning about 30 degrees east to shelves. Condition knows_fake: a fake record lies on the counter, label up, flat label and blue ink readable under the lamp. Condition p02a: counter bare, only lamp and wood grain; the fake record still sits between shelf rows three and four, label facing out. Condition signed_intent: a pen alone on the counter, nib pointing north, no letter. Otherwise no pen, no letter, just lamp and an empty wood ring. Background shelf sides and an empty gap. The protagonist steps half a step toward the counter, gaze dropping to the surface then lifting to the shelves. Camera pans 30 degrees from counter to shelves, no push.",
  "i2v_prompt": "The still already shows the counter top under the warm lamp, then the shelf side. Condition knows_fake: the fake record lies label up, flat label and blue ink readable. Condition p02a: counter bare, record still between shelf rows three and four. Condition signed_intent: pen alone, nib north. Otherwise bare wood ring. Only the camera pans about 30 degrees east from counter to shelves; the protagonist steps half a step toward the counter, gaze dropping to the surface then lifting to the shelves. Lamp glow holds steady, no flicker.",
  "must_keep": "pan约30度；起幅台面占下三分之二，落幅货架占右三分之二；两个条件不同时出现",
  "acceptance": "一帧内同时交代赝品在哪与笔或意向书在不在台面；pan停住那一帧可剪",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-05",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 5,
  "dramatic_verb": "离开",
  "camera_move": "跟拍，跟她走两步约1.2米",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-bag-cheng", "SET-door-front", "SET-door-chain", "SET-floor", "LIGHT-street-leak", "SOUND-doorbell", "SOUND-door-hinge"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-bag-cheng", "SET-door-front"],
  "start_state": "她手在门把、门关；条件proposed_gig时多一个半握拳动作",
  "end_state": "门开又合，她人在门外，门内只剩门框和冷光缝",
  "t2v_prompt": "Medium shot following a woman from behind as she leaves. She pulls the door handle, the door opens inward a crack, cold street light slices in across the wood floor. She turns sideways and steps out, back line and low ponytail centered, shoulder bag on her right shoulder. Condition proposed_gig: she pauses half a second one meter inside, right hand half-closes then opens, then pulls the door. Outside is dark night street, only the door frame and a hint of street lamp. The doorbell rings once, on the way out. The door closes behind her, the chain swinging lightly. Camera tracks with her two steps, about 1.2 meters, ending with the door frame filling the right half and her back half-cut by the gap.",
  "i2v_prompt": "The still already shows her back, right hand on the handle, door closed, bag on the right shoulder, cold light line at the gap. Only performance and camera. Condition proposed_gig: she pauses half a second, right hand half-closes then opens, then pulls. She pulls the handle, the door opens inward, cold light widens across the floor, she turns sideways and steps out, no look back. The door closes behind her, the chain swings lightly. Camera tracks with her two steps, about 1.2 meters, ending with the door frame filling the right half and her back half-cut. Street light outside stays dim.",
  "must_keep": "跟拍两步约1.2米；门铃只响一次且为出门方向；她的背完整入画一次；出门后不回头",
  "acceptance": "门铃单响且方向为出门；她的背完整入画一次；落幅门框占右半",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-06",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "失去",
  "camera_move": "轻手持，约2厘米呼吸感",
  "assets": ["SCENE-echo-store", "SET-door-front", "SET-door-chain", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1", "SET-shelf-row-2", "SET-floor", "SET-ceiling", "DETAIL-ceiling-light-boundary", "LIGHT-ceiling-ne-dead", "LIGHT-ceiling-nw", "LIGHT-ceiling-sw", "LIGHT-ceiling-se", "LIGHT-street-leak", "CHAR-player"],
  "refs": ["SCENE-echo-store", "SET-door-front", "CHAR-player"],
  "start_state": "门刚关、链在晃；主角半个肩在画框右缘",
  "end_state": "链停，冷光条缩细，主角视线转向收银台",
  "t2v_prompt": "Wide shot of the store interior after the door closes. Center: the inside face of the door, the chain still swinging. Left: counter and warm counter lamp. Right: the dark side of shelf rows one and two. The ceiling light boundary splits the top edge into bright and dark halves; the northeast corner light stays dead while three others still burn, only two visible in frame. On the floor the cold street-light strip shrinks to a thin line. The protagonist stands at the right edge, only half a shoulder and one arm in frame, motionless, gaze moving from the door toward the counter. Very light handheld, about two centimeters of breathing, no big shake.",
  "i2v_prompt": "The still already shows the closed door center, chain swinging, counter and warm lamp left, dark shelves right, ceiling boundary splitting the top, dead northeast corner, thin cold line on the floor, half a shoulder at the right edge. Only micro change. The chain settles to a stop, the cold floor line thins, the protagonist stays still and shifts his gaze from the door toward the counter. Very light handheld, about two centimeters of breathing, no big shake. Warm lamps hold steady; the dead corner stays dark.",
  "must_keep": "轻手持约2厘米；画框内不出现程知遥；东北角灯不亮；冷光条缩细",
  "acceptance": "电流声可听见；画框内无程知遥；链停那一帧可剪",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-07",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 5,
  "dramatic_verb": "发现",
  "camera_move": "pan约20度，随他转身到光下",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-gap", "SET-batch-records", "SOUND-record-friction"],
  "refs": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "DETAIL-fake-no-emboss"],
  "start_state": "唱片在台面或货架原位；起幅唱片在画框右",
  "end_state": "唱片在主角手中，背面朝上，背面空白；落幅唱片在画框正中",
  "t2v_prompt": "Medium close-up to hand close-up, slightly high, telephoto. The protagonist takes a fake record. Condition knows_fake: he lifts it from the counter, label up, the flat label entering frame first, then turns his wrist to the back. Condition p02a: he walks between shelf rows three and four, pulls it from its place, the empty gap showing at the left edge, then turns it over. The record fills the lower half of frame, his hand lower right, warm light from above. The back is blank, no writing. A watch tan line shows at the bottom edge. Background soft-focus shelf wood. Camera pans about 20 degrees with him as he turns into the light, the record moving from right to center.",
  "i2v_prompt": "The still already shows the record in his hands, label up, warm light from above, soft-focus shelf wood behind, watch tan line at the bottom edge. Condition knows_fake: he lifted it from the counter. Condition p02a: he pulled it from between shelf rows three and four, empty gap at the left edge. Only performance and camera. He turns his wrist, the record rolls to its blank back, no writing appears. Camera pans about 20 degrees with him as he turns into the light, the record moving from right to center. Warm light holds steady.",
  "must_keep": "pan约20度；背面真的空；knows_fake与p02a取片位置不同；左手腕表带晒痕露一段",
  "acceptance": "背面空白；两种取片位置可辨；唱片翻到背面那一帧可剪",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-08",
  "node_id": "p03merge",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "判定",
  "camera_move": "tilt约15度，从手落到铅笔痕",
  "assets": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "DETAIL-fake-pencil-mark", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue", "LIGHT-ceiling-se", "SET-floor"],
  "refs": ["PROP-record-fake", "DETAIL-fake-pencil-mark", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue"],
  "start_state": "痕在画框边缘、影子未压；起幅手指占画框上缘",
  "end_state": "痕在画框正中、影子压住痕的一半；最后3秒画面静止",
  "t2v_prompt": "Extreme close-up, slightly high, long lens isolating only a label edge and fingers. A very faint pencil mark about one centimeter long sits at the label edge, as if rubbed and not fully erased. A flat label and blue ink flank it. Fingers at the top edge, knuckles defined, short square nails. A light from behind the protagonist drops his shadow across the record surface, the shadow edge covering half the pencil mark. Background fully soft, only wood tone and a little warm light. Camera tilts about 15 degrees down from his hand to the pencil mark, ending with the mark centered. The last three seconds are nearly still.",
  "i2v_prompt": "The still already shows the extreme close-up of the label edge, faint pencil mark, flat label and blue ink, fingers at the top edge, soft wood background. Only micro change. He turns the record half an inch toward the light; his shadow edge slides down and covers half the pencil mark. Camera tilts about 15 degrees down from his hand to the mark, ending centered. The last three seconds the frame is nearly still, no dialogue, only a very faint current hiss.",
  "must_keep": "tilt约15度；铅笔痕浅且可辨；影子落在痕上；最后3秒无对白且几乎静止",
  "acceptance": "铅笔痕可辨且浅；影子压住痕的一半；影子压住痕那一帧可剪",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-09a",
  "node_id": "p03merge",
  "branch": "choose-a",
  "duration_sec": 4,
  "dramatic_verb": "选择",
  "camera_move": "锁定，无任何运动",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "SET-counter", "LIGHT-counter-lamp"],
  "refs": ["CHAR-player", "LOOK-player-default", "PROP-record-fake"],
  "start_state": "唱片在手中、拉链开；主角无包，唱片夹在左臂与身体之间",
  "end_state": "唱片夹在身侧、拉链拉到一半停住，手指停在拉链头上满1秒",
  "t2v_prompt": "Medium close-up, slightly high, on the protagonist's waist and hands. He has no bag, so he tucks the fake record between his left arm and body, right hand on his jacket zipper. One corner of the record sits at the left edge of frame, right hand on the zipper pull. He pulls the zipper halfway and stops, fingers resting on the pull for one full second, motionless. Background soft-focus counter and warm counter lamp. A watch tan line shows at the bottom edge. Camera locked off, no movement, so the pause can be held.",
  "i2v_prompt": "The still already shows his waist and hands, record corner at the left edge, right hand on the zipper pull, soft-focus counter and warm lamp behind, watch tan line at the bottom edge. Only performance. He pulls the zipper halfway and stops, fingers resting on the pull for one full second without moving, gaze on the pull, not lifting. Camera locked off, no movement. Warm lamp holds steady.",
  "must_keep": "锁定；停住满1秒；唱片在画框内；拉链头可见；主角无包，唱片夹在左臂与身体之间",
  "acceptance": "停住满1秒；唱片在画框内；拉链头可见；手指停在拉链头那一帧可剪",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p03merge-09b",
  "node_id": "p03merge",
  "branch": "choose-b",
  "duration_sec": 4,
  "dramatic_verb": "选择",
  "camera_move": "pan约35度，随他转身从货架摇到收银台",
  "assets": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-gap", "SET-counter", "LIGHT-counter-lamp", "PROP-intent-letter", "PROP-pen"],
  "refs": ["CHAR-player", "LOOK-player-default", "PROP-record-fake", "SET-shelf-gap", "SET-counter"],
  "start_state": "唱片在手中、面朝货架；起幅货架占画框右三分之二",
  "end_state": "唱片回原位、他转身看收银台空位；落幅收银台占画框左三分之二",
  "t2v_prompt": "Medium shot, eye level. The protagonist puts the fake record back between shelf rows three and four, the empty gap at the left edge. His hand in the lower half, label facing out. After placing it he turns, and the camera pans about 35 degrees with him from the shelves to the counter. On the counter the spot where a letter used to sit is now empty; with signed_intent only a pen remains, otherwise nothing. His gaze lands on that empty spot and stops. Background warm counter lamp and soft-focus shelf wood. Camera pans 35 degrees, no push.",
  "i2v_prompt": "The still already shows his hand placing the record back between shelf rows three and four, empty gap at the left edge, label facing out, warm counter lamp and soft shelf wood behind. Only performance and camera. He sets the record down, turns, and the camera pans about 35 degrees with him from shelves to counter. On the counter the letter spot is empty; with signed_intent only the pen remains. His gaze lands on the empty spot and stops. Warm lamp holds steady, no push.",
  "must_keep": "pan约35度；唱片回到SET-shelf-gap原位；落幅能看见收银台空位；signed_intent时只剩笔，未设时全空",
  "acceptance": "唱片回原位；落幅可见收银台空位；条件差异可辨；视线落到空位那一帧可剪",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

请把执行包交给视频 Agent。本阶段不调用模型。