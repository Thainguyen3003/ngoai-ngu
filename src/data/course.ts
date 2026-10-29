import type { Lang, Unit, Word } from '../types';

export const LANGS: Record<Lang, { name: string; short: string; badge: string; level: string; tts: string; tag: string; join: string; sample: string; desc: string }> = {
  en: { name: 'Tiếng Anh', short: 'Anh', badge: 'EN', level: 'A1', tts: 'en-US', tag: 'en', join: ' ', sample: 'ABC', desc: 'Lộ trình A1 → C2 · phiên âm IPA' },
  zh: { name: 'Tiếng Trung', short: 'Trung', badge: '中', level: 'HSK 1', tts: 'zh-CN', tag: 'zh-CN', join: '', sample: '汉字', desc: 'Lộ trình HSK 1 → 9 · pinyin và thanh điệu' },
  ja: { name: 'Tiếng Nhật', short: 'Nhật', badge: '日', level: 'N5', tts: 'ja-JP', tag: 'ja', join: '', sample: 'かな', desc: 'Lộ trình N5 → N1 · Hiragana, Katakana, Kanji' },
};

export const ORDER: Lang[] = ['en', 'zh', 'ja'];

type RawWord = Omit<Word, 'lang' | 'unit' | 'id'>;
const W = (w: string, r: string, m: string, ex: string, exR: string, exM: string, ro = ''): RawWord => ({ w, r, m, ex, exR, exM, ro });

