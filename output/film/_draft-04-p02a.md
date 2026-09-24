===SHOT_JOB===
{
  "shot_id": "SH-p02a-01",
  "node_id": "p02a",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "清点",
  "camera_move": "锁定",
  "assets": ["CHAR-player", "CHAR-cheng", "LOOK-player-default", "LOOK-cheng-agent", "SET-counter", "LIGHT-counter-lamp", "PROP-intent-letter", "PROP-pen", "PROP-folder-kraft", "SET-shelf-row-1", "SET-shelf-gap", "LIGHT-ceiling-ne-dead", "DETAIL-ceiling-light-boundary", "LIGHT-street-leak", "SET-floor"],
  "refs": ["SH-p02a-01"],
  "start_state": "主角右手握笔，笔尖未落纸；程知遥文件夹在左手，扣未扣；意向书摊开，签名栏空白。",
  "end_state": "状态不变，观众已建立柜台、意向书、笔与两人位置的空间关系。",
  "t2v_prompt": "A locked-off medium-wide shot inside a small record shop at night, camera at eye level near the door on the south side, looking north-northwest, wide-angle feel that keeps the counter and shelving in one frame. On the left of frame a wooden cash counter with a lit desk lamp throwing warm light upward, catching only the counter edge and the undersides of two jaws. A blank intent letter lies open center-right on the counter, a pen resting horizontally beside the empty signature line. The player stands right of center in front of the counter, right hand already holding the pen, body leaning slightly forward, left arm hanging loose. Cheng Zhiyao stands left of the counter, a kraft folder in her left hand, unclasped, shoulders level, gaze down on the letter. Behind them east shelving with one empty slot between the third and fifth rows, a counterfeit record still in place. A dead ceiling light in the northeast corner stays dark, its light boundary running into the shop. Cold street light leaks through the door gap onto the player's right shoulder. No camera movement at all.",
  "i2v_prompt": "Treat the still as fixed fact. Hold the camera completely locked off, no pan, no push, no drift. Only micro-life: the desk lamp's warm pool breathes very slightly on the counter edge, the cold street leak on the player's right shoulder stays steady, both people hold their gaze down on the letter with almost imperceptible breathing, the player's right hand keeps the pen poised without touching paper, Cheng Zhiyao's folder stays unclasped in her left hand. No one steps, no one turns. Preserve counter left, shelving right, dead northeast light dark, blank signature line.",
  "must_keep": "收银台在画面左、货架在画面右；意向书摊开签名栏空白；笔横在签名栏旁；主角右手握笔未落纸；程知遥左手文件夹扣未扣；东北角坏灯不亮；街灯冷色在主角右肩。",
  "acceptance": "画面中必须同时看见收银台、意向书、笔、主角右手、程知遥左手文件夹；东北角坏灯不亮；街灯冷色落在主角右肩。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-02",
  "node_id": "p02a",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "判定",
  "camera_move": "锁定",
  "assets": ["CHAR-player", "LOOK-player-default", "DETAIL-player-watch-tan", "PROP-pen", "PROP-intent-letter", "DETAIL-intent-signature-field", "SET-counter", "LIGHT-counter-lamp"],
  "refs": ["SH-p02a-02"],
  "start_state": "笔尖未落纸。",
  "end_state": "笔尖完成最后一笔，墨迹完整。",
  "t2v_prompt": "A locked-off extreme close-up shot from about forty-five degrees above, long-lens isolation with shallow depth of field, camera roughly 1.2 meters above the counter slightly south of it, looking straight down at the signature field. The frame is filled by the signature field of the intent letter, centered. The player's right hand holds the pen, the nib touching the paper, the stroke slow, ink trailing from left to right. The fingers are long, knuckles defined, nails square and short and clean. At the lower-left edge of frame, barely entering, a pale tan band mark from an old watch strap on the left wrist, faint and half-hidden. Warm desk-lamp light falls from above, the paper carrying a slight sheen. Background thrown out of focus, only the dark grain of the counter wood readable. No camera movement.",
  "i2v_prompt": "Treat the still as fixed fact. Hold the camera locked off, no pan, no push, no tilt. Only the writing action moves: the nib stays in contact with the paper and draws slowly from right to left, ink filling the signature field stroke by stroke until the final stroke lands, then the nib lifts a fraction. The warm lamp sheen on the paper shifts very slightly with the pen's shadow. The pale watch-strap mark at the lower-left edge stays just barely visible. Preserve the centered signature field, the shallow focus, the dark counter grain behind.",
  "must_keep": "签名栏在画面中央；笔尖不离开纸面；手指偏长、指节分明、甲型方短；左手腕旧表带白痕在左下角边缘若隐若现；台灯暖光在纸面有轻微反光；背景虚化只见收银台木纹暗部。",
  "acceptance": "签名栏内墨迹完整，笔尖在最后一笔末端；左手腕白痕可见；台灯暖光在纸面有反光。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-03",
  "node_id": "p02a",
  "branch": "trunk",
  "duration_sec": 4,
  "dramatic_verb": "发现",
  "camera_move": "缓推约0.4米，从两人中景推到程知遥中近景，落幅她占画幅约60%",
  "assets": ["CHAR-player", "CHAR-cheng", "LOOK-player-default", "LOOK-cheng-agent", "PROP-pen", "PROP-intent-letter", "PROP-folder-kraft", "SET-counter", "LIGHT-counter-lamp", "LIGHT-street-leak", "SET-shelf-row-1", "SET-shelf-gap", "LIGHT-ceiling-ne-dead"],
  "refs": ["SH-p02a-03"],
  "start_state": "主角右手握笔，笔尖刚离开纸面；程知遥低头看纸，肩线平。",
  "end_state": "主角右手抬笔，身体后仰；程知遥抬眼看向主角，肩线降约一厘米。",
  "t2v_prompt": "A medium shot at eye level inside the record shop, camera south of the counter at about 1.5 meters, looking north-northwest, the player on the right of frame and Cheng Zhiyao on the left. The player has just lifted the pen, body easing back a little. Cheng Zhiyao looks down at the signature line, then her gaze travels from the paper up to the player's face. Her shoulder line drops about a centimeter, the jacket shoulders going from taut to slack. Warm desk-lamp light comes from below onto her jaw, cold street light from the door gap falls on her right shoulder. Behind her the shelving with one empty slot between the third and fifth rows, the dead ceiling light dark. The kraft folder stays in her left hand, unclasped. The camera pushes in slowly, about 0.4 meters, from the two-shot to a medium close on Cheng Zhiyao, ending with her filling roughly sixty percent of frame.",
  "i2v_prompt": "Treat the still as fixed fact. The camera performs one slow dolly push in, about 0.4 meters, from the two-shot toward Cheng Zhiyao, ending with her at roughly sixty percent of frame; no pan, no tilt, no handheld. Performance: the player's right hand lifts the pen clear of the paper and his torso eases back about five centimeters; Cheng Zhiyao's gaze travels from the paper up to the player's face, and her shoulder line settles about a centimeter lower, jacket shoulders going slack. Warm lamp light on her jaw and cold street light on her right shoulder stay constant. Preserve the unclasped folder in her left hand, the shelving gap, the dark northeast light.",
  "must_keep": "主角在画面右、程知遥在画面左；程知遥肩线降约一厘米可见；视线从纸面移到主角脸上；主角右手抬笔笔尖离开纸面；文件夹仍在左手扣未扣；坏灯不亮。",
  "acceptance": "程知遥肩线降约一厘米可见；她视线从纸面移到主角脸上；主角右手抬笔，笔尖离开纸面。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-04",
  "node_id": "p02a",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "停住",
  "camera_move": "pan约30度，从文件夹正面摇到扣子位置，落幅扣子占画面中心",
  "assets": ["CHAR-cheng", "LOOK-cheng-agent", "DETAIL-cheng-scar-ring", "PROP-folder-kraft", "SET-counter", "LIGHT-counter-lamp", "LIGHT-street-leak"],
  "refs": ["SH-p02a-04"],
  "start_state": "文件夹打开，扣未扣。",
  "end_state": "文件夹合上，扣已扣。",
  "t2v_prompt": "An extreme close-up from about thirty degrees above, long-lens isolation, camera roughly 1.3 meters above and left of the counter, looking down at Cheng Zhiyao's left hand. Center of frame: her left hand and the kraft folder. The folder goes from held-open to closed, two fingers pressing the clasp shut. On the inner side of the second knuckle of her left ring finger a faint pale raised scar is visible. The folder clasp is dark matte bronze. Warm desk-lamp light falls from above onto the folder edge, cold street light from the door gap lands on the back of her hand. Background thrown out of focus, dark counter grain. Her right hand enters frame and two fingers close the clasp. The camera pans about thirty degrees, from the face of the folder across to the clasp, ending with the clasp centered in frame.",
  "i2v_prompt": "Treat the still as fixed fact. The camera performs one pan of about thirty degrees, from the folder face across to the clasp, ending with the clasp centered; no push, no tilt, no handheld. Performance: her left hand closes the folder, her right hand enters and two fingers press the clasp shut with a single firm motion, and the pale scar on the inner second knuckle of her left ring finger is exposed during the movement. Warm lamp light on the folder edge and cold street light on the back of her hand stay constant. Preserve the dark matte bronze clasp, the shallow focus, the dark counter grain behind.",
  "must_keep": "文件夹从握持转为合上、两指扣上扣；左手无名指第二指节内侧浅白旧疤可见；扣子金属暗铜色哑光；台灯暖光在文件夹边缘、冷街灯在手背；背景虚化。",
  "acceptance": "文件夹扣已扣；左手无名指旧疤可见；扣子金属暗铜色哑光。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-05",
  "node_id": "p02a",
  "branch": "trunk",
  "duration_sec": 5,
  "dramatic_verb": "试探",
  "camera_move": "轻手持，约2–3厘米呼吸感晃动",
  "assets": ["CHAR-player", "CHAR-cheng", "LOOK-player-default", "LOOK-cheng-agent", "PROP-folder-kraft", "PROP-pen", "SET-counter", "LIGHT-counter-lamp", "LIGHT-street-leak", "SET-shelf-row-1", "SET-shelf-gap", "LIGHT-ceiling-ne-dead"],
  "refs": ["SH-p02a-05"],
  "start_state": "程知遥左手单握文件夹，视线在文件夹上；主角右手握笔。",
  "end_state": "文件夹抱在胸前，视线在主角脸上；主角右手放下笔。",
  "t2v_prompt": "A medium close-up at eye level, camera south of the counter at about 1.5 meters looking north-northwest, Cheng Zhiyao center-left of frame, the player only as a right shoulder and right hand at the right edge, the pen already set down. Cheng Zhiyao holds the kraft folder against her chest, left hand supporting the bottom, right hand resting on top. Her shoulder line is looser than before, the jacket shoulders no longer taut. Warm desk-lamp light comes from below onto her jaw, cold street light from the door gap falls on her right shoulder. Behind her the shelving with one empty slot between the third and fifth rows, the dead ceiling light dark. Her gaze sits on the folder first, then lifts to the player's face as she speaks a single word. The camera is lightly handheld, a small two-to-three centimeter breathing sway, starting with her looking down at the folder and ending with her eyes up on the player.",
  "i2v_prompt": "Treat the still as fixed fact. The camera is lightly handheld with a small two-to-three centimeter breathing sway only; no pan, no push, no tilt. Performance: Cheng Zhiyao shifts the folder from a one-handed grip into both arms against her chest, her gaze moving from the folder up to the player's face as she speaks one short word; the player sets the pen down and shifts his weight from the right foot to the left. Warm lamp light on her jaw and cold street light on her right shoulder stay constant. Preserve the loosened shoulder line, the shelving gap, the dark northeast light, the player cropped to shoulder and hand at the right edge.",
  "must_keep": "程知遥在画面中央偏左、主角只露右肩右手在右缘；文件夹抱在胸前；肩线比 SH-p02a-03 更松；主角右手已放下笔；坏灯不亮。",
  "acceptance": "文件夹抱在胸前；她肩线比 SH-p02a-03 更松；主角右手已放下笔。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-06",
  "node_id": "p02a",
  "branch": "trunk",
  "duration_sec": 6,
  "dramatic_verb": "隐瞒",
  "camera_move": "锁定",
  "assets": ["CHAR-player", "CHAR-cheng", "LOOK-player-default", "LOOK-cheng-agent", "PROP-folder-kraft", "SET-counter", "LIGHT-counter-lamp", "LIGHT-street-leak", "SET-shelf-row-1", "SET-shelf-gap", "LIGHT-ceiling-ne-dead"],
  "refs": ["SH-p02a-06"],
  "start_state": "程知遥视线在主角脸上；主角眉头平。",
  "end_state": "程知遥视线从文件夹回到主角脸上；主角眉头微蹙。",
  "t2v_prompt": "A locked-off medium close-up at eye level, camera south of the counter at about 1.5 meters looking north-northwest, Cheng Zhiyao centered, the player at the right edge as a right shoulder and part of the profile. Cheng Zhiyao still holds the kraft folder against her chest. As she speaks about the player's uncle her gaze slides off the player's face and drops onto the folder; when she reaches the words about five years ago her gaze comes back up to the player's face. Warm desk-lamp light comes from below onto her jaw, cold street light from the door gap falls on her right shoulder. Behind her the shelving with one empty slot between the third and fifth rows, the dead ceiling light dark. The player's body stays still, his brow drawing into a slight frown. No camera movement.",
  "i2v_prompt": "Treat the still as fixed fact. Hold the camera completely locked off, no pan, no push, no handheld. Performance only: Cheng Zhiyao's gaze slides from the player's face down onto the folder, holds there, then returns to the player's face on her final words; her folder stays hugged against her chest with almost no movement. The player stays still, his brow tightening from flat into a slight frown. Warm lamp light on her jaw and cold street light on her right shoulder stay constant. Preserve the shelving gap, the dark northeast light, the player cropped at the right edge.",
  "must_keep": "程知遥在画面中央、主角只露右肩侧脸在右缘；文件夹仍抱在胸前；视线先离开主角脸落在文件夹、最后回到主角脸；主角眉头微蹙；坏灯不亮。",
  "acceptance": "她说「五年前」时视线在主角脸上；文件夹仍抱在胸前；主角眉头微蹙。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-07",
  "node_id": "p02a",
  "branch": "trunk",
  "duration_sec": 3,
  "dramatic_verb": "选择",
  "camera_move": "锁定",
  "assets": ["CHAR-player", "LOOK-player-default", "PROP-pen", "PROP-intent-letter", "DETAIL-intent-signature-field", "PROP-folder-kraft", "SET-counter", "LIGHT-counter-lamp", "LIGHT-street-leak"],
  "refs": ["SH-p02a-07"],
  "start_state": "主角右手悬在笔上方约5厘米。",
  "end_state": "保持不动，等待选择。",
  "t2v_prompt": "A locked-off extreme close-up from about forty degrees above, long-lens isolation, camera roughly 1.2 meters above the counter slightly south of it, looking down at the counter top. Center of frame is the counter surface. On the left the intent letter, its signature field already signed, the pen lying horizontally beside it. On the right Cheng Zhiyao's kraft folder, clasp closed, held against her chest so only one corner of it enters frame. The player's right hand hovers about five centimeters above the pen, fingers slightly curled, not descending. Warm desk-lamp light falls from above onto the counter, the paper carrying a slight sheen. Cold street light from the door gap lands on the back of the player's right hand. Background thrown out of focus, dark counter grain. The lower part of frame is left open as empty counter surface. No camera movement.",
  "i2v_prompt": "Treat the still as fixed fact. Hold the camera completely locked off, no pan, no push, no tilt. Almost nothing moves: the player's right hand stays hovering about five centimeters above the pen, fingers slightly curled, held perfectly still, with only the faintest tremor of held breath. The warm lamp sheen on the paper and the cold street light on the back of his hand stay constant. Preserve the signed signature field, the pen lying horizontally, the closed folder corner at the right, the empty counter surface across the lower frame.",
  "must_keep": "签名栏已签、笔横在旁边；文件夹扣已扣只露一角；右手悬在笔上方约5厘米不动；台灯暖光在台面、冷街灯在右手手背；画面下方留出UI空间。",
  "acceptance": "右手悬在笔上方约5厘米；签名栏已签；文件夹扣已扣；画面下方留出UI空间。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-07a",
  "node_id": "p02a",
  "branch": "a",
  "duration_sec": 4,
  "dramatic_verb": "判定",
  "camera_move": "pan约40度，从她手部摇到手机屏幕，落幅屏幕占画面中心",
  "assets": ["CHAR-player", "CHAR-cheng", "LOOK-player-default", "LOOK-cheng-agent", "PROP-folder-kraft", "PROP-bag-cheng", "PROP-phone-cheng", "SET-counter", "LIGHT-counter-lamp", "LIGHT-street-leak", "SET-shelf-row-1", "SET-shelf-gap", "LIGHT-ceiling-ne-dead"],
  "refs": ["SH-p02a-07a"],
  "start_state": "文件夹在程知遥胸前。",
  "end_state": "文件夹在包外侧，扣已扣；手机屏幕亮，转向主角；她不再说话。",
  "t2v_prompt": "A medium close-up at eye level, camera south of the counter at about 1.5 meters looking north-northwest, Cheng Zhiyao on the left of frame, the player on the right. Cheng Zhiyao's right hand slides the kraft folder, clasp already closed, into the outer pocket of her bag, one corner of the folder left showing outside the bag. Her left hand draws a phone from the bag, the screen lighting up, and she turns it toward the player. The cold screen glow lands on her face and mixes with the warm desk lamp into a two-tone light. The player nods on the right. Behind them the shelving with one empty slot between the third and fifth rows, the dead ceiling light dark. The camera pans about forty degrees, from her hands across to the phone screen, ending with the screen centered in frame.",
  "i2v_prompt": "Treat the still as fixed fact. The camera performs one pan of about forty degrees, from her hands across to the phone screen, ending with the screen centered; no push, no tilt, no handheld. Performance: her right hand slides the closed folder into the bag's outer pocket leaving one corner out, her left hand brings the phone up and turns the lit screen toward the player, and she stops speaking; the player nods once. The cold screen glow rises on her face and mixes with the warm lamp into two-tone light. Preserve the shelving gap, the dark northeast light, the folder corner showing outside the bag.",
  "must_keep": "程知遥在左、主角在右；文件夹在包外侧扣已扣、一角露在包外；手机屏幕亮并转向主角；屏幕冷光与台灯暖光双色温；她不再说话；坏灯不亮。",
  "acceptance": "文件夹在包外侧，扣已扣；手机屏幕亮，转向主角；她不再说话。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

===SHOT_JOB===
{
  "shot_id": "SH-p02a-07b",
  "node_id": "p02a",
  "branch": "b",
  "duration_sec": 5,
  "dramatic_verb": "拒绝",
  "camera_move": "轻手持，约2–3厘米呼吸感晃动",
  "assets": ["CHAR-player", "CHAR-cheng", "LOOK-player-default", "LOOK-cheng-agent", "PROP-folder-kraft", "PROP-bag-cheng", "SET-counter", "LIGHT-counter-lamp", "LIGHT-street-leak", "SET-shelf-row-1", "SET-shelf-gap", "LIGHT-ceiling-ne-dead"],
  "refs": ["SH-p02a-07b"],
  "start_state": "文件夹在程知遥胸前。",
  "end_state": "文件夹在包内袋，包扣已扣；她眼神从主角脸上移开，落在包扣上。",
  "t2v_prompt": "A medium close-up at eye level, camera south of the counter at about 1.5 meters looking north-northwest, Cheng Zhiyao on the left of frame, the player on the right. Cheng Zhiyao's right hand returns the kraft folder into the inner pocket of her bag, not the outermost one. Her fingers pause on the bag clasp for a full second, then she closes it. Her gaze slides off the player's face and drops onto the clasp. Warm desk-lamp light comes from below onto her jaw, cold street light from the door gap falls on her right shoulder. The player speaks a single word on the right. Behind them the shelving with one empty slot between the third and fifth rows, the dead ceiling light dark. The camera is lightly handheld, a small two-to-three centimeter breathing sway, starting with her hand outside the bag and ending with her hand on the clasp.",
  "i2v_prompt": "Treat the still as fixed fact. The camera is lightly handheld with a small two-to-three centimeter breathing sway only; no pan, no push, no tilt. Performance: her right hand slides the folder into the bag's inner pocket, her fingers pause on the clasp for one full second, then she closes it; her gaze slides off the player's face and settles on the clasp; the player says one short word on the right. Warm lamp light on her jaw and cold street light on her right shoulder stay constant. Preserve the shelving gap, the dark northeast light, the folder going into the inner pocket rather than the outer one.",
  "must_keep": "程知遥在左、主角在右；文件夹收回包内袋不塞最外层；手指在包扣上停1秒后扣好；眼神从主角脸上移开落在包扣上；坏灯不亮。",
  "acceptance": "文件夹在包内袋，不塞最外层；包扣已扣；她眼神从主角脸上移开一下。",
  "model": "seedance-2.5",
  "status": "PROMPT_ONLY"
}
===END_SHOT_JOB===

请把执行包交给视频 Agent。本阶段不调用模型。