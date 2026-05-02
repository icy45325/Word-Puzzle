#!/usr/bin/env node
// Generate 60 levels + write extended dictionary.
// Run: node scripts/generate-levels.mjs
// Outputs: src/data/dictionary.json + src/data/levels.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// ─────────────────────────────────────────────────────────────────────────────
// Seed dictionary. Each entry includes phonetic/pos/meaning/example/exampleCn.
// Words are uppercase. Anagram-friendly families are clustered.
// ─────────────────────────────────────────────────────────────────────────────

const SEED = [
  // 3-letter common words
  ['CAT', '/kæt/', 'n.', '猫；猫科动物', 'The cat is sleeping on the sofa.', '那只猫正睡在沙发上。', 'black cat / cat nap'],
  ['ACT', '/ækt/', 'v./n.', '行动；表演；法案', 'We must act now.', '我们必须立即行动。', 'action / actor 同根'],
  ['DOG', '/dɒɡ/', 'n.', '狗', 'My dog loves the ball.', '我的狗喜欢球。', 'lucky dog（幸运儿）'],
  ['GOD', '/ɡɒd/', 'n.', '神；上帝', 'Many cultures worship gods.', '许多文化崇拜神。', 'oh my god'],
  ['TAR', '/tɑːr/', 'n.', '焦油；沥青', 'Workers poured hot tar.', '工人浇热沥青。', 'tarmac 由此衍生'],
  ['RAT', '/ræt/', 'n.', '老鼠', 'A rat ran across the floor.', '一只老鼠跑过地板。', '复数 rats'],
  ['ART', '/ɑːrt/', 'n.', '艺术；技艺', 'She studies modern art.', '她研究现代艺术。', 'artist / artistic 同根'],
  ['EAR', '/ɪər/', 'n.', '耳朵', 'The dog has long ears.', '这只狗有长耳朵。', 'play it by ear（随机应变）'],
  ['EAT', '/iːt/', 'v.', '吃', 'Let\'s eat dinner together.', '我们一起吃晚饭吧。', '过去式 ate / 过去分词 eaten'],
  ['ATE', '/eɪt/', 'v.', 'eat 的过去式', 'I ate breakfast at seven.', '我七点吃早饭。', 'past tense of eat'],
  ['TEA', '/tiː/', 'n.', '茶；茶水', 'Would you like some tea?', '你想喝点茶吗？', 'green tea / tea time'],
  ['ARE', '/ɑːr/', 'v.', 'be 的复数现在时', 'They are my friends.', '他们是我的朋友。', 'I am / you are / they are'],
  ['ERA', '/ˈɪərə/', 'n.', '时代；纪元', 'A new era of technology.', '新的科技时代。', '同：epoch / age'],
  ['CAR', '/kɑːr/', 'n.', '汽车', 'He drives a red car.', '他开一辆红色汽车。', 'sports car / car park'],
  ['ARC', '/ɑːrk/', 'n.', '弧；弧形', 'Draw an arc on paper.', '在纸上画一个弧。', 'arch（拱）相关'],
  ['BAR', '/bɑːr/', 'n.', '酒吧；横杆', 'They met at the bar.', '他们在酒吧见面。', 'chocolate bar / bar exam'],
  ['BAT', '/bæt/', 'n.', '蝙蝠；球棒', 'The bat flew at night.', '蝙蝠夜里飞行。', 'baseball bat'],
  ['TAB', '/tæb/', 'n.', '标签；账单', 'Click on the new tab.', '点击新标签。', 'browser tab'],
  ['ABS', '/æbz/', 'n.', '腹肌（口语）', 'He works out for abs.', '他锻炼练腹肌。', 'short for abdominal muscles'],
  ['PAT', '/pæt/', 'v.', '轻拍', 'She patted the puppy.', '她轻拍小狗。', 'pat on the back（鼓励）'],
  ['TAP', '/tæp/', 'v./n.', '轻敲；水龙头', 'Tap the screen lightly.', '轻触屏幕。', 'tap water = 自来水'],
  ['APT', '/æpt/', 'adj.', '恰当的；倾向的', 'An apt remark.', '恰当的话。', 'apt to forget = 易忘的'],
  ['PAN', '/pæn/', 'n.', '平底锅', 'Heat oil in the pan.', '在锅里热油。', 'frying pan'],
  ['NAP', '/næp/', 'n./v.', '小睡', 'Take a short nap.', '小睡一下。', 'cat nap'],
  ['ANT', '/ænt/', 'n.', '蚂蚁', 'Ants work together.', '蚂蚁齐心协作。', '复数 ants'],
  ['TAN', '/tæn/', 'n./v.', '晒黑；棕褐色', 'He got a deep tan.', '他晒得很黑。', 'sunbathing → tan'],
  ['NUT', '/nʌt/', 'n.', '坚果；螺母', 'He cracked the nut.', '他敲开坚果。', 'in a nutshell（简言之）'],
  ['SUN', '/sʌn/', 'n.', '太阳', 'The sun is bright.', '太阳很亮。', 'sunny / sunshine'],
  ['UNS', '/ʌnz/', 'n.', 'one 的口语复数（俚语）', 'Pick the little uns.', '挑小的。', '罕见，常仅出现拼词游戏'],
  ['SON', '/sʌn/', 'n.', '儿子', 'They have one son.', '他们有一个儿子。', '反义：daughter'],
  ['NOT', '/nɒt/', 'adv.', '不；非', 'I do not agree.', '我不同意。', 'not at all'],
  ['TON', '/tʌn/', 'n.', '吨', 'A ton of coal.', '一吨煤。', '1 ton ≈ 1000 kg'],
  ['ONE', '/wʌn/', 'num.', '一', 'I want one apple.', '我想要一个苹果。', 'first / once 同根'],
  ['TOE', '/təʊ/', 'n.', '脚趾', 'I stubbed my toe.', '我撞到脚趾。', 'big toe = 大拇指'],
  ['NOR', '/nɔːr/', 'conj.', '也不', 'Neither he nor she.', '他和她都不。', 'neither...nor'],
  ['LAY', '/leɪ/', 'v.', '放置；铺设', 'Lay the book here.', '把书放这。', '及物动词；lie 不及物'],
  ['PAL', '/pæl/', 'n.', '好朋友（口语）', 'He\'s my pal.', '他是我朋友。', 'pen pal = 笔友'],
  ['LAP', '/læp/', 'n.', '大腿；一圈', 'The cat sat on his lap.', '猫坐在他腿上。', '跑道一圈也叫 lap'],
  ['ALP', '/ælp/', 'n.', '高山牧场', 'A green alp.', '青翠的高山牧场。', '阿尔卑斯 Alps 衍生'],
  ['AIR', '/eər/', 'n./v.', '空气；播出', 'Fresh air is healthy.', '新鲜空气有益健康。', 'on air / airy'],
  ['RAN', '/ræn/', 'v.', 'run 的过去式', 'He ran fast yesterday.', '他昨天跑得很快。', 'run / ran / run'],
  ['NIL', '/nɪl/', 'n.', '零；无', 'The score was nil.', '比分为零。', '体育中比 zero 更常用（英式）'],
  ['LIT', '/lɪt/', 'v./adj.', '点亮的；light 的过去式', 'The room is lit.', '房间被点亮。', '俚语：lit = 兴奋的'],
  ['TIN', '/tɪn/', 'n.', '锡；罐头', 'A tin of beans.', '一罐豆子。', 'tin = 英式罐头；can = 美式'],
  ['INN', '/ɪn/', 'n.', '小旅馆', 'They stayed at the inn.', '他们住在小旅馆。', 'innkeeper = 旅馆主人'],
  ['ILL', '/ɪl/', 'adj.', '生病的', 'He fell ill yesterday.', '他昨天生病了。', 'illness 同根'],
  ['ALL', '/ɔːl/', 'adj.', '所有的', 'All students are here.', '所有学生都在这。', 'all in all'],
  ['FAR', '/fɑːr/', 'adv.', '远', 'It\'s far from here.', '离这里很远。', 'further / farther'],
  ['FAN', '/fæn/', 'n.', '粉丝；风扇', 'I am a big fan.', '我是大粉丝。', 'electric fan / fan club'],
  ['FAT', '/fæt/', 'adj.', '胖的；脂肪', 'The cat is fat.', '这只猫很胖。', 'low-fat 食品'],
  ['RAW', '/rɔː/', 'adj.', '生的；未加工的', 'Eat raw vegetables.', '吃生蔬菜。', 'raw material = 原料'],
  ['SAW', '/sɔː/', 'v.', 'see 的过去式', 'I saw a movie.', '我看了一部电影。', 'see / saw / seen'],
  ['WAS', '/wɒz/', 'v.', 'is/am 的过去式', 'He was here.', '他刚才在这。', 'past tense of be'],

  // 4-letter words
  ['STAR', '/stɑːr/', 'n./v.', '星星；明星；主演', 'She became a star.', '她成为明星。', 'shooting star / star-studded'],
  ['RATS', '/ræts/', 'n.pl.', '老鼠；糟了！', 'Rats! I missed it.', '糟了！我错过了。', 'rat 的复数'],
  ['ARTS', '/ɑːrts/', 'n.pl.', '艺术；文科', 'Liberal arts education.', '人文学科教育。', 'arts and crafts'],
  ['TARS', '/tɑːrz/', 'n.pl.', 'tar 的复数', 'Different tars are used.', '使用不同的沥青。', 'tar 的复数'],
  ['LOVE', '/lʌv/', 'n./v.', '爱', 'I love reading.', '我喜欢阅读。', '网球中 love = 0 分'],
  ['VOLE', '/vəʊl/', 'n.', '田鼠', 'A vole in the field.', '田里的田鼠。', '猫头鹰常见猎物'],
  ['RAIN', '/reɪn/', 'n./v.', '雨；下雨', 'It rains in summer.', '夏天下雨。', 'rain cats and dogs'],
  ['PLAY', '/pleɪ/', 'v./n.', '玩；演奏；戏剧', 'Children play here.', '孩子们在这玩。', 'player / playful'],
  ['MILE', '/maɪl/', 'n.', '英里', 'Two miles away.', '两英里外。', '1 mile ≈ 1.609 km'],
  ['LIME', '/laɪm/', 'n.', '青柠', 'A slice of lime.', '一片青柠。', 'lime green = 青柠色'],
  ['HOSE', '/həʊz/', 'n.', '软管', 'A garden hose.', '花园水管。', 'fire hose = 消防水带'],
  ['HOST', '/həʊst/', 'n./v.', '主持人；主办', 'He is the host.', '他是主持人。', 'host a party'],
  ['HOTS', '/hɒts/', 'n.pl.', '强烈兴趣（口语）', 'She has the hots for him.', '她对他很心动。', '常见短语 hots for'],
  ['SHOT', '/ʃɒt/', 'n.', '射击；尝试', 'A great shot.', '精彩的一击。', 'give it a shot'],
  ['HOOT', '/huːt/', 'v./n.', '猫头鹰叫；嘲笑', 'The owl hoots.', '猫头鹰叫。', '俚语 a hoot = 很有趣'],
  ['TOTE', '/təʊt/', 'v./n.', '手提；手提包', 'A canvas tote bag.', '帆布手提包。', 'tote bag 常见'],
  ['HEAR', '/hɪər/', 'v.', '听见', 'Can you hear me?', '能听到我吗？', 'hear / heard / heard'],
  ['HARE', '/heər/', 'n.', '野兔', 'A swift hare.', '敏捷的野兔。', 'tortoise and the hare'],
  ['HEAT', '/hiːt/', 'n.', '热；高温', 'Summer heat is strong.', '夏天热气强烈。', 'heat wave = 热浪'],
  ['HATE', '/heɪt/', 'v.', '讨厌；恨', 'I hate cold weather.', '我讨厌冷天气。', 'love-hate relationship'],
  ['HEART', '/hɑːrt/', 'n.', '心；心脏；中心', 'My heart races.', '我的心狂跳。', 'heart of the city'],
  ['HATER', '/ˈheɪtər/', 'n.', '憎恨者（俚语）', 'Don\'t be a hater.', '别当黑粉。', '网络流行词'],
  ['EARTH', '/ɜːrθ/', 'n.', '地球；土壤', 'Earth is round.', '地球是圆的。', 'down to earth = 务实的'],
  ['RATE', '/reɪt/', 'n./v.', '比率；评分', 'A high rate of success.', '高成功率。', 'rating 同根'],
  ['TEAR', '/tɪər/', 'n.', '眼泪', 'A tear rolled down.', '一滴眼泪落下。', '动词读 /teər/，意撕裂'],
  ['HER', '/hɜːr/', 'pron.', '她（宾格）', 'I gave her a book.', '我给了她一本书。', 'she / her / hers'],
  ['HERO', '/ˈhɪərəʊ/', 'n.', '英雄', 'Every kid loves a hero.', '每个孩子都爱英雄。', 'heroine = 女英雄'],
  ['HOSE', null, null, null, null, null, null], // dup placeholder, will be filtered
  ['HORSE', '/hɔːrs/', 'n.', '马', 'The horse runs fast.', '马跑得快。', 'horseback riding'],
  ['SHORE', '/ʃɔːr/', 'n.', '岸；海岸', 'Walk along the shore.', '沿岸散步。', 'shoreline = 海岸线'],
  ['SORE', '/sɔːr/', 'adj.', '疼痛的', 'My arm is sore.', '我胳膊疼。', '常用：sore throat'],
  ['ROSE', '/rəʊz/', 'n.', '玫瑰；rise 过去式', 'A red rose.', '一朵红玫瑰。', 'rose / rose / risen'],
  ['HOES', '/həʊz/', 'n.pl.', 'hoe（锄头）的复数', 'Farmers use hoes.', '农民用锄头。', 'hoe = 锄头'],
  ['EROS', '/ˈɪərɒs/', 'n.', '爱神厄洛斯', 'Eros, the Greek god.', '希腊爱神厄洛斯。', '希腊神话人物'],
  ['ORES', '/ɔːrz/', 'n.pl.', '矿石的复数', 'Iron ores are mined.', '开采铁矿石。', 'ore = 矿石'],
  ['HOUSE', '/haʊs/', 'n.', '房子；住宅', 'A new house.', '新房子。', '动词读 /haʊz/'],
  ['USE', '/juːz/', 'v./n.', '使用；用途', 'Can I use this?', '我能用这个吗？', '名词 /juːs/，动词 /juːz/'],
  ['SMILE', '/smaɪl/', 'n./v.', '微笑', 'A bright smile.', '灿烂的微笑。', 'smile from ear to ear'],
  ['MILES', '/maɪlz/', 'n.pl.', 'mile 的复数', 'Many miles to go.', '还有很多英里要走。', '复数形式'],
  ['SLIME', '/slaɪm/', 'n.', '黏液；史莱姆', 'Kids love slime.', '孩子们爱玩史莱姆。', 'slimy 同根'],
  ['LIMES', '/laɪmz/', 'n.pl.', 'lime 的复数', 'Buy two limes.', '买两个青柠。', '复数形式'],
  ['MILS', '/mɪlz/', 'n.pl.', 'mil（千分之一英寸）的复数', 'Measured in mils.', '以 mil 为单位测量。', 'mil = 1/1000 英寸'],
  ['ELMS', '/elmz/', 'n.pl.', '榆树（复数）', 'Tall elms line the road.', '高大榆树排列道路。', 'elm 树'],
  ['LISTEN', '/ˈlɪsən/', 'v.', '听', 'Listen carefully.', '仔细听。', 'silent 是字母重排'],
  ['SILENT', '/ˈsaɪlənt/', 'adj.', '安静的', 'Be silent please.', '请保持安静。', 'listen 是字母重排'],
  ['ENLIST', '/ɪnˈlɪst/', 'v.', '入伍；招募', 'He enlisted in the army.', '他参军了。', '同根：list / listed'],
  ['TINSEL', '/ˈtɪnsəl/', 'n.', '金属箔丝（圣诞装饰）', 'Tinsel on the tree.', '树上的金属箔丝。', '圣诞树常见装饰'],
  ['INLETS', '/ˈɪnlɛts/', 'n.pl.', '小湾的复数', 'Quiet inlets.', '宁静的小湾。', 'inlet = 入口/小湾'],
  ['LITES', '/laɪts/', 'n.pl.', 'lite（轻质版）的复数', 'Various lites available.', '多种轻量版可选。', '产品命名常见'],
  ['NETS', '/nets/', 'n.pl.', '网（复数）', 'Fishing nets.', '渔网。', 'net 的复数'],
  ['TENS', '/tenz/', 'n.pl.', '十的倍数', 'Tens of people.', '数十人。', 'in tens'],
  ['SENT', '/sent/', 'v.', 'send 过去式', 'I sent the letter.', '我寄了信。', 'send / sent / sent'],
  ['NEST', '/nest/', 'n.', '鸟巢', 'A bird\'s nest.', '一个鸟巢。', 'empty nest = 空巢'],
  ['LENT', '/lent/', 'v.', 'lend 过去式', 'She lent me a pen.', '她借我一支笔。', 'lend / lent / lent'],
  ['STONE', '/stəʊn/', 'n.', '石头', 'A stone wall.', '石墙。', 'stone-cold = 冰冷'],
  ['TONES', '/təʊnz/', 'n.pl.', '音调（复数）', 'Soft tones of voice.', '柔和的语调。', 'tone 的复数'],
  ['NOTES', '/nəʊts/', 'n.pl.', '笔记（复数）', 'Take notes in class.', '课堂记笔记。', 'note 的复数'],
  ['ONSET', '/ˈɒnset/', 'n.', '开始；发作', 'The onset of winter.', '冬季的开始。', 'sudden onset'],
  ['STEN', '/sten/', 'n.', '司登冲锋枪', 'A Sten gun.', '司登冲锋枪。', '二战英国武器'],
  ['TONE', '/təʊn/', 'n.', '音调；语调', 'In a serious tone.', '严肃的语调。', 'tone of voice'],
  ['NOTE', '/nəʊt/', 'n./v.', '笔记；注意', 'Note the time.', '记下时间。', 'noteworthy = 值得注意'],
  ['NOSE', '/nəʊz/', 'n.', '鼻子', 'Her nose is small.', '她鼻子小。', 'nose dive = 俯冲'],
  ['ONES', '/wʌnz/', 'n.pl.', '一（们）；个位', 'The little ones.', '小家伙们。', '复数代词用法'],
  ['EONS', '/ˈiːɒnz/', 'n.pl.', '亿万年', 'It took eons.', '花了亿万年。', 'eon = 极长时间'],
  ['SONE', '/səʊn/', 'n.', '宋（响度单位）', 'Measured in sones.', '以宋为单位测量。', '声学单位'],
  ['PALE', '/peɪl/', 'adj.', '苍白的', 'Her face was pale.', '她脸色苍白。', 'pale skin'],
  ['LEAP', '/liːp/', 'v.', '跳跃', 'Leap over the fence.', '跳过栅栏。', 'leap year = 闰年'],
  ['PEAL', '/piːl/', 'n.', '钟声；雷鸣', 'A peal of bells.', '一阵钟声。', 'peal of laughter'],
  ['PLEA', '/pliː/', 'n.', '恳求', 'A plea for help.', '求救。', 'plead 同根'],
  ['PALES', '/peɪlz/', 'n.pl./v.', 'pale 复数/相形见绌', 'It pales next to gold.', '与金相比黯然失色。', '动词用法少见'],
  ['LEAPS', '/liːps/', 'v./n.pl.', 'leap 的第三人称单数', 'She leaps high.', '她跳得高。', 'by leaps and bounds'],
  ['PEALS', '/piːlz/', 'n.pl.', '阵阵', 'Peals of laughter.', '阵阵笑声。', '复数形式'],
  ['PEAS', '/piːz/', 'n.pl.', '豌豆', 'Green peas.', '青豆。', 'pea 的复数'],
  ['SEAL', '/siːl/', 'n.', '海豹；封条', 'A seal swims fast.', '海豹游得快。', 'sealed = 密封的'],
  ['SALE', '/seɪl/', 'n.', '出售；销售', 'On sale today.', '今日特价。', 'for sale'],
  ['ALES', '/eɪlz/', 'n.pl.', '麦芽啤酒', 'Different ales on tap.', '多种麦芽啤酒供选。', 'ale = 麦啤'],
  ['LEAS', '/liːz/', 'n.pl.', '草地的复数', 'Green leas of grass.', '绿色草地。', 'lea = 草地'],
  ['EELS', '/iːlz/', 'n.pl.', '鳗鱼（复数）', 'Eels are slippery.', '鳗鱼很滑。', 'eel 的复数'],
  ['PLANE', '/pleɪn/', 'n.', '飞机；平面', 'A jet plane.', '喷气式飞机。', 'airplane 缩写'],
  ['PANEL', '/ˈpænəl/', 'n.', '面板；专家小组', 'A solar panel.', '太阳能板。', 'control panel'],
  ['PENAL', '/ˈpiːnəl/', 'adj.', '刑罚的', 'Penal code.', '刑法典。', 'penalty 同根'],
  ['NAPLES', '/ˈneɪpəlz/', 'n.', '那不勒斯（地名）', 'I visited Naples.', '我去了那不勒斯。', '意大利城市'],
  ['LEAN', '/liːn/', 'v./adj.', '倾斜；瘦的', 'Lean on me.', '靠在我身上。', 'lean meat = 瘦肉'],
  ['LANE', '/leɪn/', 'n.', '小路；车道', 'A bike lane.', '自行车道。', 'fast lane / slow lane'],
  ['ALE', '/eɪl/', 'n.', '麦芽啤酒', 'A pint of ale.', '一品脱麦啤。', 'pale ale 常见'],
  ['NAP', null, null, null, null, null, null], // dup placeholder
  ['ELAN', '/eɪˈlɑːn/', 'n.', '热情；活力', 'With great elan.', '充满活力。', '法语借词'],
  ['NEAP', '/niːp/', 'adj.', '小潮的', 'Neap tide is weak.', '小潮潮位低。', 'neap tide = 小潮'],
  ['DREAM', '/driːm/', 'n./v.', '梦；梦想', 'Follow your dream.', '追逐梦想。', 'dreamer / dreamy'],
  ['DERMA', '/ˈdɜːrmə/', 'n.', '真皮', 'Skin\'s derma layer.', '皮肤的真皮层。', 'dermatology 同根'],
  ['ARMED', '/ɑːrmd/', 'adj.', '武装的', 'Armed forces.', '武装部队。', 'arm 动词的过去分词'],
  ['MADRE', '/ˈmɑːdreɪ/', 'n.', '母亲（西班牙语借词）', 'Mi madre is great.', '我妈妈很棒。', '常见外来词'],
  ['DREAR', '/drɪər/', 'adj.', '阴郁的（诗用）', 'A drear winter.', '阴郁的冬天。', 'dreary 的诗用变体'],
  ['MARE', '/meər/', 'n.', '母马', 'A brown mare.', '一匹棕色母马。', '反义：stallion'],
  ['DARE', '/deər/', 'v.', '敢；挑战', 'I dare you.', '我看你敢。', 'I dare say = 我敢说'],
  ['DEAR', '/dɪər/', 'adj.', '亲爱的', 'My dear friend.', '我亲爱的朋友。', 'Dear Sir / Dear Madam'],
  ['READ', '/riːd/', 'v.', '阅读', 'I read books.', '我读书。', 'read / read / read（拼写不变发音变）'],
  ['DEAD', '/ded/', 'adj.', '死的', 'The plant is dead.', '植物死了。', 'dead end = 死路'],
  ['MEAD', '/miːd/', 'n.', '蜂蜜酒', 'Mead is ancient.', '蜂蜜酒历史悠久。', '中世纪饮品'],
  ['DAM', '/dæm/', 'n.', '水坝', 'Hoover Dam.', '胡佛水坝。', 'dam vs damn 注意拼写'],
  ['MAD', '/mæd/', 'adj.', '疯的；生气的', 'Don\'t get mad.', '别生气。', 'mad about = 痴迷'],
  ['ARM', '/ɑːrm/', 'n.', '手臂', 'Strong arms.', '强壮的手臂。', 'arms = 武器'],
  ['MAR', '/mɑːr/', 'v.', '损坏；破坏', 'Don\'t mar the surface.', '别损坏表面。', 'mar 的过去式 marred'],
  ['RAM', '/ræm/', 'n.', '公羊；撞', 'A ram with horns.', '有角的公羊。', 'ram into = 撞入'],
  ['AMP', '/æmp/', 'n.', '安培；放大器', 'A 10-amp fuse.', '10 安培保险丝。', '电流单位'],
  ['MAP', '/mæp/', 'n.', '地图', 'Read the map.', '看地图。', 'map out = 规划'],
  ['SPARE', '/speər/', 'adj./v.', '备用的；抽出', 'Spare time for me.', '为我抽出时间。', 'spare key = 备用钥匙'],
  ['PEARS', '/peərz/', 'n.pl.', '梨', 'I love pears.', '我爱梨。', 'pear 的复数'],
  ['PARES', '/peərz/', 'v.', 'pare 第三人称单数', 'She pares the apple.', '她削苹果皮。', 'pare = 削皮'],
  ['REAPS', '/riːps/', 'v.', 'reap 第三人称单数', 'Reap what you sow.', '种瓜得瓜。', 'reap = 收获'],
  ['SPEAR', '/spɪər/', 'n.', '矛；长枪', 'Throw the spear.', '掷出长矛。', 'spearhead = 先锋'],
  ['PARSE', '/pɑːrs/', 'v.', '分析；解析', 'Parse the sentence.', '分析这句话。', '编程也用 parse'],
  ['REAP', '/riːp/', 'v.', '收割；获得', 'Reap the harvest.', '收获庄稼。', 'reaper = 收割者'],
  ['PEAR', '/peər/', 'n.', '梨', 'A juicy pear.', '一个多汁的梨。', '苹果 apple 同类'],
  ['PARE', '/peər/', 'v.', '削皮；削减', 'Pare expenses.', '削减开支。', 'pare down'],
  ['RAPE', '/reɪp/', 'n.', '油菜（也作动词指强奸）', 'Rape oil.', '菜籽油。', '注意词义敏感，多指植物'],
  ['APE', '/eɪp/', 'n.', '猿', 'An ape in the zoo.', '动物园的猿。', 'ape = 类人猿'],
  ['ERA', null, null, null, null, null, null], // dup placeholder
  ['SAP', '/sæp/', 'n.', '树液', 'Maple sap.', '枫树树液。', '俚语 sap = 笨蛋'],
  ['ASP', '/æsp/', 'n.', '小毒蛇', 'Beware of the asp.', '小心毒蛇。', 'asp 是种类'],
  ['SPA', '/spɑː/', 'n.', '水疗；温泉', 'Day at the spa.', '在水疗中心。', 'spa day'],
  ['PAS', '/pɑː/', 'n.', '舞步（法语借词）', 'A pas de deux.', '双人舞。', '芭蕾术语'],
  ['EARS', '/ɪərz/', 'n.pl.', '耳朵（复数）', 'Cover your ears.', '捂住耳朵。', 'ear 的复数'],
  ['SEAR', '/sɪər/', 'v.', '烧灼；煎', 'Sear the steak.', '煎牛排。', 'searing pain'],
  ['ERAS', '/ˈɪərəz/', 'n.pl.', '时代（复数）', 'Different eras.', '不同时代。', 'era 的复数'],
  ['ARES', '/ˈeəriːz/', 'n.', '战神阿瑞斯', 'Ares, the war god.', '战神阿瑞斯。', '希腊神话'],
  ['ARSE', '/ɑːrs/', 'n.', '屁股（英俚）', 'British slang term.', '英式俚语。', '不正式用法'],
  ['SERA', '/ˈsɪərə/', 'n.pl.', 'serum（血清）的复数', 'Different sera tested.', '测试不同血清。', '医学复数'],
  ['RASE', '/reɪz/', 'v.', '夷为平地（古拼写）', 'Rase the building.', '夷平建筑。', '常作 raze'],
  ['SMART', '/smɑːrt/', 'adj.', '聪明的', 'A smart kid.', '聪明的孩子。', 'smart phone / smart watch'],
  ['MARTS', '/mɑːrts/', 'n.pl.', '集市的复数', 'Local marts.', '当地市场。', 'mart = 商场'],
  ['TRAMS', '/træmz/', 'n.pl.', '电车的复数', 'European trams.', '欧洲电车。', 'tram = 有轨电车'],
  ['ARMS', '/ɑːrmz/', 'n.pl.', '手臂；武器', 'Open arms.', '张开双臂。', '亦指武器'],
  ['MARS', '/mɑːrz/', 'n.', '火星；mar 的第三人称单数', 'Mars is red.', '火星是红色的。', '行星名'],
  ['RAMS', '/ræmz/', 'n.pl.', '公羊（复数）', 'Two rams collide.', '两只公羊相撞。', 'ram 的复数'],
  ['MAST', '/mɑːst/', 'n.', '桅杆', 'A tall mast.', '高大的桅杆。', '帆船术语'],
  ['MATS', '/mæts/', 'n.pl.', '垫子（复数）', 'Yoga mats.', '瑜伽垫。', 'mat 的复数'],
  ['MARS', null, null, null, null, null, null], // dup
  ['RAMP', '/ræmp/', 'n.', '坡道；斜面', 'Wheelchair ramp.', '轮椅坡道。', 'on-ramp = 入匝道'],
  ['STORM', '/stɔːrm/', 'n.', '暴风雨', 'A heavy storm.', '强暴风雨。', 'thunderstorm = 雷暴'],
  ['MORTS', '/mɔːrts/', 'n.pl.', 'mort（号角声）的复数', 'Hunting morts.', '狩猎号角声。', '罕用'],
  ['SORT', '/sɔːrt/', 'v./n.', '分类；种类', 'Sort by date.', '按日期分类。', 'sort of = 有点'],
  ['MOST', '/məʊst/', 'adj.', '最多的', 'Most people agree.', '大多数人同意。', 'most of all'],
  ['MOTS', '/məʊz/', 'n.pl.', 'mot（妙语）复数', 'Witty mots.', '机智妙语。', '法语借词'],
  ['ROTS', '/rɒts/', 'v.', 'rot 第三人称单数', 'The fruit rots.', '水果腐烂。', 'rot = 腐烂'],
  ['STOP', '/stɒp/', 'v.', '停止', 'Please stop.', '请停下。', 'stop sign'],
  ['POTS', '/pɒts/', 'n.pl.', '锅；罐（复数）', 'Pots and pans.', '锅碗瓢盆。', 'pot 的复数'],
  ['OPTS', '/ɒpts/', 'v.', 'opt 第三人称单数', 'She opts for tea.', '她选择茶。', 'opt = 选择'],
  ['SPOT', '/spɒt/', 'n./v.', '斑点；地点', 'A nice spot.', '好地方。', 'on the spot = 当场'],
  ['TOPS', '/tɒps/', 'n.pl.', '上衣（复数）', 'Wear cool tops.', '穿酷上衣。', 'top 的复数'],
  ['POST', '/pəʊst/', 'n./v.', '邮件；张贴', 'Post the letter.', '寄信。', 'postcard = 明信片'],
  ['STOMP', '/stɒmp/', 'v.', '跺脚', 'Stomp on the ground.', '在地上跺脚。', 'stomp 的动作感'],
  ['BREAD', '/bred/', 'n.', '面包', 'Fresh bread.', '新鲜面包。', 'breadwinner = 养家者'],
  ['BARED', '/beərd/', 'v.', 'bare 过去式', 'He bared his soul.', '他坦露心声。', 'bare = 暴露'],
  ['DEBAR', '/dɪˈbɑːr/', 'v.', '禁止；排除', 'Debar from entry.', '禁止入内。', '正式法律用词'],
  ['BEARD', '/bɪərd/', 'n.', '胡须', 'A long beard.', '长胡子。', 'bearded 同根'],
  ['BREED', '/briːd/', 'v.', '繁殖', 'Dogs breed easily.', '狗易繁殖。', 'breed / bred / bred'],
  ['BARE', '/beər/', 'adj.', '裸露的', 'Bare feet.', '光脚。', 'barefoot'],
  ['BEAR', '/beər/', 'n.', '熊', 'A brown bear.', '一只棕熊。', '动词意为忍受'],
  ['DEAR', null, null, null, null, null, null], // dup
  ['BRED', '/bred/', 'v.', 'breed 过去式', 'Pure-bred dogs.', '纯种犬。', 'breed / bred / bred'],
  ['DRAB', '/dræb/', 'adj.', '单调的', 'Drab clothing.', '单调的衣着。', 'drab color'],
  ['BARD', '/bɑːrd/', 'n.', '吟游诗人', 'The Bard of Avon.', '艾芬河畔吟游诗人（莎士比亚）。', '诗人代称'],
  ['BRAD', '/bræd/', 'n.', '小钉子', 'A tiny brad.', '一颗小钉。', '木工术语'],
  ['DRAM', '/dræm/', 'n.', '少量（液体单位）', 'A dram of whisky.', '一点威士忌。', '苏格兰常用'],
  ['BREAK', '/breɪk/', 'v./n.', '打破；休息', 'Take a break.', '休息一下。', 'break / broke / broken'],
  ['BAKER', '/ˈbeɪkər/', 'n.', '面包师', 'The baker bakes.', '面包师烘焙。', 'baker\'s dozen = 13'],
  ['BRAKE', '/breɪk/', 'n.', '刹车', 'Step on the brake.', '踩刹车。', 'brake vs break'],
  ['REBAR', '/ˈriːbɑːr/', 'n.', '钢筋', 'Rebar in concrete.', '混凝土中的钢筋。', '建筑术语'],
  ['BARE', null, null, null, null, null, null], // dup
  ['BEAK', '/biːk/', 'n.', '鸟嘴', 'Sharp beak.', '尖喙。', '鸟类专用'],
  ['BRAE', '/breɪ/', 'n.', '山坡（苏格兰）', 'A grassy brae.', '草坡。', '苏格兰英语'],
  ['REAR', '/rɪər/', 'n./v.', '后部；养育', 'At the rear.', '在后面。', 'rear-view mirror'],
  ['EAR', null, null, null, null, null, null], // dup
  ['ARE', null, null, null, null, null, null], // dup
  ['BAKE', '/beɪk/', 'v.', '烘烤', 'Bake a cake.', '烤蛋糕。', 'baker / bakery'],
  ['RAKE', '/reɪk/', 'n./v.', '耙子；用耙子耙', 'Rake the leaves.', '耙落叶。', 'gardening tool'],
  ['LAKE', '/leɪk/', 'n.', '湖泊', 'A blue lake.', '蓝色湖泊。', 'Great Lakes 美加边境'],
  ['WAKE', '/weɪk/', 'v.', '醒来', 'Wake up early.', '早起。', 'wake / woke / woken'],
  ['MAKE', '/meɪk/', 'v.', '做；制造', 'Make a wish.', '许愿。', 'make / made / made'],
  ['TAKE', '/teɪk/', 'v.', '拿；带', 'Take the book.', '拿这本书。', 'take / took / taken'],
  ['CAKE', '/keɪk/', 'n.', '蛋糕', 'A birthday cake.', '生日蛋糕。', 'piece of cake = 容易'],
  ['FAKE', '/feɪk/', 'adj.', '假的', 'A fake smile.', '假笑。', 'fake news'],
  ['SAKE', '/seɪk/', 'n.', '缘故；目的', 'For your sake.', '为了你。', 'for the sake of'],
  ['JAKE', '/dʒeɪk/', 'n.', '没问题（俚）', 'It\'s all jake.', '一切都好。', '口语用法少见'],
  ['HEARD', '/hɜːrd/', 'v.', 'hear 过去式', 'I heard the news.', '我听说了。', 'hear / heard / heard'],
  ['HARED', '/heərd/', 'v.', '飞奔（hare 过去式）', 'She hared off.', '她飞奔而去。', '英式俚语'],
  ['HADER', '/ˈheɪdər/', 'n.', '冰雹云（罕见）', 'A hader cloud.', '冰雹云。', '罕用气象词'],
  ['SHARE', '/ʃeər/', 'n./v.', '分享；股份', 'Share the cake.', '分享蛋糕。', 'sharing 同根'],
  ['SHARP', '/ʃɑːrp/', 'adj.', '锋利的', 'A sharp knife.', '锋利的刀。', 'sharpen 同根'],
  ['SHARES', '/ʃeərz/', 'n.pl.', '股份（复数）', 'Buy shares.', '购买股份。', 'share 的复数'],
  ['CLEAN', '/kliːn/', 'adj./v.', '干净的；清洁', 'Clean the room.', '打扫房间。', 'cleaner / cleaning'],
  ['LANCE', '/læns/', 'n.', '长矛', 'A knight\'s lance.', '骑士的长矛。', 'lancer = 骑兵'],
  ['CLEAR', '/klɪər/', 'adj.', '清楚的', 'A clear sky.', '晴朗的天空。', 'clearly 同根'],
  ['LACER', '/ˈleɪsər/', 'n.', '系带的人/物', 'A shoe lacer.', '系鞋带工具。', 'lace 派生'],
  ['CLEAT', '/kliːt/', 'n.', '楔子；钉鞋', 'Football cleats.', '足球钉鞋。', '运动术语'],
  ['ECLAT', '/eɪˈklɑː/', 'n.', '辉煌；显赫', 'With great eclat.', '盛大辉煌地。', '法语借词'],
  ['LATER', '/ˈleɪtər/', 'adv.', '稍后', 'See you later.', '回头见。', 'late 的比较级'],
  ['ALERT', '/əˈlɜːrt/', 'adj.', '警觉的', 'Stay alert.', '保持警觉。', 'red alert = 红色警报'],
  ['ALTER', '/ˈɔːltər/', 'v.', '改变', 'Alter the design.', '改变设计。', 'alteration 同根'],
  ['LATTE', '/ˈlɑːteɪ/', 'n.', '拿铁', 'A vanilla latte.', '香草拿铁。', '咖啡饮品'],
  ['STARE', '/steər/', 'v.', '凝视', 'Don\'t stare.', '别盯着看。', 'staring 同根'],
  ['TEARS', '/tɪərz/', 'n.pl.', '眼泪（复数）', 'Tears of joy.', '喜悦的泪水。', 'tear 的复数'],
  ['TARES', '/teərz/', 'n.pl.', '杂草', 'Tares in the wheat.', '麦中杂草。', '圣经常见词'],
  ['RATES', '/reɪts/', 'n.pl.', '比率（复数）', 'Interest rates.', '利率。', 'rate 的复数'],
  ['ASTER', '/ˈæstər/', 'n.', '紫菀', 'Purple aster.', '紫色紫菀。', '花卉名'],
  ['EATER', '/ˈiːtər/', 'n.', '食客；食用者', 'Big eater.', '大胃王。', 'eater 派生'],
  ['REAM', '/riːm/', 'n.', '令（纸量单位）', 'A ream of paper.', '一令纸。', '500 张'],
  ['MEAR', '/mɪər/', 'n.', '边界（古英语）', 'An old mear.', '古老边界。', '罕用'],
  ['MARE', null, null, null, null, null, null], // dup
  ['MEAT', '/miːt/', 'n.', '肉', 'Eat less meat.', '少吃肉。', 'meatball = 肉丸'],
  ['MATE', '/meɪt/', 'n.', '伙伴', 'My best mate.', '我最好的伙伴。', '英式 mate'],
  ['TEAM', '/tiːm/', 'n.', '团队', 'A great team.', '一个好团队。', 'teammate / teamwork'],
  ['TAME', '/teɪm/', 'adj.', '驯服的', 'A tame lion.', '驯服的狮子。', 'tamer 同根'],
  ['MEET', '/miːt/', 'v.', '遇见', 'Nice to meet you.', '很高兴见到你。', 'meet / met / met'],
  ['META', '/ˈmetə/', 'adj.', '元；超越', 'Meta data.', '元数据。', '常见前缀'],
  ['EMIT', '/ɪˈmɪt/', 'v.', '发出；散发', 'Emit light.', '发光。', 'emission 同根'],
  ['ITEM', '/ˈaɪtəm/', 'n.', '项目；物品', 'On the agenda item.', '议程项目。', 'itemize 同根'],
  ['MITE', '/maɪt/', 'n.', '螨虫；少许', 'A dust mite.', '尘螨。', 'mighty 类似拼写'],
  ['TIME', '/taɪm/', 'n.', '时间', 'What time is it?', '几点了？', 'timely 同根'],
  ['MIME', '/maɪm/', 'n.', '哑剧', 'A mime artist.', '哑剧演员。', 'mimic 同根'],
  ['LIME', null, null, null, null, null, null], // dup
  ['LIMIT', '/ˈlɪmɪt/', 'n.', '限制', 'Speed limit.', '限速。', 'limited 同根'],
  ['MILTS', '/mɪlts/', 'n.pl.', '鱼精囊（复数）', 'Fish milts.', '鱼精囊。', 'milt = 鱼精囊'],
  ['SLIM', '/slɪm/', 'adj.', '苗条的', 'A slim build.', '苗条的身材。', 'slim down = 减肥'],
  ['MILS', null, null, null, null, null, null], // dup
  ['MIST', '/mɪst/', 'n.', '雾气', 'Morning mist.', '晨雾。', 'misty 同根'],
  ['MITS', '/mɪts/', 'n.pl.', '连指手套（复数 mitt 简写）', 'Wear mits.', '戴手套。', 'mitt 简写'],
  ['ITS', '/ɪts/', 'pron.', '它的', 'Its tail wags.', '它的尾巴摇。', 'it\'s vs its 区分'],
  ['SIT', '/sɪt/', 'v.', '坐', 'Please sit down.', '请坐下。', 'sit / sat / sat'],
  ['TIS', '/tɪz/', 'v.', 'it is 的缩写（古）', 'Tis the season.', '这正是时候。', '诗用古语'],
  ['LIT', null, null, null, null, null, null], // dup
];

