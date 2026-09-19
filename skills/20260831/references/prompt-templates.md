# 通用角色资产 Prompt 模板

以下模板保存不随平台变化的视觉合同。方括号仅是内部参数槽；最终交付前必须全部替换或连同连接词删除。模型适配器可以调整句式和段落结构，但不能改变身份、参考图职责、构图或资产状态。

## Flat Grade

用于正式标准身份卡、Mode 1 单步定妆和 Mode 2：

    Background is an even 18% neutral gray seamless, one completely flat uniform value corner to corner, with no seam line, gradient, hotspot, vignette, or falloff. Relight from scratch with completely flat shadowless illumination: one enormous soft frontal source at camera position and matched equal fill from camera-left, camera-right, above, and below, so both sides of the face and body read at identical brightness. No key-to-fill ratio, shadow side, rim light, hair light, kicker, or specular hotspot. Zero shadow cast onto the background and no visible contact shadow. Extremely low contrast, even, milky, catalogue-flat. Skin and fabric remain matte and render at their true natural tones. Show fine natural skin texture, strand-level hair, real fabric weave and drape, and soft natural film grain. Fine, flattering photographed realism, never plastic, waxy, harsh, or clinically detailed. Photographed on a clean 50mm-equivalent prime with even sharpness.

白底仅按用户明确要求，把第一句替换为：

    Pure white seamless studio background, perfectly even, with no gradient or seam line.

## T0 标准身份卡

    A clean high-fidelity character identity reference, framed from just above the head to the upper chest with the face dominant in the frame. [IDENTITY: confirmed adult subject, heritage appearance if provided, exact natural skin tone and matte finish, face structure, eye shape and exact eye color, brows, nose, lips, hair color, length and texture, and every approved identity marker visible within this crop with precise placement]. [APPROVED BLACK BASE TOP], with neutral base grooming, no Look-specific makeup, and no optional jewelry beyond confirmed identity-defining piercings. Body squared to camera, head level, eyes directly to camera, lips closed, neutral controlled expression. Preserve fine even pores, peach fuzz, subtle subsurface scattering, individual lashes, real iris moisture and pattern, natural lip lines, and strand-level hair with baby hairs and flyaways. Keep every feature flattering and natural.

获选候选进入标准化时，开头增加：

    Use the approved exploratory face reference as the sole identity source.

T0 后拼接 Flat Grade。

## T1 候选脸可见字段

这是模型中立的内部视觉简报，不直接投喂所有模型：

    One confirmed adult [SUBJECT TERM] with [NATURAL SKIN TONE AND UNDERTONE], [FACE SHAPE, JAW AND MODERATE CHEEKBONE STRUCTURE], [EYE SHAPE AND COLOR], [BROWS, NOSE AND LIPS], and [HAIR COLOR, LENGTH, TEXTURE AND PARTING]. [LARGE VISIBLE IDENTITY MARKERS]. [VISIBLE MAKEUP EXPRESSED ONLY AS AREA, STANDARD COLOR, INTENSITY AND FINISH]. Centered head-and-shoulders portrait, face dominant, body square to camera, head level, direct gaze, calm closed-lip expression, plain black crew-neck top, seamless neutral mid-gray background, soft even frontal studio light, low contrast, natural skin and hair texture.

不得加入真人或团体名称、品牌、模仿关系、年龄暧昧、身体评价、不可见体型或开放式气质标签。各模型必须从 T1 重新编译，不能共用同一最终 Prompt。

## T2 单步服装定妆

    The same character shown in the attached identity reference. Preserve the face, bone structure, natural skin tone, base hair identity and every approved permanent identity marker. Use only the separately approved full-body reference or locked text specification for body proportions; never infer full-body shape from a head-and-shoulders identity card. The character wears [COMPLETE APPROVED WARDROBE FROM HEAD TO TOE: garments, fabric, color, fit, construction, layering, footwear, jewelry and accessories]. Apply [APPROVED MAKEUP, HAIRSTYLE OR HAIR ACCESSORIES, AND NAIL LENGTH, SHAPE, COLOR OR ART]. Keep every approved permanent marker visible at its exact placement wherever the outfit exposes it. [POSE: body angle, weight distribution, hand position, gaze and neutral controlled expression]. Full-body framing with both hands and all footwear visible.

T2 后拼接 Flat Grade。

## T3 两步服装合成

第一步普通模特 Look：

    One adult fashion model stands straight-on to camera in a relaxed neutral stance, weight even across both feet, arms relaxed at the sides and shoulders level. [SIMPLE NEUTRAL HAIR COMPATIBLE WITH THE APPROVED STYLING]. The model wears [COMPLETE APPROVED OUTFIT, FOOTWEAR, JEWELRY AND ACCESSORIES] with [APPROVED MAKEUP, HAIR STYLING, HAIR ACCESSORIES AND NAILS]. Full-body framing with all footwear visible. Use an even 18% neutral gray seamless background and soft broad frontal studio illumination. Keep the complete Look matte, evenly readable and true in color, with realistic fabric weave, weight and drape.

