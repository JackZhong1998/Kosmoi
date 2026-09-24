===SHOT_JOB===
{
  "shot_id": "SH-p02b-01",
  "node_id": "p02b",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "发现",
  "camera_move": "locked-off",
  "assets": ["PROP-record-fake", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue", "DETAIL-fake-pencil-mark", "SET-shelf-row-3", "CHAR-player"],
  "refs": ["PROP-record-fake", "DETAIL-fake-no-emboss", "DETAIL-fake-ink-blue", "DETAIL-fake-pencil-mark", "SET-shelf-row-3"],
  "start_state": "唱片在主角左手、背面朝上，拇指压在标签边缘",
  "end_state": "唱片仍在左手、背面朝上，拇指位置不变，标签反光角度略变",
  "t2v_prompt": "Extreme close-up of the back of a black vinyl record filling the frame, held by a left hand, thumb pressing the label edge. The label paper is off-white cream, flat and matte with no embossing texture. A faint pencil line runs from the lower-left of the label toward the center, about two centimeters, broken and intermittent. A catalogue number is printed at the upper right in bright, floating blue ink that looks added later, more vivid than normal print blue. Light comes from the upper left, leaving a thin sheen on the label surface. Background is a blurred dark brown wooden shelf and bracket, dark to silhouette only. Locked-off camera, no movement. Shallow depth of field, long-lens isolation, high angle about thirty degrees.",
  "i2v_prompt": "The record stays exactly as framed, back facing up in the left hand. The thumb presses lightly on the label edge once; the record does not move. Only the thin sheen on the label shifts slightly as the thumb pressure changes. No camera movement, locked off. No other motion. Keep the cream label flat and unembossed, the blue catalogue number bright and floating, and the faint broken pencil line visible.",
  "must_keep": "无压纹、蓝油墨编号、浅铅笔痕三特征同框可辨；锁定不运动",
  "acceptance": "画面里必须同时看清「无压纹」「蓝油墨编号」「浅铅笔痕」三样，缺一不可",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-02",
  "node_id": "p02b",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "逼近",
  "camera_move": "slow dolly in 0.3m",
  "assets": ["CHAR-player", "PROP-record-fake", "SET-shelf-row-3", "SET-shelf-row-4", "LIGHT-ceiling-se", "LIGHT-ceiling-ne-dead", "LOOK-player-default"],
  "refs": ["CHAR-player", "PROP-record-fake", "SET-shelf-row-3", "SET-shelf-row-4", "LOOK-player-default"],
  "start_state": "主角低头看唱片，身体侧对镜头",
  "end_state": "主角抬头看向右后方，唱片略抬，嘴张开",
  "t2v_prompt": "Medium close shot of a man standing before the third row of record shelves, body turned side-on to camera, face rotating toward the rear right of frame. He holds the fake record in his left hand, back facing outward. His right shoulder presses slightly forward. Foreground left is the blurred edge of the third shelf and a row of record spines. Midground is his upper body filling about half the frame. Background is the depth between shelf rows, ending in a dark dead-light zone at the northeast corner. Warm tungsten light from his upper right; his left face falls into shadow, his right cheek catches thin light. His brow is slightly furrowed, mouth just opening. Slow dolly in about thirty centimeters, starting with the foreground shelf in frame, ending with the foreground shelf out of frame.",
  "i2v_prompt": "The man does not move his feet. He turns his face from the record toward the rear right of frame, lifting the record slightly so its back faces that direction. His mouth opens as if speaking. The slow dolly in continues about thirty centimeters; the foreground shelf edge slides out of frame, leaving only his upper body and the background depth. Warm light from the upper right stays constant, left face in shadow. Keep the record back facing outward in his left hand.",
  "must_keep": "左手赝品背面朝外；视线落画面右后方；缓推0.3米不改锁定",
  "acceptance": "观众必须看清他左手拿的是背面朝外的赝品，且他看的是画面右后方的人",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-03",
  "node_id": "p02b",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "拒绝",
  "camera_move": "locked-off",
  "assets": ["CHAR-cheng", "PROP-pen", "LOOK-cheng-agent", "SET-shelf-row-2", "LIGHT-ceiling-sw"],
  "refs": ["CHAR-cheng", "PROP-pen", "LOOK-cheng-agent", "SET-shelf-row-2"],
  "start_state": "笔在程知遥右手、笔尖朝下",
  "end_state": "笔在外套内袋内，右手空，手指从袋口抽开",
  "t2v_prompt": "Close-up of a woman's hands, frame cut at mid-forearm. Her right hand holds a pen, nib down, guiding it into the inside breast pocket of a dark navy coat. The pocket opening sits at the right of frame; about one centimeter of white shirt cuff shows. Her movement is unhurried: the pen enters the pocket mouth first, then the whole pen disappears, and her fingers withdraw last from the opening. Background is blurred shelves and warm light, a dark brown wash. Light from the upper left falls on the back of her hand and the pen barrel, knuckles clearly defined. Locked-off camera, no movement. Long-lens isolation, shallow depth of field.",
  "i2v_prompt": "The pen is already in her right hand, nib down. She slides it into the inside breast pocket of the dark navy coat; the pen enters the opening, sinks fully inside, and her fingers withdraw from the pocket mouth last. Her left hand stays out of frame. Her gaze does not follow the pen; she looks off-frame toward the man. Locked-off camera, no movement. Keep the white shirt cuff and the pocket opening at frame right.",
  "must_keep": "笔完整没入外套内袋；不是口袋外、不是换手；锁定不运动",
  "acceptance": "必须看清笔进的是外套内袋，不是口袋外或手里换手",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-04",
  "node_id": "p02b",
  "branch": "trunk",
  "duration_sec": 5,
  "dramatic_verb": "试探",
  "camera_move": "pan 30°",
  "assets": ["CHAR-cheng", "SET-shelf-row-2", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-gap", "LIGHT-ceiling-ne-dead", "LIGHT-ceiling-sw", "LOOK-cheng-agent"],
  "refs": ["CHAR-cheng", "SET-shelf-row-2", "SET-shelf-row-3", "SET-shelf-row-4", "SET-shelf-gap", "LOOK-cheng-agent"],
  "start_state": "她右手垂在身侧，站在第二排货架旁",
  "end_state": "右手抬在半空、划完半圈，脸转向主角",
  "t2v_prompt": "Medium shot of a woman standing beside the second row of record shelves, body half-turned to camera, face toward the left of frame where the man stands. She raises her right arm and sweeps it in a half-circle from left to right, fingertips passing across the second, third, and fourth shelf rows. Foreground right is the blurred shelf edge and record spines. Midground is her upper body and raised arm. Background is the depth between shelf rows and the dark dead-light zone at the northeast corner. Warm light from her upper left; her right face is dim. Her mouth is flat, eyes moving from the shelves to the man. Camera pans about thirty degrees from left to right, starting on her and the second shelf, ending on her with the fourth shelf and the dark dead-light zone behind.",
  "i2v_prompt": "She does not move her feet. She raises her right arm and sweeps it in a half-circle from left to right, fingertips crossing the shelf rows. Her left hand stays at her side. Her eyes move from the shelves to the man, and she speaks without looking at him. The camera pans about thirty degrees from left to right, starting with her and the second shelf, ending with her, the fourth shelf, and the dark dead-light zone in the background. Warm light from the upper left stays constant.",
  "must_keep": "pan约30度；指向整排货架；后景坏灯暗区入画",
  "acceptance": "pan 必须让观众看见她指的是整排货架，不是单张唱片；后景坏灯暗区要入画",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-05",
  "node_id": "p02b",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "停住",
  "camera_move": "tracking 1m",
  "assets": ["CHAR-cheng", "SET-counter", "LIGHT-counter-lamp", "SET-door-front", "LIGHT-street-leak", "SET-floor", "LOOK-cheng-agent"],
  "refs": ["CHAR-cheng", "SET-counter", "LIGHT-counter-lamp", "SET-door-front", "LIGHT-street-leak", "LOOK-cheng-agent"],
  "start_state": "她站在货架旁、右手抬着",
  "end_state": "右髋靠台角、右手插袋、脸朝主角",
  "t2v_prompt": "Medium shot of a woman walking from the shelves toward the checkout counter, camera following her for two steps. Foreground left is the counter edge and the warm glow of a counter lamp. Midground is her entering frame side-on, then her right hip settling against the corner of the counter. Background is the south wall shop door and cold street light leaking through the door gap. She slides her right hand back into her coat pocket, shoulder line level. The counter lamp lights her from lower right, giving a warm edge to her jaw and neck while the upper face stays dim. Tracking camera follows about one meter over two steps, starting with her full body and shelf background, ending with her hip against the counter corner, shelves out of frame, only counter and door behind.",
  "i2v_prompt": "She walks two steps from the shelves to the counter; the camera tracks with her about one meter. She settles her right hip against the corner of the counter, not the countertop, and slides her right hand back into her coat pocket. Her gaze stays toward the man. The counter lamp from lower right keeps a warm edge on her jaw and neck. The tracking move ends with the shelves out of frame, leaving the counter and the shop door with cold street light behind her. Keep the door and the street light visible.",
  "must_keep": "跟两步约1米；靠的是台角不是台面；后景店门与冷街灯入画",
  "acceptance": "必须看清她是从货架走到柜台，且靠的是台角不是台面；后景店门与冷街灯要入画",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-06",
  "node_id": "p02b",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "判定",
  "camera_move": "slow dolly in 0.4m",
  "assets": ["CHAR-player", "PROP-record-fake", "SET-shelf-row-3", "LIGHT-ceiling-se", "LIGHT-ceiling-ne-dead", "LOOK-player-default"],
  "refs": ["CHAR-player", "PROP-record-fake", "SET-shelf-row-3", "LOOK-player-default"],
  "start_state": "他眉头微蹙、嘴微张，脸朝右后方",
  "end_state": "眉头收紧、嘴唇抿住、喉结动过，唱片下沉",
  "t2v_prompt": "Close shot of a man's face, frame cut above the chest. He stands before the shelves without moving, face toward the rear right of frame. On hearing the words, his brow tightens first, his throat moves once, and his lips press shut. His left face is in shadow, his right cheek holds thin warm light, and dark shadows sit under his eyes. Foreground lower right is the blurred edge of the fake record in his left hand. Background is the shelf depth and the dark dead-light zone. He says nothing, only listens. Slow dolly in about forty centimeters, starting with the record edge and shelves in frame, ending with only his face and the dark background, the record out of frame.",
  "i2v_prompt": "He does not move his feet. His brow tightens, his throat moves once, and his lips press shut. His left hand lowers the record slightly. The slow dolly in continues about forty centimeters; the foreground record edge slides out of frame, leaving only his face and the dark background. Warm light from the right stays thin, left face in shadow. Keep the dark shadows under his eyes. He must not smile.",
  "must_keep": "缓推0.4米由「要债」触发；落幅看清眼下青影与抿嘴；不能笑",
  "acceptance": "缓推必须由「要债」触发，落幅要看清他眼下青影与抿嘴，不能笑",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-07",
  "node_id": "p02b",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "停住",
  "camera_move": "locked-off",
  "assets": ["CHAR-player", "CHAR-cheng", "SET-counter", "LIGHT-counter-lamp", "SET-door-front", "LIGHT-street-leak", "LOOK-player-default", "LOOK-cheng-agent"],
  "refs": ["CHAR-player", "CHAR-cheng", "SET-counter", "LIGHT-counter-lamp", "SET-door-front", "LIGHT-street-leak"],
  "start_state": "两人对峙站位不变",
  "end_state": "程知遥视线落在主角脸上，主角右肩略前压",
  "t2v_prompt": "Over-the-shoulder medium shot from behind the man's right shoulder. Foreground lower left is the blurred edge of his right shoulder and the back of his head. Midground is a woman standing at the counter, right hip against the counter corner, face toward camera, both hands in her coat pockets, shoulder line level. Background is the warm counter lamp, the south wall shop door, and cold street light through the door gap. She has just finished speaking and looks at the man, neither urging nor moving. The counter lamp lights her from lower right, a warm edge on her jaw. Locked-off camera, no movement.",
  "i2v_prompt": "Both figures hold their positions. The man presses his right shoulder slightly forward. The woman does not move; both hands stay in her coat pockets, right hip against the counter corner, her gaze settling on the man's face. The counter lamp from lower right keeps a warm edge on her jaw. Locked-off camera, no movement. The over-shoulder foreground must be the man's right shoulder, not his left.",
  "must_keep": "过肩前景是主角右肩；她双手插袋、右髋靠台角；锁定不运动",
  "acceptance": "必须看清她双手插袋、右髋靠台角；过肩前景是主角右肩，不能是左肩",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-08a",
  "node_id": "p02b",
  "branch": "p02b-a",
  "duration_sec": 3,
  "dramatic_verb": "试探",
  "camera_move": "locked-off",
  "assets": ["PROP-record-fake", "DETAIL-fake-ink-blue", "DETAIL-fake-pencil-mark", "CHAR-player", "CHAR-cheng", "DETAIL-cheng-scar-ring", "SET-counter", "LIGHT-counter-lamp", "PROP-intent-letter"],
  "refs": ["PROP-record-fake", "DETAIL-fake-ink-blue", "DETAIL-fake-pencil-mark", "DETAIL-cheng-scar-ring", "SET-counter", "LIGHT-counter-lamp"],
  "start_state": "唱片在主角左手、台面左",
  "end_state": "唱片在台面中右、背面朝上，主角左手收回画外左，程知遥拇指停在旧疤上",
  "t2v_prompt": "High-angle close-up of the checkout counter top. A left hand pushes the fake record from the left of frame toward the right, the woman's side. The record slides about twenty centimeters across the dark brown wooden counter and stops at center-right, back facing up, the blue catalogue number and faint pencil line still visible. At the right edge of frame is the woman's hand; she does not take it, her thumb rubbing the old scar on her left ring finger, a pale raised mark on the inner knuckle. Warm counter lamp light from above leaves a thin sheen on the record surface; the wood grain is clear. Locked-off camera, no movement. High angle about sixty degrees, long-lens isolation.",
  "i2v_prompt": "The left hand pushes the record from frame left to center-right; it slides about twenty centimeters and stops. The left hand withdraws out of frame left. The woman's right hand does not take the record; her left thumb rubs the old scar on her left ring finger and stops there. The thin sheen on the record shifts slightly under the warm lamp. Locked-off camera, no movement. Keep the record back facing up with the blue number and pencil line readable, and keep the thumb on the scar.",
  "must_keep": "唱片停在台面中右；程知遥没接；拇指在旧疤上；三特征仍可辨；锁定",
  "acceptance": "必须看清唱片停在台面中右、程知遥没接、拇指在旧疤上；三特征仍可辨",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02b-08b",
  "node_id": "p02b",
  "branch": "p02b-b",
  "duration_sec": 3,
  "dramatic_verb": "判定",
  "camera_move": "locked-off",
  "assets": ["PROP-record-fake", "CHAR-player", "CHAR-cheng", "SET-counter", "LIGHT-counter-lamp", "PROP-intent-letter", "LOOK-cheng-agent"],
  "refs": ["PROP-record-fake", "CHAR-player", "CHAR-cheng", "SET-counter", "LIGHT-counter-lamp", "LOOK-cheng-agent"],
  "start_state": "唱片在主角左手、背面朝上",
  "end_state": "唱片正面朝上扣在台面中左，主角左手收回画外，程知遥视线停在主角脸上",
  "t2v_prompt": "High-angle close-up of the checkout counter top. A left hand turns the fake record face up, then slams it down onto the counter, a hard slap rather than a gentle placement: the edge hits the wood first, then the whole face presses flat. At the right of frame is the lower half of the woman's face and her neck line; her gaze lifts from the record to the man's face and stops. Warm counter lamp light from above; the printed blue on the record face reads darker under the warm light, and the wood grain is clear. Locked-off camera, no movement. High angle about forty-five degrees, long-lens isolation.",
  "i2v_prompt": "The left hand turns the record face up and slams it down onto the counter, edge first, then flat. The left hand withdraws out of frame. The woman's gaze lifts from the record to the man's face and holds for a second; her body does not move. Warm lamp light from above stays constant. Locked-off camera, no movement. Keep the action reading as a slam, not a placement, and keep her lower face and neck in frame.",
  "must_keep": "是「扣」不是「放」；程知遥视线从唱片抬到主角脸并停住；锁定",
  "acceptance": "必须看清是「扣」不是「放」，且程知遥视线从唱片抬到主角脸上并停住",
  "model": "Seedance 2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

请把执行包交给视频 Agent。本阶段不调用模型。