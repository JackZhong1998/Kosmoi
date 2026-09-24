===SHOT_JOB===
{
  "shot_id": "SH-p02c-01",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "判定",
  "camera_move": "locked-off",
  "assets": ["PROP-record-fake", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1", "CHAR-player"],
  "refs": ["PROP-record-fake", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1", "CHAR-player"],
  "start_state": "唱片在空中，主角左手未落，右手悬在画框右侧",
  "end_state": "唱片在台面标签朝上，左手掌根压住唱片边缘，右手远离笔",
  "t2v_prompt": "Locked-off close-up, high angle about 45 degrees looking down at a dark brown wood-grain checkout counter worn under warm lamp light. A counterfeit vinyl record drops in from above frame, edge first, hits the counter with a dull thud, label facing up. A left hand slams palm-heel down onto the record edge, five fingers spread wide, knuckles going pale. The right hand stays at frame right, about ten centimeters from a black pen, fingers hovering, not reaching. A warm counter lamp sits front-left, its light raking upward across the back of the hand. Behind the counter the background falls dark; the corner of the first shelf row is soft and out of focus in the upper right. No camera movement at all.",
  "i2v_prompt": "Treat the still as fixed fact: the record already sits label-up on the counter, the left palm-heel pins its edge, five fingers spread, knuckles pale, the right hand hovers about ten centimeters from the pen. Only performance and micro light change: the left hand presses down a fraction harder, knuckles whiten slightly, the record settles flat with no bounce. The right hand stays still, fingers not curling. Warm lamp light holds steady from front-left, no flicker, no shift in exposure. Camera locked off, zero movement, no pan, no push. Background stays dark, first shelf row corner remains soft in the upper right.",
  "must_keep": ["唱片落在收银台台面，不在货架", "标签朝上", "左手掌根压住唱片边缘，五指张开", "右手与笔距离大于 5 厘米", "锁定机位"],
  "acceptance": "唱片在收银台台面，不在货架；右手与笔距离大于 5 厘米",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-02",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 2,
  "dramatic_verb": "停住",
  "camera_move": "slow push-in about 0.4m, waist-up to chest-up",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-2", "SET-shelf-row-3"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-2", "SET-shelf-row-3"],
  "start_state": "她右手在口袋外半曲，文件夹在指间晃动",
  "end_state": "右手停在身侧，文件夹停住，视线在主角脸上",
  "t2v_prompt": "Medium close-up, eye level, slightly long lens isolating the subject. A woman in an open dark navy suit jacket over a white shirt stands across the checkout counter, framed from waist up. Her right hand has just come out of her jacket pocket, fingers still half-curled. Her left hand holds a kraft paper folder that stops mid-air between her fingers and stops swaying. Her face fills the upper third of frame; her eyes first drop to a record on the counter, then lift to the man opposite. Warm counter lamp light from lower-left hits her right cheek, her left cheek stays in shadow. Background is the dark of the second and third shelf rows. Camera pushes in slowly about 0.4 meters, from waist-up to chest-up, triggered by the folder stopping.",
  "i2v_prompt": "Treat the still as fixed fact: she stands across the counter, framed waist-up, open dark navy jacket, white shirt, right hand just out of the pocket with fingers half-curled, left hand holding the kraft folder. Only performance, micro light change, and the specified camera move: the folder stops swaying between her fingers and holds still, her right hand settles at her side, her eyes drop to the record then lift to the man's face. Warm lamp light from lower-left stays steady on her right cheek, left cheek in shadow, no exposure shift. Camera pushes in slowly about 0.4 meters, waist-up to chest-up, smooth and continuous, triggered by the folder stopping. No other movement.",
  "must_keep": ["文件夹在指间停住，不再晃动", "右手已离开口袋", "缓推约 0.4 米，腰以上到胸口以上"],
  "acceptance": "文件夹在指间停住，不再晃动；右手已离开口袋",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-03",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 5,
  "dramatic_verb": "逼近",
  "camera_move": "light handheld, micro breath, no position change",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-row-5", "SET-shelf-gap", "LIGHT-counter-lamp"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-row-5", "SET-shelf-gap", "LIGHT-counter-lamp"],
  "start_state": "她看主角左肩方向，文件夹在指间",
  "end_state": "她看地面，手指扣住文件夹边缘，未换手",
  "t2v_prompt": "Close-up, eye level, slightly long lens. A woman in an open dark navy suit jacket stands alone, framed from the top of her head to her chest. She speaks, her eyes moving: first down to a record, then away as she names numbers. She looks toward the man's left shoulder, then toward the shelves, then down at the floor as the last figure lands. Her left hand holds a kraft folder at the lower-left of frame, fingers hooked over its edge. Warm counter lamp light rises from lower-left onto her face, her right cheek lit, left cheek in shadow. Background is the dark of the third through fifth shelf rows, an empty gap on the shelves soft and out of focus behind her right shoulder. Camera is a very small handheld breath, no position change.",
  "i2v_prompt": "Treat the still as fixed fact: she stands alone, framed head to chest, open dark navy jacket, kraft folder in her left hand at lower-left, fingers hooked on the edge, right hand at her side. Only performance and micro light change: her eyes move in sequence, down to the record, then toward the man's left shoulder, then toward the shelves, then down to the floor as the last words land. Her fingers stay hooked on the folder, no hand change. Warm lamp light from lower-left holds steady, right cheek lit, left cheek in shadow, no flicker. Camera is a very small handheld breath, amplitude tiny, following the rhythm of her speech, no position change, no pan, no push.",
  "must_keep": ["说最后数字时她不看主角", "文件夹在左手，未换手", "轻手持幅度很小，不移动位置"],
  "acceptance": "说最后数字时她不看主角；文件夹在左手，未换手",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-04",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 2,
  "dramatic_verb": "失去",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "refs": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "start_state": "他听，嘴唇抿紧，左手压唱片，右手远离笔",
  "end_state": "喉结动了一下，嘴唇仍抿紧，右手未动",
  "t2v_prompt": "Close-up, eye level, slightly long lens. A man stands behind the checkout counter, framed from the top of his head to his chest. His left hand still pins a counterfeit record on the counter, his right hand stays at the lower-right of frame, far from a pen. His face fills the upper part of frame, eyes fixed on the woman opposite, lips pressed tight. Warm counter lamp light from lower-left hits his right cheek, his left cheek stays in shadow. Background is the dark behind the counter, the corner of the first shelf row soft and out of focus in the upper right. His throat moves once, a single swallow. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: he stands behind the counter, framed head to chest, left hand pinning the counterfeit record, right hand at lower-right far from the pen, lips pressed tight, eyes on the woman. Only performance and micro light change: his throat moves once in a single swallow, his lips stay pressed, his eyes do not shift, his shoulders stay still. The left hand keeps its weight on the record, the right hand does not move toward the pen. Warm lamp light from lower-left holds steady on his right cheek, left cheek in shadow, no flicker, no exposure change. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["右手与笔距离大于 5 厘米", "左手仍在唱片上", "锁定机位，可暂停"],
  "acceptance": "右手与笔距离大于 5 厘米；左手仍在唱片上",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-05",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 2,
  "dramatic_verb": "试探",
  "camera_move": "locked-off",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-shelf-row-4", "SET-shelf-row-5", "LIGHT-counter-lamp"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-shelf-row-4", "SET-shelf-row-5", "LIGHT-counter-lamp"],
  "start_state": "她嘴角平，眼睛看画框右侧暗处",
  "end_state": "嘴角抬了一下，鼻腔笑，肩膀不动",
  "t2v_prompt": "Close-up, side angle about 30 degrees, long lens isolation. A woman's profile fills the frame from brow to chin. She lets out a short nasal laugh, very brief, shoulders completely still, the corner of her mouth lifting only slightly. Her left hand holds a kraft folder at the lower-left of frame, fingers hooked over its edge. Warm counter lamp light from lower-left falls on her right cheek, the shadow of her nose bridge drops across her left cheek. Background is the dark of the fourth and fifth shelf rows. Her eyes do not look at the man; they look into the dark at frame right. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: her profile fills the frame brow to chin, kraft folder in her left hand at lower-left, fingers hooked on the edge, right hand at her side, eyes looking into the dark at frame right. Only performance and micro light change: the corner of her mouth lifts once in a very short nasal laugh, shoulders stay completely still, no head turn, no eye shift to the man. Warm lamp light from lower-left holds steady, nose-bridge shadow across her left cheek, no flicker. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["肩膀不动", "眼睛不看主角", "文件夹在左手", "锁定机位，可暂停"],
  "acceptance": "肩膀不动；笑完立刻切回报价语速",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-06",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "判定",
  "camera_move": "locked-off, axis locked",
  "assets": ["CHAR-player", "CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-row-5", "SET-shelf-gap", "LIGHT-counter-lamp"],
  "refs": ["CHAR-player", "CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-row-5", "SET-shelf-gap", "LIGHT-counter-lamp"],
  "start_state": "她看主角，文件夹在左手",
  "end_state": "她看主角，说完问题，文件夹仍在左手",
  "t2v_prompt": "Over-the-shoulder medium close-up, eye level, slightly long lens. The lower-left of frame holds the man's right shoulder and part of the back of his head, soft and out of focus. The woman stands center-right, framed from the top of her head to her chest, facing him. Her left hand holds a kraft folder at the lower-right of frame, fingers hooked over its edge. Her eyes stay on the man; she pauses half a second, then continues. Warm counter lamp light from lower-left hits her right cheek, her left cheek in shadow. Background is the dark of the third through fifth shelf rows, an empty gap on the shelves soft behind her right shoulder. Camera locked off, axis locked, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: over-the-shoulder framing, the man's right shoulder and part of his head soft in the lower-left, the woman center-right head to chest, kraft folder in her left hand at lower-right, fingers hooked on the edge, right hand at her side. Only performance and micro light change: her eyes stay on the man, she pauses half a second, then her lips move again. The folder stays in her left hand, no hand change. Warm lamp light from lower-left holds steady on her right cheek, left cheek in shadow, no flicker. Camera locked off, axis locked, zero movement, no pan, no push.",
  "must_keep": ["过肩轴线锁死，门—货架—柜台", "文件夹在左手，未换手", "锁定机位"],
  "acceptance": "过肩轴线锁死；文件夹在左手，未换手",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-07",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "停住",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "PROP-pen", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "refs": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "PROP-pen", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "start_state": "他听问题，嘴唇抿紧，右手远离笔",
  "end_state": "他不回答，嘴唇仍抿紧，右手仍远离笔，左手在唱片上",
  "t2v_prompt": "Close-up, eye level, slightly long lens. A man stands behind the checkout counter, framed from the top of his head to his chest. He does not answer. His lips stay pressed tight, his eyes fixed on the woman opposite, his gaze not moving at all. His left hand still pins a counterfeit record on the counter, his right hand stays at the lower-right of frame, far from a black pen. Warm counter lamp light from lower-left hits his right cheek, his left cheek in shadow. Background is the dark behind the counter, the corner of the first shelf row soft and out of focus in the upper right. His breathing is very light, shoulders still. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: he stands behind the counter, framed head to chest, left hand pinning the counterfeit record, right hand at lower-right far from the pen, lips pressed tight, eyes on the woman. Only performance and micro light change: he does not answer, his lips stay pressed, his gaze does not move, his breathing stays very light, shoulders still. The left hand keeps its weight on the record, the right hand does not move toward the pen. Warm lamp light from lower-left holds steady on his right cheek, left cheek in shadow, no flicker. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["右手与笔距离大于 5 厘米", "左手仍在唱片上", "锁定机位，可暂停"],
  "acceptance": "右手与笔距离大于 5 厘米；左手仍在唱片上；可暂停",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-08",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "拒绝",
  "camera_move": "tracking, pan about 1.2m with her two steps",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "SOUND-doorbell", "LIGHT-street-leak", "SET-floor", "LIGHT-counter-lamp"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "SOUND-doorbell", "LIGHT-street-leak", "SET-floor", "LIGHT-counter-lamp"],
  "start_state": "她在收银台前，面向门口",
  "end_state": "她走到门内 1 米处，手未触门把，文件夹在左手",
  "t2v_prompt": "Medium shot, eye level, slightly wide lens. A woman walks two steps from the checkout counter toward the shop door, framed from the top of her head to her knees. Her left hand carries a kraft folder, her right hand hangs at her side. Her back is to the shelves, she faces the door. Warm counter lamp light from the rear-left falls on her back; cold street light leaking through the door crack falls on her face from the front. Background is the south-wall shop door, a doorbell above the frame, a chain lock on the inside. Wood floor grain runs from the bottom of frame to the door. Camera tracks with her, panning about 1.2 meters, from in front of the counter to one meter inside the door.",
  "i2v_prompt": "Treat the still as fixed fact: she walks from the counter toward the door, framed head to knees, kraft folder in her left hand, right hand at her side, back to the shelves, facing the door. Only performance, micro light change, and the specified camera move: she takes two steps and stops one meter inside the door, her hand never reaching the door handle, her gaze on the door. Warm lamp light from rear-left stays on her back, cold street light from the front stays on her face, no flicker. Camera tracks with her, panning about 1.2 meters, from in front of the counter to one meter inside the door, smooth and continuous, no other movement.",
  "must_keep": ["她走到门内 1 米处", "手未触门把", "文件夹在左手", "tracking 平移约 1.2 米"],
  "acceptance": "她走到门内 1 米处；手未触门把；文件夹在左手",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-09",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 2,
  "dramatic_verb": "停住",
  "camera_move": "locked-off",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "LIGHT-street-leak"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "LIGHT-street-leak"],
  "start_state": "她走到门内 1 米处",
  "end_state": "她停下，手未触门把，文件夹在左手",
  "t2v_prompt": "Close-up, high angle about 30 degrees looking down, slightly wide lens. A woman's left hand and a kraft folder fill the frame from her wrist to the folder. Her left hand holds the folder, fingers hooked over its edge. Her right hand sits at frame right, hanging at her side, about twenty centimeters from the door handle. The door handle is in the upper right of frame, metal with a dark bronze corner plate. Cold street light leaking through the door crack falls on the back of her hand from the front. Background is the chain lock on the inside of the door and the door frame. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: her left hand holds the kraft folder, fingers hooked on the edge, her right hand hangs at frame right about twenty centimeters from the door handle, the dark bronze handle in the upper right. Only performance and micro light change: she stands still one meter inside the door, her right hand does not reach the handle, her fingers stay hooked on the folder, no hand change. Cold street light from the front holds steady on the back of her hand, no flicker, no exposure shift. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["手未触门把", "文件夹在左手", "锁定机位，可暂停"],
  "acceptance": "手未触门把；文件夹在左手；可暂停",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-10",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "误导",
  "camera_move": "locked-off",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "SOUND-doorbell", "LIGHT-street-leak", "LIGHT-counter-lamp"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "SOUND-doorbell", "LIGHT-street-leak", "LIGHT-counter-lamp"],
  "start_state": "她停下，侧身对着主角，视线看门口",
  "end_state": "她说完，手未触门把，文件夹在左手",
  "t2v_prompt": "Medium close-up, eye level, slightly long lens. A woman stands one meter inside the shop door, turned sideways to the man, framed from the top of her head to her chest. Her left hand holds a kraft folder, her right hand hangs at her side. Her face sits at frame right, her eyes on the door, not on the man. Cold street light leaking through the door crack falls on her right cheek from the front; warm counter lamp light from the rear-left falls on her back. Background is the south-wall shop door and the doorbell above the frame. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: she stands one meter inside the door, turned sideways to the man, framed head to chest, kraft folder in her left hand, right hand at her side, face at frame right, eyes on the door. Only performance and micro light change: her lips move as she speaks, her eyes stay on the door and never turn to the man, her hand never reaches the door handle, the folder stays in her left hand. Cold street light from the front holds on her right cheek, warm lamp light from rear-left holds on her back, no flicker. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["手未触门把", "文件夹在左手", "她已走到门内 1 米处", "锁定机位，可暂停"],
  "acceptance": "手未触门把；文件夹在左手；她已走到门内 1 米处",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-11",
  "node_id": "p02c",
  "branch": "trunk",
  "duration_sec": 2,
  "dramatic_verb": "选择",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-pen", "PROP-intent-letter", "PROP-record-fake", "SET-counter", "LIGHT-counter-lamp"],
  "refs": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-pen", "PROP-intent-letter", "PROP-record-fake", "SET-counter", "LIGHT-counter-lamp"],
  "start_state": "右手悬在笔上方约十厘米，左手在唱片上",
  "end_state": "右手仍悬空，不伸向笔，左手仍在唱片上",
  "t2v_prompt": "Close-up, high angle about 45 degrees looking down, slightly wide lens. A man's right hand and a black pen fill the frame from wrist to fingers. His right hand hovers above the checkout counter, about ten centimeters from the pen, fingers open and not reaching. The pen sits at the lower-right of frame, black, beside an intent letter. A counterfeit record lies at the lower-left of frame, label facing up. Warm counter lamp light from lower-left falls on the back of his hand. Background is the wood grain of the counter top. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: his right hand hovers above the counter about ten centimeters from the black pen, fingers open and not reaching, the pen at lower-right beside the intent letter, the counterfeit record label-up at lower-left. Only performance and micro light change: the hand stays suspended, fingers do not curl, the hand does not move toward the pen, the left hand stays on the record out of frame. Warm lamp light from lower-left holds steady on the back of his hand, no flicker, no exposure shift. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["右手与笔距离大于 5 厘米", "左手仍在唱片上", "锁定机位，可暂停"],
  "acceptance": "右手与笔距离大于 5 厘米；可暂停；左手仍在唱片上",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-12a",
  "node_id": "p02c-a",
  "branch": "p02c-a",
  "duration_sec": 3,
  "dramatic_verb": "发现",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "SET-counter", "SET-ceiling", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "refs": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "SET-counter", "SET-ceiling", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "start_state": "他说话，左手压唱片",
  "end_state": "右手拇指指向天花板，左手仍在唱片上",
  "t2v_prompt": "Close-up, eye level, slightly long lens. A man stands behind the checkout counter, framed from the top of his head to his chest. His right thumb points up toward the ceiling, the finger straight, the other fingers curled into a fist. His face fills the upper part of frame, eyes on the woman opposite, lips slightly parted as if he has just spoken. Warm counter lamp light from lower-left hits his right cheek, his left cheek in shadow. Background is the dark behind the counter, the corner of the first shelf row soft and out of focus in the upper right. His left hand still pins a counterfeit record on the counter. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: he stands behind the counter, framed head to chest, right thumb pointing up toward the ceiling with the other fingers curled, left hand pinning the counterfeit record, eyes on the woman, lips slightly parted. Only performance and micro light change: his lips settle after speaking, the thumb stays pointed at the ceiling, the left hand keeps its weight on the record, his gaze does not shift. Warm lamp light from lower-left holds steady on his right cheek, left cheek in shadow, no flicker. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["右手拇指指向天花板", "左手仍在唱片上", "锁定机位，可暂停"],
  "acceptance": "右手拇指指向天花板；左手仍在唱片上；setFacts = saw_rooftop",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-12b",
  "node_id": "p02c-a",
  "branch": "p02c-a",
  "duration_sec": 3,
  "dramatic_verb": "试探",
  "camera_move": "locked-off",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "SOUND-doorbell", "LIGHT-street-leak", "LIGHT-counter-lamp"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "SOUND-doorbell", "LIGHT-street-leak", "LIGHT-counter-lamp"],
  "start_state": "她背对主角，站在门内 1 米处",
  "end_state": "她回头，眉微挑，文件夹在手上转半圈，手未触门把",
  "t2v_prompt": "Medium close-up, eye level, slightly long lens. A woman stands one meter inside the shop door and turns her head back toward the man, framed from the top of her head to her chest. Her brows lift slightly, her eyes find the man, her lips stay flat. Her left hand holds a kraft folder at the lower-right of frame, fingers hooked over its edge, and the folder turns half a rotation in her hand. Cold street light leaking through the door crack falls on her right cheek from the front; warm counter lamp light from the rear-left falls on her back. Background is the south-wall shop door and the doorbell above the frame. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: she stands one meter inside the door, framed head to chest, kraft folder in her left hand at lower-right, fingers hooked on the edge, right hand at her side. Only performance and micro light change: she turns her head back toward the man, her brows lift slightly, her eyes find him, her lips stay flat, and the folder turns half a rotation in her left hand. Her hand never reaches the door handle. Cold street light from the front holds on her right cheek, warm lamp light from rear-left holds on her back, no flicker. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["眉微挑", "文件夹在手上转半圈", "手未触门把", "锁定机位，可暂停"],
  "acceptance": "眉微挑；文件夹在手上转半圈；手未触门把",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-13a",
  "node_id": "p02c-b",
  "branch": "p02c-b",
  "duration_sec": 3,
  "dramatic_verb": "隐瞒",
  "camera_move": "locked-off",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "LIGHT-street-leak", "LIGHT-counter-lamp"],
  "refs": ["CHAR-cheng", "LOOK-cheng-agent", "PROP-folder-kraft", "DETAIL-cheng-scar-ring", "SET-door-front", "SET-door-chain", "LIGHT-street-leak", "LIGHT-counter-lamp"],
  "start_state": "文件夹在左手，视线在主角",
  "end_state": "文件夹在右手，左手摸旧疤的动作被压住，视线落到地面一格",
  "t2v_prompt": "Medium shot, eye level, slightly long lens. A woman stands one meter inside the shop door, framed from her waist to the top of her head. She moves a kraft folder from her left hand to her right. Her left hand is at the lower-left of frame, fingers just releasing the folder; her right hand is at frame right, taking it. An old scar on her left ring finger is visible at the lower-left of frame. Her gaze drops to the floor, not on the man. Cold street light leaking through the door crack falls on her right cheek from the front; warm counter lamp light from the rear-left falls on her back. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: she stands one meter inside the door, framed waist to head, the kraft folder moving from her left hand to her right, the old scar on her left ring finger visible at lower-left, her gaze down at the floor. Only performance and micro light change: her left fingers release the folder, her right hand takes it, her left hand starts to reach for the scar and she presses the gesture down, her gaze stays on the floor, not on the man. Cold street light from the front holds on her right cheek, warm lamp light from rear-left holds on her back, no flicker. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["文件夹从左手换到右手", "左手摸旧疤的动作被压住", "视线落到地面一格", "锁定机位，可暂停"],
  "acceptance": "文件夹从左手换到右手；左手摸旧疤的动作被压住；视线落到地面一格；setFacts = asked_cheng_quit",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02c-13b",
  "node_id": "p02c-b",
  "branch": "p02c-b",
  "duration_sec": 2,
  "dramatic_verb": "发现",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "refs": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-record-fake", "SET-counter", "LIGHT-counter-lamp", "SET-shelf-row-1"],
  "start_state": "他问完问题，右手远离笔，左手在唱片上",
  "end_state": "他盯着她左手方向，不说话，右手仍远离笔",
  "t2v_prompt": "Close-up, eye level, slightly long lens. A man stands behind the checkout counter, framed from the top of his head to his chest. His eyes look toward the left of frame, his gaze landing in the direction of the woman's left hand. His lips stay pressed tight, he says nothing. His left hand still pins a counterfeit record on the counter, his right hand stays at the lower-right of frame, far from a pen. Warm counter lamp light from lower-left hits his right cheek, his left cheek in shadow. Background is the dark behind the counter, the corner of the first shelf row soft and out of focus in the upper right. Camera locked off, no movement.",
  "i2v_prompt": "Treat the still as fixed fact: he stands behind the counter, framed head to chest, eyes toward the left of frame in the direction of the woman's left hand, lips pressed tight, left hand pinning the counterfeit record, right hand at lower-right far from the pen. Only performance and micro light change: his gaze settles and holds on that direction, he says nothing, his lips stay pressed, his shoulders stay still, the right hand does not move toward the pen. Warm lamp light from lower-left holds steady on his right cheek, left cheek in shadow, no flicker. Camera locked off, zero movement, no pan, no push.",
  "must_keep": ["视线落在程知遥左手方向", "右手与笔距离大于 5 厘米", "左手仍在唱片上", "锁定机位，可暂停"],
  "acceptance": "视线落在程知遥左手方向；右手与笔距离大于 5 厘米；左手仍在唱片上",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

请把执行包交给视频 Agent。本阶段不调用模型。