第二步双参考合成：

    Reference roles: Image 1 supplies the complete outfit, footwear, jewelry, accessories, makeup, hair accessories, nails and pose. Image 2 is the sole character identity source and supplies the face, bone structure, natural skin tone, base hair identity and permanent identity markers. Replace the person in Image 1 with the person from Image 2. Preserve the entire Look and pose from Image 1 while matching the identity from Image 2. Match body proportions from Image 2 only when it is an approved full-body reference; otherwise use the locked text body specification and never infer body shape from a portrait crop. Recreate the approved compatible hair arrangement while preserving Image 2 hair color, length, texture, density and hairline. Use a neutral mid-gray seamless studio background, soft large-source studio lighting, true natural colors and full-body framing.

## T4 单一区域造型细节

    Create a high-fidelity styling detail reference of the same character and Look shown in the approved outfit reference. Tight close-up of [ONE APPROVED BODY OR WARDROBE AREA]. Preserve the exact natural skin tone, anatomy, garment context and every permanent marker visible in this crop. Show [APPROVED NAILS, JEWELRY, TATTOO, PIERCING, FOOTWEAR OR GARMENT-CONSTRUCTION DETAIL] with its exact color, material, pattern, scale and placement. Use a neutral mid-gray seamless studio background, soft even frontal light, low contrast and realistic skin and material texture. Include only the approved design.

## T5 三格角色表

    Create one horizontal three-panel character reference sheet divided into three equal vertical panels with thin clean separation. The same figure and the same approved Look remain identical across all panels. [IDENTITY ONCE: build, exact natural skin tone, hair, makeup, identity markers and nails]. [WARDROBE ONCE: complete outfit, materials, construction, footwear, jewelry and accessories].

    LEFT PANEL: ghost-mannequin front full-body view from the shoulders downward. No face is present. The outfit and body keep natural three-dimensional shape, drape and tension, with empty neutral background above the shoulder line and generous normal headroom. Arms rest at the sides, hands remain visible, weight is even, and the full footwear or hem is visible. Use [HOLLOW COLLAR OPENING FOR CLOSED STRUCTURED NECKLINES / CLEAN MANNEQUIN SHOULDER-AND-NECK FORM FOR OPEN NECKLINES].

    CENTER PANEL: full-body rear view with the head present, standing straight with arms relaxed. Show the complete hair fall, garment back construction, hem and footwear.

    RIGHT PANEL: tight chest-up identity portrait from just above the head to the collarbones and the top edge of the garment. The face fills most of the panel; body square to camera, eyes to camera, lips closed and neutral controlled expression.

    Apply the same authority Flat Grade across all three panels. Keep the same gray value, shadowless light, skin value, garment colors, body proportions and identity in every panel. The right panel is the only clear face anchor.

T5 后展开 Flat Grade；只输出一个 Prompt 和一个结果。

## T6 高精度面部特写

    Create a high-fidelity [CHEST-UP / SHOULDERS-UP / FOREHEAD-TO-COLLARBONE] identity-reference portrait of the same character shown in the attached identity reference. Preserve the face, bone structure, exact natural skin tone, hair and every approved identity marker visible within this crop. Show [VISIBLE HAIR, MAKEUP, EYE COLOR, LIP DETAIL, EAR OR COLLAR JEWELRY, AND WARDROBE WITHIN THE CROP]. Use [HEAD ANGLE, GAZE AND NEUTRAL MICRO-EXPRESSION].

    Use a neutral mid-gray seamless studio background. A broad diffused source from camera-left and slightly above creates a gentle natural wrap, balanced by soft frontal fill. Keep the off-light side open and readable, with restrained contrast and matte true skin tone. Show fine even pores, peach fuzz, subtle subsurface scattering, individual lashes, real iris moisture and pattern, natural lip lines, strand-level hair, baby hairs, flyaways and visible collar fabric weave. Keep the result flattering and natural, with soft film grain and gentle highlight roll-off.

## T7 两参考图换装

    Reference roles: Image 1 supplies the outfit, footwear, jewelry, accessories, nails and pose. Image 2 is the sole character identity source and supplies the face, bone structure, body type, body proportions, natural skin tone, base hair identity and permanent identity markers. Replace the person in Image 1 with the person from Image 2. Preserve the complete styling and pose from Image 1 exactly while matching the identity and proportions from Image 2. Use a clean neutral mid-gray seamless studio background, soft large-source studio lighting, true natural skin and outfit colors, natural film grain and full-body framing.

## 最终编译检查

- 所有参数槽已替换或完整删除。
- Prompt 内不写模型、平台、API、尺寸或质量参数；这些放执行卡。
- 每张参考图只有明确职责，身份来源唯一。
- 构图和可见细节与当前 Mode 一致。
- 没有用户未确认的服装、配饰、妆面、美甲、纹身或身份标记。
- 模型适配器规定的句式、限制和参数通道已经应用。
