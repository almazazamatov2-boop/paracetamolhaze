const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function parseEnv(content) {
  const env = {};
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      env[parts[0].trim()] = parts[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });
  return env;
}

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = parseEnv(envFile);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const movieData = [
  { id: "kp-435", name: "По соображениям совести", emoji: "🚩🏥🔫⛰️", type: "film", year: 2016, hints: ["Эндрю Гарфилд", "Окинава", "Медик без оружия"] },
  { id: "kp-387556", name: "Хатико: Самый верный друг", emoji: "🐕🚉🧣😢", type: "film", year: 2009, hints: ["Ричард Гир", "Верность", "Вокзал"] },
  { id: "kp-41520", name: "Брат 2", emoji: "🧥🔫🎹🇺🇸", type: "film", year: 2000, hints: ["Сергей Бодров", "Чикаго", "В чем сила, брат?"] },
  { id: "kp-1143242", name: "Джентльмены", emoji: "🌿🥃🔫🎩", type: "film", year: 2019, hints: ["Гай Ричи", "Марихуана", "Мэттью Макконахи"] },
  { id: "kp-111543", name: "Темный рыцарь", emoji: "🦇🃏🏙️🤡", type: "film", year: 2008, hints: ["Хит Леджер", "Готэм", "Джокер"] },
  { id: "kp-435", name: "Зеленая миля", emoji: "🐭⚡🔦🌿", type: "film", year: 1999, hints: ["Джон Коффи", "Тюрьма", "Мышонок под кроватью"] },
  { id: "kp-447301", name: "Начало", emoji: "💤🌀🏗️🏙️", type: "film", year: 2010, hints: ["Кристофер Нолан", "Сон внутри сна", "Леонардо Ди Каприо"] },
  { id: "kp-258687", name: "Интерстеллар", emoji: "🚀🕳️🌍⏰", type: "film", year: 201inter, hints: ["Кристофер Нолан", "Чёрная дыра", "Мэттью Макконахи"] },
  { id: "kp-361", name: "Бойцовский клуб", emoji: "👊🧼🩸🏢", type: "film", year: 1999, hints: ["Брэд Питт", "Эдвард Нортон", "Мыло"] },
  { id: "kp-497", name: "Криминальное чтиво", emoji: "💰🔫💃📊", type: "film", year: 1994, hints: ["Квентин Тарантино", "Джон Траволта", "Танец"] },
  { id: "kp-389", name: "Леон", emoji: "🥛🔫🪴👧", type: "film", year: 1994, hints: ["Натали Портман", "Киллер", "Цветок в горшке"] },
  { id: "kp-448", name: "Форрест Гамп", emoji: "🏃💨🍫🪖", type: "film", year: 1994, hints: ["Том Хэнкс", "Шоколадные конфеты", "Бегун"] },
  { id: "kp-301", name: "Матрица", emoji: "👨‍💻🕶️💊🧱", type: "film", year: 1999, hints: ["Киану Ривз", "Красная таблетка", "Нео"] },
  { id: "kp-2360", name: "Король Лев", emoji: "🦁🌍🌅👑", type: "film", year: 1994, hints: ["Дисней", "Симба", "Африка"] },
  { id: "kp-312", name: "Властелин колец", emoji: "💍🌋🧝‍♂️🗡️", type: "film", year: 2001, hints: ["Питер Джексон", "Фродо", "Кольцо всевластия"] },
  { id: "kp-4703", name: "Пираты Карибского моря", emoji: "🏴‍☠️⚓💀🚢", type: "film", year: 2003, hints: ["Джонни Депп", "Джек Воробей", "Чёрная жемчужина"] },
  { id: "kp-326", name: "Побег из Шоушенка", emoji: "🔒🔨🌧️🕊️", type: "film", year: 1994, hints: ["Тим Роббинс", "Тюрьма", "Морган Фриман"] },
  { id: "kp-530", name: "Игры разума", emoji: "🧠📈🔢✍️", type: "film", year: 2001, hints: ["Рассел Кроу", "Математика", "Шизофрения"] },
  { id: "kp-1110787", name: "Зеленая книга", emoji: "🎹🚗🍳🍗", type: "film", year: 2018, hints: ["Расистский юг", "Вигго Мортенсен", "Пианист"] },
  { id: "kp-462356", name: "Волк с Уолл-стрит", emoji: "💰🥃🛥️💊", type: "film", year: 2013, hints: ["Джордан Белфорт", "Леонардо Ди Каприо", "Биржа"] },
  { id: "kp-586397", name: "Джанго освобожденный", emoji: "🔫🐴🩸⛓️", type: "film", year: 2012, hints: ["Квентин Тарантино", "Рабство", "Джейми Фокс"] },
  { id: "kp-81733", name: "Гордость и предубеждение", emoji: "👗🎩💌💃", type: "film", year: 2005, hints: ["Джейн Остин", "Элизабет Беннет", "Мистер Дарси"] },
  { id: "kp-397667", name: "Остров проклятых", emoji: "🏥🌊🧩🔦", type: "film", year: 2010, hints: ["Маршал", "Леонардо Ди Каприо", "Психиатрическая лечебница"] },
  { id: "kp-377", name: "Семь", emoji: "📦🕵️‍♂️🌨️📖", type: "film", year: 1995, hints: ["Семь грехов", "Брэд Питт", "Что в коробке?"] },
  { id: "kp-367", name: "Молчание ягнят", emoji: "🦋🕯️🦷🥩", type: "film", year: 1991, hints: ["Ганнибал Лектер", "Энтони Хопкинс", "Кларисса"] },
  { id: "kp-195325", name: "Престиж", emoji: "🎩🪄🕊️🚪", type: "film", year: 2006, hints: ["Фокусники", "Кристофер Нолан", "Тесла"] },
  { id: "kp-355", name: "Пианист", emoji: "🎹🏚️❄️🍲", type: "film", year: 2002, hints: ["Вторая мировая", "Варшавское гетто", "Эдриан Броуди"] },
  { id: "kp-841081", name: "Ла-Ла Ленд", emoji: "💃🕺🎹🌌", type: "film", year: 2016, hints: ["Голливуд", "Мюзикл", "Райан Гослинг"] },
  { id: "kp-370", name: "Унесенные призраками", emoji: "⛩️🧒🐽🐉", type: "film", year: 2001, hints: ["Баня", "Тихиро", "Безликий"] },
  { id: "kp-49683", name: "Ходячий замок", emoji: "🏰🚒👒🔮", type: "film", year: 2004, hints: ["Хаул", "Софи", "Кальцифер"] },
  { id: "kp-1043658", name: "Паразиты", emoji: "🏠🪜🍜🍑", type: "film", year: 2019, hints: ["🏠", "🪜", "🍜"] },
  { id: "kp-342", name: "12 разгневанных мужчин", emoji: "⚖️👥🥵🏠", type: "film", year: 1957, hints: ["Суд", "Оправдание", "Комната"] },
  { id: "kp-81555", name: "Загадочная история Бенджамина Баттона", emoji: "👶👵⏰🚢", type: "film", year: 2008, hints: ["Брэд Питт", "Омоложение", "Рождение стариком"] },
  { id: "kp-688", name: "Гарри Поттер и Тайная комната", emoji: "🐍🧙‍♂️🏰📕", type: "film", year: 2002, hints: ["Хогвартс", "Василиск", "Дневник Реддла"] },
  { id: "kp-437410", name: "Темный рыцарь: Возрождение легенды", emoji: "🦇💥🏟️🏙️", type: "film", year: 2012, hints: ["Том Харди", "Бэйн", "Яма"] },
  { id: "kp-522876", name: "Век Адалин", emoji: "⚡🚗👩‍🦳✨", type: "film", year: 2015, hints: ["Бессмертие", "Авария", "Блейк Лайвли"] },
  { id: "kp-4996", name: "Общество мертвых поэтов", emoji: "👨‍🏫📖🏫🕊️", type: "film", year: 1989, hints: ["Робин Уильямс", "О капитан, мой капитан!", "Школа"] },
  { id: "kp-8124", name: "Один дома", emoji: "🏠🎄🧱🕸️", type: "film", year: 1990, hints: ["Кевин Маккаллистер", "Ловушки", "Рождество"] },
  { id: "kp-3561", name: "Дневник памяти", emoji: "💌🚣‍♂️🏡👴", type: "film", year: 2004, hints: ["Романтика", "Дом у озера", "Старость"] },
  { id: "kp-2213", name: "Титаник", emoji: "🚢💔🥶🌊", type: "film", year: 1997, hints: ["Айсберг", "Джек и Роза", "Джеймс Кэмерон"] },
  { id: "kp-342", name: "Крестный отец", emoji: "🐴🌹🍷🎩", type: "film", year: 1972, hints: ["Мафия", "Вито Корлеоне", "Семья"] },
  { id: "kp-79", name: "Шрек", emoji: "🧅💚🏰🐴", type: "film", year: 2001, hints: ["Огр", "Болото", "Осел"] },
  { id: "kp-689", name: "Гарри Поттер и Философский камень", emoji: "⚡🧙‍♂️🦉🏰", type: "film", year: 2001, hints: ["Хогвартс", "Квиррелл", "Шляпа"] },
  { id: "kp-333", name: "Звездные войны: Новая надежда", emoji: "⚔️🛸🪐🤖", type: "film", year: 1977, hints: ["Люк Скайуокер", "Джедаи", "Звезда Смерти"] },
  { id: "kp-522", name: "Челюсти", emoji: "🦈🏊‍♂️🚢🌊", type: "film", year: 1975, hints: ["Акула", "Океан", "Спилберг"] },
  { id: "kp-43393", name: "Кин-дза-дза!", emoji: "🏜️🛸🔔👴", type: "film", year: 1986, hints: ["Пепелац", "Ку!", "Плюк"] },
  { id: "kp-46225", name: "Бриллиантовая рука", emoji: "🩹💍🛳️🍹", type: "film", year: 1968, hints: ["Никулин", "Контрабанда", "Песня про зайцев"] },
  { id: "kp-42664", name: "Иван Васильевич меняет профессию", emoji: "🕰️⚔️🤴⚡", type: "film", year: 1973, hints: ["Бунша", "Демьяненко", "Царь"] },
  { id: "kp-42438", name: "Операция «Ы»", emoji: "👮‍♂️🧱😴🚚", type: "film", year: 1965, hints: ["Трус, Балбес, Бывалый", "Шурик", "Склад"] },
  { id: "kp-44745", name: "Служебный роман", emoji: "💼👓💃🏢", type: "film", year: 1977, hints: ["Мымра", "Новосельцев", "Стихи"] },
  { id: "kp-44161", name: "Джентльмены удачи", emoji: "👳‍♂️🥚🏃‍♂️⛄", type: "film", year: 1971, hints: ["Доцент", "Шлем", "Детсад"] },
  { id: "kp-41519", name: "Брат", emoji: "🧥📻🏢🚂", type: "film", year: 1997, hints: ["Бодров", "Питер", "Наутилус"] },
  { id: "kp-43160", name: "Место встречи изменить нельзя", emoji: "🕵️‍♂️🎷🚐🎻", type: "serial", year: 1979, hints: ["Жеглов", "Шарапов", "Высоцкий"] },
  { id: "kp-277537", name: "Ликвидация", emoji: "⚓🕵️‍♂️🏢🍖", type: "serial", year: 2007, hints: ["Одесса", "Гоцман", "Машков"] },
  { id: "kp-78530", name: "Бригада", emoji: "📱🔫🚗👬", type: "serial", year: 2002, hints: ["Безруков", "90-е", "Друзья"] },
  { id: "kp-439", name: "Гладиатор", emoji: "⚔️🦁🏟️👑", type: "film", year: 2000, hints: ["Максимус", "Колизей", "Ридли Скотт"] },
  { id: "kp-476", name: "Назад в будущее", emoji: "🚗⚡🕰️🛹", type: "film", year: 1985, hints: ["Марти", "Док", "Делориан"] },
  { id: "kp-716", name: "Парк Юрского периода", emoji: "🦖🦕🌴🥚", type: "film", year: 1993, hints: ["Динозавры", "Остров", "Спилберг"] },
  { id: "kp-2213", name: "Аватар", emoji: "🌍💙🐉🌿", type: "film", year: 2009, hints: ["Пандора", "На'ви", "Кэмерон"] },
  { id: "kp-522", name: "Маска", emoji: "🎭😏💃🏙️", type: "film", year: 1994, hints: ["Джим Керри", "Собака Майло", "Зеленый"] },
  { id: "kp-453", name: "Холодное сердце", emoji: "🗡️🐺🏔️❄️", type: "film", year: 2013, hints: ["Эльза", "Олаф", "Анна"] },
  { id: "kp-666", name: "Форсаж", emoji: "🚗💨🔫😤💥", type: "film", year: 2001, hints: ["Семья", "Гонки", "Доминик Торетто"] },
  { id: "kp-523", name: "Бэтмен: Начало", emoji: "🦇🌙🏙️🦸", type: "film", year: 2005, hints: ["Кристиан Бэйл", "Нолан", "Пугало"] },
  { id: "kp-525", name: "Человек-паук", emoji: "🐝👩‍❤️‍👨🕸️🏙️", type: "film", year: 2002, hints: ["Тоби Магуайр", "Питер Паркер", "Норман Озборн"] },
];

async function run() {
  console.log('Fetching Kinokadr movies...');
  const { data: kMovies } = await supabase.from('kinokadr_movies').select('*');
  console.log(`Found ${kMovies?.length || 0} movies in Kinokadr.`);

  // Auto-generate emojis for the rest if possible, but for now we use the mapping
  const toInsert = movieData.map(m => ({
    id: m.id,
    title_ru: m.name,
    type: m.type,
    year: m.year,
    emoji: m.emoji,
    hints: m.hints
  }));

  console.log('Inserting into emojino_movies...');
  const { error } = await supabase.from('emojino_movies').upsert(toInsert);

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log('Successfully inserted seed data!');
  }
}

run();