// Filter out the placeholder duplicate entries
const dictRaw = SEED.filter((row) => row[1] !== null);

// Build dictionary object, dedupe by uppercase
const dictionary = {};
for (const [word, phonetic, pos, meaning, example, exampleCn, extra] of dictRaw) {
  const key = word.toUpperCase();
  if (dictionary[key]) continue;
  const entry = {
    phonetic,
    pos,
    meaning,
    example,
    exampleCn,
  };
  if (extra) entry.extra = extra;
  dictionary[key] = entry;
}

const allWords = Object.keys(dictionary);
console.log(`Dictionary: ${allWords.length} unique words.`);

// ─────────────────────────────────────────────────────────────────────────────
// Level generation algorithm.
// Each level: pick a "mother" word (4-7 letters). Find candidate secondary words
// from the dictionary that:
//   - Are made from a subset of the mother's letters (anagram subset)
//   - Begin with a letter that appears in the mother word
//   - Length 2-(motherLen)
//   - Are not the mother word itself
// Place mother horizontally at row 0, col 0.
// For each chosen secondary, place vertically at (0, col) where col is the index
// of its first letter in the mother word. Two secondaries cannot share a column.
// ─────────────────────────────────────────────────────────────────────────────

function canFormFromLetters(word, motherLetters) {
  const bag = [...motherLetters];
  for (const c of word) {
    const idx = bag.indexOf(c);
    if (idx === -1) return false;
    bag.splice(idx, 1);
  }
  return true;
}