const RAW: Record<Lang, { id: string; title: string; words: RawWord[] }[]> = {
  en: [
    { id: 'u1', title: 'Chào hỏi', words: [
      W('hello', '/həˈləʊ/', 'xin chào', 'Hello,|my|name|is|Lan.', '', 'Xin chào, tôi tên là Lan.'),
      W('goodbye', '/ˌɡʊdˈbaɪ/', 'tạm biệt', 'Goodbye,|see|you|tomorrow.', '', 'Tạm biệt, hẹn gặp ngày mai.'),
      W('thank you', '/ˈθæŋk juː/', 'cảm ơn', 'Thank you|for|your|help.', '', 'Cảm ơn bạn đã giúp đỡ.'),
      W('please', '/pliːz/', 'làm ơn, vui lòng', 'Please|sit|down.', '', 'Mời bạn ngồi.'),
      W('sorry', '/ˈsɒri/', 'xin lỗi', 'Sorry,|I|am|late.', '', 'Xin lỗi, tôi đến muộn.'),
      W('friend', '/frend/', 'bạn bè', 'She|is|my|best|friend.', '', 'Cô ấy là bạn thân nhất của tôi.'),
    ] },
    { id: 'u2', title: 'Ăn uống', words: [
      W('water', '/ˈwɔːtə/', 'nước', 'Can|I|have|some|water?', '', 'Cho tôi xin ít nước được không?'),
      W('rice', '/raɪs/', 'cơm, gạo', 'We|eat|rice|every|day.', '', 'Chúng tôi ăn cơm mỗi ngày.'),
      W('coffee', '/ˈkɒfi/', 'cà phê', 'I|drink|coffee|in the morning.', '', 'Tôi uống cà phê vào buổi sáng.'),
      W('bread', '/bred/', 'bánh mì', 'This|bread|is|fresh.', '', 'Bánh mì này còn mới.'),
      W('delicious', '/dɪˈlɪʃəs/', 'ngon', 'The|soup|is|delicious.', '', 'Món súp rất ngon.'),
      W('hungry', '/ˈhʌŋɡri/', 'đói', 'I|am|very|hungry.', '', 'Tôi rất đói.'),
    ] },
    { id: 'u3', title: 'Gia đình', words: [
      W('mother', '/ˈmʌðə/', 'mẹ', 'My|mother|is|a teacher.', '', 'Mẹ tôi là giáo viên.'),
      W('father', '/ˈfɑːðə/', 'bố', 'My|father|works|in Hanoi.', '', 'Bố tôi làm việc ở Hà Nội.'),
      W('brother', '/ˈbrʌðə/', 'anh trai, em trai', 'I|have|one|brother.', '', 'Tôi có một anh trai.'),
      W('sister', '/ˈsɪstə/', 'chị gái, em gái', 'My|sister|likes|music.', '', 'Em gái tôi thích âm nhạc.'),
      W('family', '/ˈfæməli/', 'gia đình', 'I|love|my|family.', '', 'Tôi yêu gia đình mình.'),
      W('home', '/həʊm/', 'nhà', 'Let’s|go|home.', '', 'Về nhà thôi.'),
    ] },
    { id: 'u4', title: 'Số đếm', words: [] },
  ],
  zh: [
    { id: 'u1', title: 'Chào hỏi', words: [
      W('你好', 'nǐ hǎo', 'xin chào', '你好，|老师！', 'Nǐ hǎo, lǎoshī!', 'Em chào thầy/cô!'),
      W('谢谢', 'xiè xie', 'cảm ơn', '谢谢|你。', 'Xièxie nǐ.', 'Cảm ơn bạn.'),
      W('再见', 'zài jiàn', 'tạm biệt', '老师，|再见！', 'Lǎoshī, zàijiàn!', 'Tạm biệt thầy/cô!'),
      W('对不起', 'duì bu qǐ', 'xin lỗi', '对不起，|我|来|晚|了。', 'Duìbuqǐ, wǒ lái wǎn le.', 'Xin lỗi, tôi đến muộn.'),
      W('朋友', 'péng you', 'bạn bè', '他|是|我的|朋友。', 'Tā shì wǒ de péngyou.', 'Anh ấy là bạn của tôi.'),
      W('老师', 'lǎo shī', 'giáo viên', '她|是|老师。', 'Tā shì lǎoshī.', 'Cô ấy là giáo viên.'),
    ] },
    { id: 'u2', title: 'Ăn uống', words: [
      W('水', 'shuǐ', 'nước', '我|喝|水。', 'Wǒ hē shuǐ.', 'Tôi uống nước.'),
      W('米饭', 'mǐ fàn', 'cơm', '我|吃|米饭。', 'Wǒ chī mǐfàn.', 'Tôi ăn cơm.'),
      W('茶', 'chá', 'trà', '你|喝|茶|吗？', 'Nǐ hē chá ma?', 'Bạn uống trà không?'),
      W('吃', 'chī', 'ăn', '我们|吃饭|吧。', 'Wǒmen chīfàn ba.', 'Chúng ta ăn cơm đi.'),
      W('喝', 'hē', 'uống', '你|喝|什么？', 'Nǐ hē shénme?', 'Bạn uống gì?'),
      W('好吃', 'hǎo chī', 'ngon', '这个|很|好吃。', 'Zhège hěn hǎochī.', 'Món này rất ngon.'),
    ] },
    { id: 'u3', title: 'Gia đình', words: [
      W('妈妈', 'mā ma', 'mẹ', '我|妈妈|是|老师。', 'Wǒ māma shì lǎoshī.', 'Mẹ tôi là giáo viên.'),
      W('爸爸', 'bà ba', 'bố', '爸爸|在|家。', 'Bàba zài jiā.', 'Bố ở nhà.'),
      W('哥哥', 'gē ge', 'anh trai', '我|有|一个|哥哥。', 'Wǒ yǒu yí ge gēge.', 'Tôi có một anh trai.'),
      W('姐姐', 'jiě jie', 'chị gái', '姐姐|喝|茶。', 'Jiějie hē chá.', 'Chị gái uống trà.'),
      W('家', 'jiā', 'nhà, gia đình', '我家|有|四|口|人。', 'Wǒ jiā yǒu sì kǒu rén.', 'Nhà tôi có bốn người.'),
      W('爱', 'ài', 'yêu', '我|爱|你。', 'Wǒ ài nǐ.', 'Tôi yêu bạn.'),
    ] },
    { id: 'u4', title: 'Số đếm', words: [] },
  ],
  ja: [
    { id: 'u1', title: 'Chào hỏi', words: [
      W('こんにちは', '', 'xin chào', 'こんにちは、|先生。', 'Konnichiwa, sensei.', 'Em chào thầy/cô.', 'konnichiwa'),
      W('ありがとう', '', 'cảm ơn', 'ありがとう|ございます。', 'Arigatō gozaimasu.', 'Cảm ơn rất nhiều.', 'arigatō'),
      W('さようなら', '', 'tạm biệt', 'さようなら、|また|明日。', 'Sayōnara, mata ashita.', 'Tạm biệt, hẹn mai gặp lại.', 'sayōnara'),
      W('すみません', '', 'xin lỗi', 'すみません、|駅は|どこ|ですか。', 'Sumimasen, eki wa doko desu ka.', 'Xin lỗi, nhà ga ở đâu ạ?', 'sumimasen'),
      W('友達', 'ともだち', 'bạn bè', '友達と|話します。', 'Tomodachi to hanashimasu.', 'Tôi nói chuyện với bạn bè.', 'tomodachi'),
      W('先生', 'せんせい', 'giáo viên', '先生は|優しい|です。', 'Sensei wa yasashii desu.', 'Thầy/cô rất hiền.', 'sensei'),
    ] },
    { id: 'u2', title: 'Ăn uống', words: [
      W('水', 'みず', 'nước', '水を|飲みます。', 'Mizu o nomimasu.', 'Tôi uống nước.', 'mizu'),
      W('ご飯', 'ごはん', 'cơm', 'ご飯を|食べます。', 'Gohan o tabemasu.', 'Tôi ăn cơm.', 'gohan'),
      W('お茶', 'おちゃ', 'trà', 'お茶を|ください。', 'Ocha o kudasai.', 'Cho tôi trà.', 'ocha'),
      W('食べる', 'たべる', 'ăn', 'パンを|食べる。', 'Pan o taberu.', 'Ăn bánh mì.', 'taberu'),
      W('飲む', 'のむ', 'uống', 'コーヒーを|飲む。', 'Kōhī o nomu.', 'Uống cà phê.', 'nomu'),
      W('おいしい', '', 'ngon', 'この|ラーメンは|おいしい。', 'Kono rāmen wa oishii.', 'Mì ramen này ngon.', 'oishii'),
    ] },
    { id: 'u3', title: 'Gia đình', words: [
      W('母', 'はは', 'mẹ (của mình)', '母は|先生|です。', 'Haha wa sensei desu.', 'Mẹ tôi là giáo viên.', 'haha'),
      W('父', 'ちち', 'bố (của mình)', '父は|会社員|です。', 'Chichi wa kaishain desu.', 'Bố tôi là nhân viên công ty.', 'chichi'),
      W('兄', 'あに', 'anh trai (của mình)', '兄は|東京に|います。', 'Ani wa Tōkyō ni imasu.', 'Anh trai tôi ở Tokyo.', 'ani'),
      W('姉', 'あね', 'chị gái (của mình)', '姉は|学生|です。', 'Ane wa gakusei desu.', 'Chị gái tôi là sinh viên.', 'ane'),
      W('家族', 'かぞく', 'gia đình', '家族は|四人|です。', 'Kazoku wa yonin desu.', 'Gia đình tôi có bốn người.', 'kazoku'),
      W('家', 'いえ', 'nhà', '家に|帰ります。', 'Ie ni kaerimasu.', 'Tôi về nhà.', 'ie'),
    ] },
    { id: 'u4', title: 'Số đếm', words: [] },
  ],
};

export const WORDS: Record<string, Word> = {};

export const COURSE = Object.fromEntries(
  ORDER.map((lang) => [
    lang,
    RAW[lang].map((u, i): Unit => ({
      id: u.id,
      n: i + 1,
      title: u.title,
      words: u.words.map((raw) => {
        const word: Word = { ...raw, lang, unit: u.id, id: `${lang}:${raw.w}` };
        WORDS[word.id] = word;
        return word;
      }),
    })),
  ]),
) as Record<Lang, Unit[]>;

export const unitById = (lang: Lang, id: string) => COURSE[lang].find((u) => u.id === id);
export const totalWords = (lang: Lang) => COURSE[lang].reduce((n, u) => n + u.words.length, 0);
export const exText = (w: Word) => w.ex.split('|').join(LANGS[w.lang].join);
/** Phiên âm ngắn để hiện cạnh từ: pinyin, kana (hoặc romaji với từ kana), IPA */
export const readingText = (w: Word) => (w.lang === 'ja' ? w.r || w.ro : w.r);
