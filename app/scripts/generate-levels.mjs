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

  // ── Chapter 7-10 expansion: 6-7 letter mothers + secondaries ──
  // STREAM family (S,T,R,E,A,M)
  ['STREAM', '/striːm/', 'n.', '溪流；流', 'A clear stream.', '清澈的溪流。', 'streaming 同根'],
  ['MASTER', '/ˈmɑːstər/', 'n./v.', '大师；掌握', 'Master the skill.', '掌握技能。', 'mastery / mastered'],
  ['MATERS', null, null, null, null, null, null], // dup placeholder
  ['MATES', '/meɪts/', 'n.', '伙伴（复数）', 'Best mates.', '最好的伙伴。', 'mate 复数'],
  ['TEAMS', '/tiːmz/', 'n.', '队伍（复数）', 'Two teams played.', '两队比赛。', 'team 复数'],
  ['TEARS', '/tɪərz/', 'n.', '眼泪（复数）', 'Tears of joy.', '喜悦的泪水。', 'tear 复数'],
  ['STARE', '/steər/', 'v.', '盯着看', 'Don\'t stare.', '别盯着看。', 'staring 同根'],
  ['MARES', '/meərz/', 'n.', '母马（复数）', 'Two mares grazed.', '两匹母马吃草。', 'mare 复数'],
  ['SMART', '/smɑːrt/', 'adj.', '聪明的；精明的', 'A smart kid.', '一个聪明的孩子。', 'smart phone'],
  ['MARTS', '/mɑːrts/', 'n.', '集市（复数）', 'Open marts.', '开放的集市。', 'mart 复数'],

  // LISTEN family (L,I,S,T,E,N)
  ['LISTEN', '/ˈlɪsən/', 'v.', '听', 'Listen carefully.', '仔细听。', 'listener 同根'],
  ['SILENT', '/ˈsaɪlənt/', 'adj.', '沉默的；安静的', 'A silent room.', '安静的房间。', 'silence 同根'],
  ['TINSEL', '/ˈtɪnsəl/', 'n.', '金属丝；闪光饰物', 'Gold tinsel.', '金色饰物。', '圣诞装饰常见'],
  ['INSET', '/ˈɪnset/', 'n.', '插页；嵌入物', 'Map inset.', '地图嵌图。', 'in + set'],
  ['STEIN', '/staɪn/', 'n.', '啤酒杯', 'Lift the stein.', '举起啤酒杯。', '德语借词'],
  ['LIENS', '/liːnz/', 'n.', '留置权（复数）', 'Tax liens.', '税务留置权。', 'lien 复数'],
  ['NEST', '/nest/', 'n.', '鸟巢', 'A bird\'s nest.', '一个鸟巢。', 'nesting 同根'],
  ['TENS', '/tenz/', 'n.', '十（复数）', 'Tens of people.', '几十人。', 'ten 复数'],
  ['TILE', '/taɪl/', 'n.', '瓷砖', 'Floor tile.', '地砖。', 'tiled 同根'],
  ['TILES', '/taɪlz/', 'n.', '瓷砖（复数）', 'Pretty tiles.', '漂亮的瓷砖。', 'tile 复数'],
  ['LITE', '/laɪt/', 'adj.', '低卡的；轻质的（口语）', 'Lite beer.', '低度啤酒。', 'light 简写'],
  ['LITES', '/laɪts/', 'n.', '灯（复数 informal）', 'Pretty lites.', '漂亮的灯。', '同 lights'],

  // PLATES family (P,L,A,T,E,S)
  ['PLATES', '/pleɪts/', 'n.', '盘子（复数）', 'Stack of plates.', '一摞盘子。', 'plate 复数'],
  ['PLATE', '/pleɪt/', 'n.', '盘子', 'A dinner plate.', '一个餐盘。', 'plated 同根'],
  ['PLEAT', '/pliːt/', 'n.', '褶；裙褶', 'Skirt pleat.', '裙褶。', 'pleated 同根'],
  ['PETAL', '/ˈpetəl/', 'n.', '花瓣', 'Rose petal.', '玫瑰花瓣。', '复数 petals'],
  ['SLATE', '/sleɪt/', 'n.', '板岩；候选名单', 'Slate roof.', '板岩屋顶。', 'slate gray'],
  ['STALE', '/steɪl/', 'adj.', '不新鲜的；陈旧的', 'Stale bread.', '不新鲜的面包。', 'stale joke'],
  ['STEAL', '/stiːl/', 'v.', '偷', 'Don\'t steal.', '别偷东西。', 'steal / stole / stolen'],
  ['LEAPS', '/liːps/', 'n./v.', '跳跃（复数/三单）', 'Leaps of faith.', '信念之跃。', 'leap 复数'],
  ['TAPES', '/teɪps/', 'n.', '磁带（复数）', 'Old tapes.', '旧磁带。', 'tape 复数'],
  ['PASTE', '/peɪst/', 'n./v.', '面糊；粘贴', 'Cut and paste.', '剪切和粘贴。', 'pasting 同根'],
  ['SEAT', '/siːt/', 'n.', '座位', 'Take a seat.', '请坐。', 'seated 同根'],
  ['SEAL', '/siːl/', 'n./v.', '海豹；密封', 'Seal the box.', '密封盒子。', 'sealed 同根'],
  ['LEAP', '/liːp/', 'v./n.', '跳跃', 'A big leap.', '一大跳。', 'leap year'],
  ['PEAS', '/piːz/', 'n.', '豌豆（复数）', 'Green peas.', '青豌豆。', 'pea 复数'],
  ['LAPS', '/læps/', 'n.', '一圈（复数）', 'Three laps.', '三圈。', 'lap 复数'],
  ['PATS', '/pæts/', 'n./v.', '轻拍（复数）', 'Pats on the back.', '轻拍背部。', 'pat 复数'],
  ['TAPS', '/tæps/', 'n.', '水龙头（复数）', 'Two taps.', '两个水龙头。', 'tap 复数'],

  // PLAYER family (P,L,A,Y,E,R)
  ['PLAYER', '/ˈpleɪər/', 'n.', '玩家；运动员', 'Best player.', '最佳球员。', 'play + er'],
  ['PARLEY', '/ˈpɑːrli/', 'n.', '会谈；谈判', 'Hold a parley.', '举行会谈。', '历史词'],
  ['REPLAY', '/ˌriːˈpleɪ/', 'n.', '重播', 'Match replay.', '比赛重播。', 're + play'],
  ['PEARL', '/pɜːrl/', 'n.', '珍珠', 'A pearl ring.', '珍珠戒指。', 'pearly 同根'],
  ['LAYER', '/ˈleɪər/', 'n.', '层', 'A layer of snow.', '一层雪。', 'lay + er'],
  ['RELAY', '/ˈriːleɪ/', 'n.', '接力', 'Relay race.', '接力赛。', 're + lay'],
  ['REPLY', '/rɪˈplaɪ/', 'v./n.', '回复', 'Send a reply.', '发送回复。', 'replied 同根'],
  ['PREY', '/preɪ/', 'n.', '猎物', 'Bird of prey.', '猛禽。', 'predator 同根'],
  ['PRAY', '/preɪ/', 'v.', '祈祷', 'Pray for peace.', '祈祷和平。', 'prayer 同根'],
  ['RYE', '/raɪ/', 'n.', '黑麦', 'Rye bread.', '黑麦面包。', 'rye whiskey'],
  ['PALE', '/peɪl/', 'adj.', '苍白的', 'A pale face.', '苍白的脸。', 'paler 同根'],
  ['YEAR', '/jɪər/', 'n.', '年', 'Last year.', '去年。', 'yearly 同根'],

  // ANSWER family (A,N,S,W,E,R)
  ['ANSWER', '/ˈænsər/', 'n./v.', '回答；答案', 'Give an answer.', '给出答案。', 'answered 同根'],
  ['SWEAR', '/sweər/', 'v.', '发誓；咒骂', 'Swear an oath.', '发誓。', 'swore / sworn'],
  ['WARES', '/weərz/', 'n.', '商品（复数）', 'Show your wares.', '展示商品。', 'ware 复数'],
  ['WANES', '/weɪnz/', 'v.', '减弱（三单）', 'Power wanes.', '力量减弱。', 'wane 三单'],
  ['SNARE', '/sneər/', 'n./v.', '陷阱；圈套', 'Set a snare.', '设陷阱。', 'snared 同根'],
  ['EARNS', '/ɜːrnz/', 'v.', '赚（三单）', 'She earns well.', '她赚得多。', 'earn 三单'],
  ['NEARS', '/nɪərz/', 'v.', '接近（三单）', 'It nears.', '它在接近。', 'near 三单'],
  ['SANER', '/ˈseɪnər/', 'adj.', '更理智的', 'A saner choice.', '更理智的选择。', 'sane + er'],
  ['WARE', '/weər/', 'n.', '商品；器物', 'Glass ware.', '玻璃器皿。', 'aware 同根'],
  ['WARN', '/wɔːrn/', 'v.', '警告', 'I warn you.', '我警告你。', 'warning 同根'],
  ['WARS', '/wɔːrz/', 'n.', '战争（复数）', 'The wars ended.', '战争结束了。', 'war 复数'],
  ['ARES', null, null, null, null, null, null], // dup
  ['EWES', '/juːz/', 'n.', '母羊（复数）', 'Two ewes.', '两只母羊。', 'ewe 复数'],
  ['EWE', '/juː/', 'n.', '母羊', 'A young ewe.', '一只小母羊。', '复数 ewes'],
  ['SEW', '/səʊ/', 'v.', '缝纫', 'Sew a button.', '缝扣子。', 'sewing 同根'],
  ['ANEW', '/əˈnjuː/', 'adv.', '重新；再一次', 'Start anew.', '重新开始。', 'a + new'],

  // FOREST family (F,O,R,E,S,T)
  ['FOREST', '/ˈfɒrɪst/', 'n.', '森林', 'A pine forest.', '松林。', 'forestry 同根'],
  ['FOSTER', '/ˈfɒstər/', 'v.', '寄养；培养', 'Foster a kitten.', '寄养小猫。', 'foster home'],
  ['SOFTER', '/ˈsɒftər/', 'adj.', '更柔软的', 'A softer pillow.', '更柔软的枕头。', 'soft + er'],
  ['STORE', '/stɔːr/', 'n./v.', '商店；储存', 'A toy store.', '一家玩具店。', 'storage 同根'],
  ['ROSE', '/rəʊz/', 'n.', '玫瑰', 'A red rose.', '一朵红玫瑰。', 'roses 复数'],
  ['SORE', '/sɔːr/', 'adj.', '疼痛的', 'A sore throat.', '喉咙痛。', 'sore loser'],
  ['ORES', '/ɔːrz/', 'n.', '矿石（复数）', 'Iron ores.', '铁矿石。', 'ore 复数'],
  ['FORE', '/fɔːr/', 'n.', '前部', 'To the fore.', '到前面。', 'forecast 同根'],
  ['FORT', '/fɔːrt/', 'n.', '堡垒', 'An old fort.', '一个旧堡垒。', 'fortify 同根'],
  ['SORT', '/sɔːrt/', 'v.', '分类', 'Sort the mail.', '分拣邮件。', 'sorted 同根'],
  ['REST', '/rest/', 'n./v.', '休息；剩余', 'Take a rest.', '休息一下。', 'restful 同根'],
  ['ROSE', null, null, null, null, null, null], // dup
  ['FROES', null, null, null, null, null, null], // not used
  ['ROES', '/rəʊz/', 'n.', '鱼卵（复数）', 'Fish roes.', '鱼卵。', 'roe 复数'],
  ['TOES', '/təʊz/', 'n.', '脚趾（复数）', 'Cold toes.', '冰冷的脚趾。', 'toe 复数'],
  ['FOES', '/fəʊz/', 'n.', '敌人（复数）', 'Old foes.', '老对手。', 'foe 复数'],
  ['FOE', '/fəʊ/', 'n.', '敌人', 'Friend or foe.', '朋友还是敌人。', 'foe 复数 foes'],
  ['FRO', '/frəʊ/', 'adv.', '向后', 'To and fro.', '来来回回。', '与 to 搭配'],

  // GARDEN family (G,A,R,D,E,N)
  ['GARDEN', '/ˈɡɑːrdən/', 'n.', '花园', 'A flower garden.', '花园。', 'gardener 同根'],
  ['DANGER', '/ˈdeɪndʒər/', 'n.', '危险', 'In danger.', '处于危险中。', 'dangerous 同根'],
  ['RANGED', '/reɪndʒd/', 'v.', '排列（过去式）', 'They ranged the books.', '他们排列书本。', 'range 过去式'],
  ['ARGUE', null, null, null, null, null, null], // not used
  ['GRADE', '/ɡreɪd/', 'n.', '等级；年级', 'Top grade.', '最高等级。', 'graded 同根'],
  ['ANGER', '/ˈæŋɡər/', 'n.', '愤怒', 'In great anger.', '极度愤怒。', 'angry 同根'],
  ['RAGED', '/reɪdʒd/', 'v.', '愤怒（过去式）', 'He raged at me.', '他对我大发雷霆。', 'rage 过去式'],
  ['GRAND', '/ɡrænd/', 'adj.', '宏伟的', 'A grand hall.', '一个宏伟的大厅。', 'grandeur 同根'],
  ['DEAR', '/dɪər/', 'adj./n.', '亲爱的', 'Dear friend.', '亲爱的朋友。', 'dearly 同根'],
  ['DARE', '/deər/', 'v.', '敢', 'I dare you.', '我量你不敢。', 'daring 同根'],
  ['READ', '/riːd/', 'v.', '阅读', 'Read a book.', '读书。', 'read / read / read'],
  ['NEAR', '/nɪər/', 'adj.', '近的', 'Near home.', '靠近家。', 'nearer 同根'],
  ['EARN', '/ɜːrn/', 'v.', '赚得', 'Earn money.', '赚钱。', 'earning 同根'],
  ['DARN', '/dɑːrn/', 'v.', '缝补；该死', 'Darn it!', '该死！', '与 damn 同'],
  ['REND', '/rend/', 'v.', '撕裂', 'Rend the cloth.', '撕开布。', 'rent 过去式'],
  ['ENDED', null, null, null, null, null, null], // not used
  ['NERD', '/nɜːrd/', 'n.', '书呆子', 'A computer nerd.', '电脑书呆子。', 'nerdy 同根'],
  ['END', '/end/', 'n./v.', '结束', 'The end.', '结束了。', 'ended 同根'],
  ['AGED', '/eɪdʒd/', 'adj.', '上了年纪的', 'An aged man.', '一位年长的男士。', 'age + ed'],

  // CASTLE family (C,A,S,T,L,E)
  ['CASTLE', '/ˈkɑːsəl/', 'n.', '城堡', 'A stone castle.', '一座石头城堡。', 'castles 复数'],
  ['CLEATS', '/kliːts/', 'n.', '钉鞋（复数）', 'Soccer cleats.', '足球钉鞋。', 'cleat 复数'],
  ['CLAST', null, null, null, null, null, null], // not used
  ['LACES', '/leɪsɪz/', 'n.', '鞋带（复数）', 'Tie laces.', '系鞋带。', 'lace 复数'],
  ['LACE', '/leɪs/', 'n./v.', '蕾丝；系带', 'A lace dress.', '蕾丝裙。', 'laced 同根'],
  ['SCALE', '/skeɪl/', 'n.', '比例；秤', 'Large scale.', '大规模。', 'scaled 同根'],
  ['CAST', '/kɑːst/', 'v./n.', '抛掷；演员阵容', 'Cast a vote.', '投票。', 'casting 同根'],
  ['CATS', '/kæts/', 'n.', '猫（复数）', 'Three cats.', '三只猫。', 'cat 复数'],
  ['LATE', '/leɪt/', 'adj.', '晚的；已故的', 'Late at night.', '深夜。', 'lately 同根'],
  ['TALE', '/teɪl/', 'n.', '故事', 'A fairy tale.', '童话故事。', 'tales 复数'],
  ['TEAL', '/tiːl/', 'n.', '水鸭；蓝绿色', 'Teal blue.', '蓝绿色。', '复数 teals'],
  ['SALT', '/sɔːlt/', 'n.', '盐', 'Add salt.', '加盐。', 'salty 同根'],
  ['CLEAT', '/kliːt/', 'n.', '系绳栓；防滑钉', 'A boat cleat.', '船上系缆桩。', '复数 cleats'],
  ['ECLAT', null, null, null, null, null, null], // niche
  ['ATE', null, null, null, null, null, null], // dup

  // KITCHEN family (K,I,T,C,H,E,N) — 7-letter mother
  ['KITCHEN', '/ˈkɪtʃɪn/', 'n.', '厨房', 'In the kitchen.', '在厨房里。', 'kitchens 复数'],
  ['CHICKEN', null, null, null, null, null, null], // diff letters
  ['THICK', '/θɪk/', 'adj.', '厚的', 'A thick book.', '一本厚书。', 'thicker 同根'],
  ['ITCH', '/ɪtʃ/', 'n./v.', '痒', 'An itch on my arm.', '手臂痒。', 'itchy 同根'],
  ['NICHE', '/niːʃ/', 'n.', '小生境；利基', 'Niche market.', '利基市场。', 'niche product'],
  ['CHIN', '/tʃɪn/', 'n.', '下巴', 'Lift your chin.', '抬起下巴。', 'chin up'],
  ['KNIT', '/nɪt/', 'v.', '编织', 'Knit a scarf.', '织围巾。', 'knitting 同根'],
  ['HIKE', '/haɪk/', 'v./n.', '徒步', 'A long hike.', '长途徒步。', 'hiking 同根'],
  ['THEN', '/ðen/', 'adv.', '然后', 'And then.', '然后。', 'thenceforth 同根'],
  ['INCH', '/ɪntʃ/', 'n.', '英寸', 'One inch tall.', '一英寸高。', 'inches 复数'],
  ['KIN', '/kɪn/', 'n.', '亲属', 'Next of kin.', '近亲。', 'kindred 同根'],
  ['HIT', '/hɪt/', 'v.', '击中', 'Hit the ball.', '击球。', 'hitting 同根'],
  ['ETCH', '/etʃ/', 'v.', '蚀刻', 'Etch glass.', '蚀刻玻璃。', 'etching 同根'],
  ['HEN', '/hen/', 'n.', '母鸡', 'A black hen.', '一只黑母鸡。', 'hens 复数'],
  ['NICK', '/nɪk/', 'v.', '划痕；偷', 'Nick the wood.', '划伤木头。', 'nicked 同根'],
  ['ICK', null, null, null, null, null, null], // niche
  ['TIC', '/tɪk/', 'n.', '抽搐', 'A nervous tic.', '神经性抽搐。', 'twitch 同义'],
  ['ICK', null, null, null, null, null, null], // dup

  // PICTURE family (P,I,C,T,U,R,E) — 7-letter mother
  ['PICTURE', '/ˈpɪktʃər/', 'n.', '图片', 'Take a picture.', '拍张照片。', 'pictures 复数'],
  ['CRUET', '/ˈkruːɪt/', 'n.', '调味瓶', 'Salt cruet.', '盐瓶。', '餐具'],
  ['ERUPT', '/ɪˈrʌpt/', 'v.', '爆发', 'The volcano erupted.', '火山爆发。', 'erupted 同根'],
  ['TRIPE', '/traɪp/', 'n.', '牛肚；废话', 'Beef tripe.', '牛肚。', 'tripe 是俚语废话'],
  ['CURE', '/kjʊər/', 'v./n.', '治愈', 'Find a cure.', '找到治愈方法。', 'cured 同根'],
  ['CUTE', '/kjuːt/', 'adj.', '可爱的', 'A cute baby.', '一个可爱的宝宝。', 'cuter 同根'],
  ['RICE', '/raɪs/', 'n.', '米饭', 'Cooked rice.', '熟米饭。', 'rices 罕见'],
  ['PIECE', null, null, null, null, null, null], // diff letters
  ['CITE', '/saɪt/', 'v.', '引用', 'Cite the source.', '注明出处。', 'cited 同根'],
  ['EPIC', '/ˈepɪk/', 'adj./n.', '史诗的', 'An epic story.', '史诗般的故事。', 'epics 复数'],
  ['PIE', '/paɪ/', 'n.', '派；馅饼', 'Apple pie.', '苹果派。', 'pies 复数'],
  ['CUE', '/kjuː/', 'n.', '提示；台球杆', 'Take the cue.', '接到提示。', 'cued 同根'],
  ['TIP', '/tɪp/', 'n.', '小费；尖端', 'Leave a tip.', '留小费。', 'tipped 同根'],
  ['RIP', '/rɪp/', 'v.', '撕开', 'Rip the paper.', '撕开纸张。', 'ripped 同根'],
  ['PUT', '/pʊt/', 'v.', '放', 'Put it down.', '把它放下。', 'put / put / put'],
  ['CUP', '/kʌp/', 'n.', '杯子', 'A cup of tea.', '一杯茶。', 'cups 复数'],
  ['ICE', '/aɪs/', 'n.', '冰', 'Add ice.', '加冰。', 'icy 同根'],
  ['CITRUS', null, null, null, null, null, null], // diff letters

  // VICTORY family (V,I,C,T,O,R,Y) — 7-letter mother
  ['VICTORY', '/ˈvɪktəri/', 'n.', '胜利', 'A clear victory.', '明显的胜利。', 'victorious 同根'],
  ['IVORY', '/ˈaɪvəri/', 'n.', '象牙；象牙色', 'Ivory tower.', '象牙塔。', 'ivories 复数'],
  ['CITY', '/ˈsɪti/', 'n.', '城市', 'In the city.', '在城市里。', 'cities 复数'],
  ['TORY', '/ˈtɔːri/', 'n.', '保守党人', 'British Tory.', '英国保守党人。', '历史词'],
  ['ROOT', null, null, null, null, null, null], // diff letters
  ['RIOT', '/ˈraɪət/', 'n.', '骚乱', 'A street riot.', '街头骚乱。', 'rioting 同根'],
  ['TRIO', '/ˈtriːoʊ/', 'n.', '三人组', 'A jazz trio.', '爵士三重奏。', '复数 trios'],
  ['ROT', '/rɒt/', 'v./n.', '腐烂', 'Don\'t rot.', '别腐烂。', 'rotten 同根'],
  ['TOY', '/tɔɪ/', 'n.', '玩具', 'A wooden toy.', '木玩具。', 'toys 复数'],
  ['COY', '/kɔɪ/', 'adj.', '羞怯的', 'A coy smile.', '羞怯的微笑。', 'coyly 同根'],
  ['CRY', '/kraɪ/', 'v./n.', '哭', 'Don\'t cry.', '别哭。', 'cried 过去式'],
  ['TRY', '/traɪ/', 'v.', '尝试', 'Try harder.', '更努力。', 'tried 过去式'],
  ['YOR', null, null, null, null, null, null], // not a word
  ['IVY', '/ˈaɪvi/', 'n.', '常春藤', 'Ivy on the wall.', '墙上的常春藤。', 'ivies 复数'],
  ['VIC', null, null, null, null, null, null], // not standalone
  ['OIC', null, null, null, null, null, null], // not a word

  // HISTORY family (H,I,S,T,O,R,Y) — 7-letter mother
  ['HISTORY', '/ˈhɪstəri/', 'n.', '历史', 'World history.', '世界历史。', 'historical 同根'],
  ['STORY', '/ˈstɔːri/', 'n.', '故事', 'Tell a story.', '讲个故事。', 'stories 复数'],
  ['SHIRT', '/ʃɜːrt/', 'n.', '衬衫', 'A blue shirt.', '一件蓝衬衫。', 'shirts 复数'],
  ['THIRTY', null, null, null, null, null, null], // diff letters
  ['SHORT', '/ʃɔːrt/', 'adj.', '短的', 'A short walk.', '短途散步。', 'shorter 同根'],
  ['HOIST', '/hɔɪst/', 'v.', '吊起', 'Hoist the flag.', '升起旗帜。', 'hoisted 同根'],
  ['HOSTS', '/həʊsts/', 'n.', '主人（复数）', 'Two hosts.', '两位主人。', 'host 复数'],
  ['ROTS', '/rɒts/', 'v.', '腐烂（三单）', 'Wood rots.', '木头腐烂。', 'rot 三单'],
  ['TRIOS', '/ˈtriːoʊz/', 'n.', '三人组（复数）', 'Two trios.', '两个三重奏。', 'trio 复数'],
  ['RIOTS', '/ˈraɪəts/', 'n.', '骚乱（复数）', 'Street riots.', '街头骚乱。', 'riot 复数'],
  ['HOSE', '/həʊz/', 'n.', '软管', 'Garden hose.', '园艺软管。', 'hosed 同根'],
  ['HOST', '/həʊst/', 'n.', '主人；主持人', 'A good host.', '一位好主人。', 'hosting 同根'],
  ['SHOT', '/ʃɒt/', 'n.', '射击；一次', 'A long shot.', '远射。', 'shots 复数'],
  ['HIS', '/hɪz/', 'pron.', '他的', 'His book.', '他的书。', '与 her 对应'],
  ['HOT', '/hɒt/', 'adj.', '热的', 'Very hot.', '很热。', 'hotter 同根'],
  ['TOY', null, null, null, null, null, null], // dup
  ['STIR', '/stɜːr/', 'v.', '搅拌', 'Stir the soup.', '搅拌汤。', 'stirring 同根'],
  ['ROT', null, null, null, null, null, null], // dup

  // ── More 6-7 letter mothers (use existing secondaries already in dict) ──
  ['FRIEND', '/frend/', 'n.', '朋友', 'A close friend.', '亲密的朋友。', 'friendly 同根'],
  ['DETAIL', '/ˈdiːteɪl/', 'n.', '细节', 'Tiny detail.', '微小细节。', 'detailed 同根'],
  ['POINTS', '/pɔɪnts/', 'n.', '要点（复数）', 'Key points.', '要点。', 'point 复数'],
  ['COUNTRY', '/ˈkʌntri/', 'n.', '国家', 'A vast country.', '广阔的国家。', 'countries 复数'],
  ['READING', '/ˈriːdɪŋ/', 'n.', '阅读', 'I love reading.', '我爱阅读。', 'read + ing'],
  ['WONDERS', '/ˈwʌndərz/', 'n.', '奇迹（复数）', 'Seven wonders.', '七大奇迹。', 'wonder 复数'],
  ['BRACKET', '/ˈbrækɪt/', 'n.', '括号；支架', 'In brackets.', '在括号内。', 'brackets 复数'],
  ['FATHERS', '/ˈfɑːðərz/', 'n.', '父亲（复数）', 'Founding fathers.', '建国元勋。', 'father 复数'],
  ['BLASTER', '/ˈblɑːstər/', 'n.', '喷砂机；爆破工', 'A sand blaster.', '喷砂机。', 'blast + er'],
  ['PLANTER', '/ˈplɑːntər/', 'n.', '种植者；花盆', 'A wooden planter.', '木花盆。', 'plant + er'],
  ['ROUTINE', '/ruːˈtiːn/', 'n.', '日常；惯例', 'Daily routine.', '日常生活。', 'routines 复数'],
  ['PLANETS', '/ˈplænɪts/', 'n.', '行星（复数）', 'Inner planets.', '内行星。', 'planet 复数'],
  ['DREAMS', '/driːmz/', 'n.', '梦（复数）', 'Sweet dreams.', '美梦。', 'dream 复数'],
  ['MEMBER', null, null, null, null, null, null], // skip - double M
  ['CIRCLE', '/ˈsɜːrkəl/', 'n.', '圆圈', 'A drawn circle.', '画的圆圈。', 'circular 同根'],
  ['SQUARE', '/skweər/', 'n.', '正方形；广场', 'A town square.', '城镇广场。', 'squared 同根'],
  ['BUTTER', null, null, null, null, null, null], // skip - double T
  ['SAILED', '/seɪld/', 'v.', '航行（过去式）', 'They sailed home.', '他们航行回家。', 'sail 过去式'],
  ['SAILOR', '/ˈseɪlər/', 'n.', '水手', 'A young sailor.', '年轻水手。', 'sail + or'],
  ['MEDALS', '/ˈmedəlz/', 'n.', '奖牌（复数）', 'Gold medals.', '金牌。', 'medal 复数'],
  ['NORMAL', null, null, null, null, null, null], // skip - double M? no, but limited anags
  ['LADIES', '/ˈleɪdiz/', 'n.', '女士（复数）', 'Ladies first.', '女士优先。', 'lady 复数'],
  ['MASTERY', '/ˈmɑːstəri/', 'n.', '掌握；精通', 'Self-mastery.', '自我掌握。', 'master + y'],
  ['STREAMS', '/striːmz/', 'n.', '溪流（复数）', 'Mountain streams.', '山间溪流。', 'stream 复数'],
  ['ANSWERED', null, null, null, null, null, null], // skip - 8 letters, double E
  ['MARSHES', null, null, null, null, null, null], // skip - double S, less useful
  ['POETRY', '/ˈpəʊətri/', 'n.', '诗歌', 'Modern poetry.', '现代诗歌。', 'poet + ry'],
  ['MARKED', '/mɑːrkt/', 'v.', '标记（过去式）', 'He marked it.', '他做了标记。', 'mark 过去式'],
  ['GLOBAL', null, null, null, null, null, null], // skip - double L
  ['MARKET', '/ˈmɑːrkɪt/', 'n.', '市场', 'A flea market.', '跳蚤市场。', 'markets 复数'],
  ['LATER', '/ˈleɪtər/', 'adv.', '稍后', 'See you later.', '稍后见。', 'late + r'],
  ['ALERT', '/əˈlɜːrt/', 'adj.', '警觉的', 'Stay alert.', '保持警觉。', 'alerted 同根'],
  ['ALTER', '/ˈɔːltər/', 'v.', '改变', 'Alter the plan.', '改变计划。', 'altered 同根'],

  // Filler 5-letter words to enrich families
  ['CRATE', '/kreɪt/', 'n.', '板条箱', 'A wood crate.', '一个木板条箱。', 'crates 复数'],
  ['REACT', '/riˈækt/', 'v.', '反应', 'React quickly.', '迅速反应。', 'reaction 同根'],
  ['TRACE', '/treɪs/', 'v./n.', '追踪；痕迹', 'No trace left.', '没留下痕迹。', 'traced 同根'],
  ['CATER', '/ˈkeɪtər/', 'v.', '迎合；提供饮食', 'Cater to needs.', '迎合需求。', 'catered 同根'],
  ['CARET', '/ˈkærɪt/', 'n.', '插入符号', 'A caret mark.', '插入符号。', '编辑标记'],
  ['HEART', '/hɑːrt/', 'n.', '心', 'A kind heart.', '善良的心。', 'hearts 复数'],
  ['EARTH', '/ɜːrθ/', 'n.', '地球；土', 'Save the earth.', '保护地球。', 'earthly 同根'],
  ['HATER', '/ˈheɪtər/', 'n.', '讨厌某事的人', 'A loud hater.', '吵闹的喷子。', 'hate + r'],
  ['RATES', '/reɪts/', 'n.', '速率（复数）', 'Low rates.', '低利率。', 'rate 复数'],
  ['FATES', '/feɪts/', 'n.', '命运（复数）', 'Cruel fates.', '残酷命运。', 'fate 复数'],
  ['FARES', '/feərz/', 'n.', '票价（复数）', 'Bus fares.', '公交票价。', 'fare 复数'],
  ['FEARS', '/fɪərz/', 'n.', '恐惧（复数）', 'Childhood fears.', '童年恐惧。', 'fear 复数'],
  ['FRETS', '/frets/', 'v.', '烦恼（三单）', 'She frets.', '她在烦恼。', 'fret 三单'],
  ['HATES', '/heɪts/', 'v.', '讨厌（三单）', 'He hates lies.', '他讨厌谎言。', 'hate 三单'],
  ['HEARS', '/hɪərz/', 'v.', '听（三单）', 'She hears it.', '她听见了。', 'hear 三单'],
  ['HEAT', '/hiːt/', 'n.', '热', 'Summer heat.', '夏日炎热。', 'heated 同根'],
  ['FATE', '/feɪt/', 'n.', '命运', 'A cruel fate.', '残酷的命运。', 'fated 同根'],
  ['FARE', '/feər/', 'n.', '票价', 'Train fare.', '火车票价。', 'fares 复数'],
  ['HARE', '/heər/', 'n.', '野兔', 'A swift hare.', '敏捷的野兔。', 'hares 复数'],
  ['STABLE', '/ˈsteɪbəl/', 'adj./n.', '稳定的；马厩', 'A stable job.', '稳定的工作。', 'stables 复数'],
  ['TABLES', '/ˈteɪbəlz/', 'n.', '桌子（复数）', 'Two tables.', '两张桌子。', 'table 复数'],
  ['BASTE', '/beɪst/', 'v.', '浇汁', 'Baste the turkey.', '给火鸡浇汁。', 'basted 同根'],
  ['BREAST', '/brest/', 'n.', '胸；胸脯', 'Chicken breast.', '鸡胸肉。', 'breasts 复数'],
  ['BEAST', '/biːst/', 'n.', '野兽', 'A wild beast.', '野兽。', 'beasts 复数'],
  ['BEATS', '/biːts/', 'v.', '打（三单）', 'He beats drums.', '他打鼓。', 'beat 三单'],
  ['BATES', null, null, null, null, null, null], // proper-ish
  ['SABER', '/ˈseɪbər/', 'n.', '军刀', 'A cavalry saber.', '骑兵军刀。', 'sabers 复数'],
  ['SABRE', null, null, null, null, null, null], // dup
  ['BATES', null, null, null, null, null, null], // dup
  ['DINE', '/daɪn/', 'v.', '用餐', 'Dine out.', '外出就餐。', 'dined 同根'],
  ['FINE', '/faɪn/', 'adj.', '好的；细的', 'A fine day.', '美好的一天。', 'finely 同根'],
  ['FIND', '/faɪnd/', 'v.', '找到', 'Find a way.', '找方法。', 'found 过去式'],
  ['RIDE', '/raɪd/', 'v.', '骑；乘', 'Ride a bike.', '骑自行车。', 'ridden 同根'],
  ['RIND', '/raɪnd/', 'n.', '果皮', 'Lemon rind.', '柠檬皮。', 'rinds 复数'],
  ['FIRE', '/faɪər/', 'n./v.', '火；解雇', 'Make a fire.', '生火。', 'fired 同根'],
  ['IDLE', '/ˈaɪdəl/', 'adj.', '闲置的', 'An idle hour.', '空闲时间。', 'idly 同根'],
  ['DIET', '/ˈdaɪət/', 'n.', '饮食', 'A healthy diet.', '健康饮食。', 'dieted 同根'],
  ['EDIT', '/ˈedɪt/', 'v.', '编辑', 'Edit the file.', '编辑文件。', 'edited 同根'],
  ['TIDE', '/taɪd/', 'n.', '潮汐', 'High tide.', '涨潮。', 'tides 复数'],
  ['TIED', '/taɪd/', 'v.', '系（过去式）', 'He tied his shoes.', '他系鞋带。', 'tie 过去式'],
  ['LIED', '/laɪd/', 'v.', '撒谎（过去式）', 'He lied.', '他撒了谎。', 'lie 过去式'],
  ['DAILY', '/ˈdeɪli/', 'adj./adv.', '每日的', 'Daily news.', '每日新闻。', 'days 同根'],
  ['LADY', '/ˈleɪdi/', 'n.', '女士', 'Old lady.', '老太太。', 'ladies 复数'],

  // POETRY family extras
  ['POET', '/ˈpəʊɪt/', 'n.', '诗人', 'A famous poet.', '著名诗人。', 'poets 复数'],
  ['PORE', '/pɔːr/', 'n.', '毛孔', 'Skin pore.', '皮肤毛孔。', 'pores 复数'],
  ['PORT', '/pɔːrt/', 'n.', '港口', 'Sea port.', '海港。', 'ports 复数'],
  ['TYPE', '/taɪp/', 'n./v.', '类型；打字', 'Type fast.', '快速打字。', 'typed 同根'],
  ['TROY', null, null, null, null, null, null], // proper noun
  ['PYRE', '/paɪər/', 'n.', '柴堆；火葬堆', 'A funeral pyre.', '葬礼柴堆。', 'pyres 复数'],
  ['PRY', '/praɪ/', 'v.', '撬开；窥探', 'Don\'t pry.', '别窥探。', 'pried 过去式'],
  ['ROPE', '/rəʊp/', 'n.', '绳子', 'Tie the rope.', '系绳子。', 'roped 同根'],

  // POINTS family extras
  ['SPOT', '/spɒt/', 'n.', '斑点；位置', 'A red spot.', '红点。', 'spotted 同根'],
  ['STOP', '/stɒp/', 'v.', '停止', 'Stop here.', '在这停。', 'stopped 同根'],
  ['POST', null, null, null, null, null, null], // dup likely
  ['POTS', '/pɒts/', 'n.', '锅（复数）', 'Cooking pots.', '炊锅。', 'pot 复数'],
  ['OPTS', '/ɒpts/', 'v.', '选择（三单）', 'She opts in.', '她选择参加。', 'opt 三单'],
  ['PINT', '/paɪnt/', 'n.', '品脱', 'A pint of milk.', '一品脱牛奶。', 'pints 复数'],
  ['PION', '/ˈpaɪɒn/', 'n.', 'π 介子（物理）', 'A pion decay.', 'π 介子衰变。', '物理粒子'],
  ['INTO', '/ˈɪntə/', 'prep.', '进入', 'Walk into the room.', '走进房间。', 'in + to'],
  ['IONS', '/ˈaɪɒnz/', 'n.', '离子（复数）', 'Charged ions.', '带电离子。', 'ion 复数'],
  ['ION', '/ˈaɪən/', 'n.', '离子', 'A positive ion.', '阳离子。', 'ions 复数'],
  ['NIPS', '/nɪps/', 'v.', '夹（三单）', 'It nips at heels.', '它夹住脚跟。', 'nip 三单'],
  ['TIPS', '/tɪps/', 'n.', '小费（复数）', 'Good tips.', '不错的小费。', 'tip 复数'],
  ['NIP', '/nɪp/', 'v.', '夹；轻咬', 'Nip in the bud.', '防患未然。', 'nipped 同根'],
  ['SNIP', '/snɪp/', 'v.', '剪', 'Snip the thread.', '剪线。', 'snipped 同根'],

  // ROUTINE family extras
  ['ROUTE', '/ruːt/', 'n.', '路线', 'Best route.', '最佳路线。', 'routes 复数'],
  ['OUTER', '/ˈaʊtər/', 'adj.', '外面的', 'Outer space.', '外太空。', 'inner 反义'],
  ['TUNE', '/tjuːn/', 'n.', '曲调', 'A catchy tune.', '朗朗上口的曲调。', 'tuning 同根'],
  ['TURN', '/tɜːrn/', 'v.', '转动', 'Turn left.', '左转。', 'turned 同根'],
  ['RUIN', '/ˈruːɪn/', 'v.', '毁掉', 'Don\'t ruin it.', '别毁了。', 'ruined 同根'],
  ['UNIT', '/ˈjuːnɪt/', 'n.', '单位', 'One unit.', '一个单位。', 'units 复数'],
  ['INERT', '/ɪˈnɜːrt/', 'adj.', '惰性的', 'Inert gas.', '惰性气体。', 'inertia 同根'],
  ['INTRO', '/ˈɪntroʊ/', 'n.', '介绍（口语）', 'Quick intro.', '简短介绍。', 'intro = introduction'],
  ['NOTE', '/nəʊt/', 'n.', '便条', 'A short note.', '简短便条。', 'notes 复数'],
  ['TONE', '/təʊn/', 'n.', '语调；色调', 'A friendly tone.', '友好的语气。', 'tones 复数'],
  ['TONER', '/ˈtəʊnər/', 'n.', '爽肤水；调色剂', 'Apply toner.', '涂爽肤水。', 'toners 复数'],
  ['IRON', '/ˈaɪərn/', 'n.', '铁；熨斗', 'Cast iron.', '铸铁。', 'irons 复数'],
  ['TORE', '/tɔːr/', 'v.', '撕（过去式）', 'He tore it.', '他撕了它。', 'tear 过去式'],
  ['RITE', '/raɪt/', 'n.', '仪式', 'Sacred rite.', '神圣仪式。', 'rites 复数'],
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
  { chapter: 7, lengths: [5, 6, 6] },
  { chapter: 8, lengths: [6, 6, 7] },
  { chapter: 9, lengths: [6, 7, 7] },
  { chapter: 10, lengths: [6, 7, 7] },
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