function findSecondaries(motherWord, dict) {
  const motherLetters = motherWord.split('');
  const candidates = [];
  for (const word of Object.keys(dict)) {
    if (word === motherWord) continue;
    if (word.length < 2 || word.length > motherWord.length) continue;
    if (!canFormFromLetters(word, motherLetters)) continue;
    const firstChar = word[0];
    const col = motherLetters.indexOf(firstChar);
    if (col === -1) continue;
    candidates.push({ word, col });
  }
  return candidates;
}

function pickLevelAnswers(motherWord, dict, rng) {
  const candidates = findSecondaries(motherWord, dict);
  if (candidates.length < 2) return null;

  // Group by column, randomize within group, then shuffle group order
  const byCol = new Map();
  for (const c of candidates) {
    if (!byCol.has(c.col)) byCol.set(c.col, []);
    byCol.get(c.col).push(c);
  }
  const cols = [...byCol.keys()];
  shuffle(cols, rng);
  for (const col of cols) shuffle(byCol.get(col), rng);

  // Pick one secondary per column, up to maxSecondaries
  const motherLen = motherWord.length;
  const maxSecondaries = Math.min(5, motherLen - 1, cols.length);
  const minSecondaries = 2;
  const targetCount = minSecondaries + Math.floor(rng() * (maxSecondaries - minSecondaries + 1));
  const chosen = [];
  for (const col of cols) {
    if (chosen.length >= targetCount) break;
    chosen.push(byCol.get(col)[0]);
  }
  if (chosen.length < minSecondaries) return null;

  const answers = [
    { word: motherWord, row: 0, col: 0, dir: 'H' },
    ...chosen.map(({ word, col }) => ({ word, row: 0, col, dir: 'V' })),
  ];
  return answers;
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Deterministic PRNG for reproducible level generation
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build 60 levels. Difficulty curve: chapter 1-2 → 3-4 letter mothers,
// chapter 3-4 → 4-5 letters, chapter 5-6 → 5-7 letters.
// ─────────────────────────────────────────────────────────────────────────────

// Seed the first 8 levels with the original hand-curated MVP set so returning
// players see familiar content. Chapter 1 then fills levels 9-10 algorithmically.
const SEED_LEVELS = [
  { letters: ['C', 'A', 'T'], answers: [
    { word: 'CAT', row: 0, col: 0, dir: 'H' },
    { word: 'ACT', row: 0, col: 1, dir: 'V' },
  ]},
  { letters: ['D', 'O', 'G'], answers: [
    { word: 'DOG', row: 0, col: 0, dir: 'H' },
    { word: 'GOD', row: 0, col: 2, dir: 'V' },
  ]},
  { letters: ['S', 'T', 'A', 'R'], answers: [
    { word: 'STAR', row: 0, col: 0, dir: 'H' },
    { word: 'RATS', row: 0, col: 3, dir: 'V' },
    { word: 'TAR', row: 0, col: 1, dir: 'V' },
  ]},
  { letters: ['L', 'O', 'V', 'E'], answers: [
    { word: 'LOVE', row: 0, col: 0, dir: 'H' },
    { word: 'VOLE', row: 0, col: 2, dir: 'V' },
  ]},
  { letters: ['R', 'A', 'I', 'N'], answers: [
    { word: 'RAIN', row: 0, col: 0, dir: 'H' },
    { word: 'RAN', row: 0, col: 0, dir: 'V' },
    { word: 'AIR', row: 0, col: 1, dir: 'V' },
  ]},
  { letters: ['P', 'L', 'A', 'Y'], answers: [
    { word: 'PLAY', row: 0, col: 0, dir: 'H' },
    { word: 'PAL', row: 0, col: 0, dir: 'V' },
    { word: 'LAY', row: 0, col: 1, dir: 'V' },
  ]},
  { letters: ['S', 'M', 'I', 'L', 'E'], answers: [
    { word: 'SMILE', row: 0, col: 0, dir: 'H' },
    { word: 'MILE', row: 0, col: 1, dir: 'V' },
    { word: 'LIME', row: 0, col: 3, dir: 'V' },
  ]},
  { letters: ['H', 'O', 'U', 'S', 'E'], answers: [
    { word: 'HOUSE', row: 0, col: 0, dir: 'H' },
    { word: 'HOSE', row: 0, col: 0, dir: 'V' },
    { word: 'USE', row: 0, col: 2, dir: 'V' },
  ]},
];

const CHAPTER_PROFILES = [
  { chapter: 1, lengths: [4, 4, 5] }, // first 8 hand-seeded; only 2 generated here
  { chapter: 2, lengths: [4, 4, 5] },
  { chapter: 3, lengths: [4, 5, 5] },
  { chapter: 4, lengths: [5, 5, 6] },
  { chapter: 5, lengths: [5, 6, 6] },
  { chapter: 6, lengths: [6, 6, 7] },
];

const motherPool = {};
for (const word of allWords) {
  const len = word.length;
  if (!motherPool[len]) motherPool[len] = [];
  motherPool[len].push(word);
}

const rng = mulberry32(42);
for (const len of Object.keys(motherPool)) shuffle(motherPool[len], rng);

const levels = [];
const usedMothers = new Set();
const wantPerChapter = 10;

// Pre-seed first 8 levels (chapter 1)
for (const seed of SEED_LEVELS) {
  const motherWord = seed.answers.find((a) => a.dir === 'H')?.word ?? seed.letters.join('');
  usedMothers.add(motherWord);
  levels.push({
    id: '',
    letters: seed.letters,
    answers: seed.answers,
    chapter: 1,
  });
}

for (let chapterIdx = 0; chapterIdx < CHAPTER_PROFILES.length; chapterIdx++) {
  const profile = CHAPTER_PROFILES[chapterIdx];
  const alreadyInChapter = levels.filter((l) => l.chapter === profile.chapter).length;
  const need = wantPerChapter - alreadyInChapter;
  const chapterLevels = [];
  let safetyCounter = 0;
  while (chapterLevels.length < need && safetyCounter++ < 5000) {
    const len = profile.lengths[Math.floor(rng() * profile.lengths.length)];
    const pool = motherPool[len] ?? [];
    if (pool.length === 0) continue;
    const candidate = pool[Math.floor(rng() * pool.length)];
    if (usedMothers.has(candidate)) continue;
    const answers = pickLevelAnswers(candidate, dictionary, rng);
    if (!answers) {
      usedMothers.add(candidate); // mark as failed so we skip it
      continue;
    }
    usedMothers.add(candidate);
    chapterLevels.push({
      id: '',
      letters: candidate.split(''),
      answers,
      chapter: profile.chapter,
    });
  }
  if (chapterLevels.length < need) {
    console.warn(`Chapter ${profile.chapter}: generated ${chapterLevels.length}/${need} via profile. Padding from unused mothers.`);
    const fallback = allWords.filter((w) => !usedMothers.has(w) && w.length >= 3 && w.length <= 7);
    shuffle(fallback, rng);
    for (const candidate of fallback) {
      if (chapterLevels.length >= need) break;
      const answers = pickLevelAnswers(candidate, dictionary, rng);
      if (!answers) continue;
      usedMothers.add(candidate);
      chapterLevels.push({
        id: '',
        letters: candidate.split(''),
        answers,
        chapter: profile.chapter,
      });
    }
  }
  levels.push(...chapterLevels);
}

if (levels.length < 60) {
  console.error(`Only generated ${levels.length} levels. Need to expand dictionary.`);
  process.exit(1);
}

// Renumber sequentially with zero-padded ids
levels.forEach((lvl, idx) => {
  lvl.id = `L${String(idx + 1).padStart(2, '0')}`;
});

// Validate every answer word has a dictionary entry
const missing = new Set();
for (const lvl of levels) {
  for (const ans of lvl.answers) {
    if (!dictionary[ans.word]) missing.add(ans.word);
  }
}
if (missing.size > 0) {
  console.error('Missing dictionary entries:', [...missing]);
  process.exit(1);
}

// Sort dictionary by key for stable diff
const sortedDict = {};
for (const k of Object.keys(dictionary).sort()) sortedDict[k] = dictionary[k];

// Write outputs
const dictPath = path.join(DATA_DIR, 'dictionary.json');
const levelsPath = path.join(DATA_DIR, 'levels.json');
fs.writeFileSync(dictPath, JSON.stringify(sortedDict, null, 2) + '\n');
fs.writeFileSync(levelsPath, JSON.stringify({ levels }, null, 2) + '\n');

console.log(`Wrote ${Object.keys(sortedDict).length} dictionary entries to ${dictPath}`);
console.log(`Wrote ${levels.length} levels to ${levelsPath}`);

// Quick stats
const byChapter = {};
for (const l of levels) byChapter[l.chapter] = (byChapter[l.chapter] ?? 0) + 1;
console.log('Levels per chapter:', byChapter);
