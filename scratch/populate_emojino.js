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
  { id: "e1", emoji: "👻🏠🔪👴", name: "Сияние", type: "film", year: 1980, hints: ["Стэнли Кубрик", "Отель 'Оверлук'", "Джек Николсон"] },
  { id: "e2", emoji: "🚢💔🥶🌊", name: "Титаник", type: "film", year: 1997, hints: ["Джеймс Кэмерон", "Леонардо Ди Каприо", "Айсберг"] },
  { id: "e3", emoji: "👨‍💻🕶️💊🧱", name: "Матрица", type: "film", year: 1999, hints: ["Киану Ривз", "Красная таблетка", "Нео"] },
  { id: "e4", emoji: "🔒🔨🌧️🕊️", name: "Побег из Шоушенка", type: "film", year: 1994, hints: ["Тим Роббинс", "Тюрьма", "Морган Фриман"] },
  { id: "e5", emoji: "🚀🕳️🌍⏰", name: "Интерстеллар", type: "film", year: 2014, hints: ["Кристофер Нолан", "Чёрная дыра", "Мэттью Макконахи"] },
  { id: "e6", emoji: "🃏😭🦇🏙️", name: "Джокер", type: "film", year: 2019, hints: ["Тодд Филлипс", "Готэм", "Хоакин Феникс"] },
  { id: "e7", emoji: "⚔️🦁🏟️👑", name: "Гладиатор", type: "film", year: 2000, hints: ["Рассел Кроу", "Древний Рим", "Ридли Скотт"] },
  { id: "e8", emoji: "🏃💨🍫🪖", name: "Форрест Гамп", type: "film", year: 1994, hints: ["Том Хэнкс", "Шоколадные конфеты", "Бегун"] },
  { id: "e9", emoji: "🚗⚡🕰️🛹", name: "Назад в будущее", type: "film", year: 1985, hints: ["Мартин Макфлай", "Машина времени", "Делориан"] },
  { id: "e10", emoji: "🦖🦕🌴🥚", name: "Парк Юрского периода", type: "film", year: 1993, hints: ["Стивен Спилберг", "Динозавры", "Остров"] },
  { id: "e11", emoji: "💍🌋🧝‍♂️🗡️", name: "Властелин колец", type: "film", year: 2001, hints: ["Питер Джексон", "Фродо", "Кольцо всевластия"] },
  { id: "e12", emoji: "🌍💙🐉🌿", name: "Аватар", type: "film", year: 2009, hints: ["Джеймс Кэмерон", "Пандора", "На'ви"] },
  { id: "e13", emoji: "💰🔫💃📊", name: "Криминальное чтиво", type: "film", year: 1994, hints: ["Квентин Тарантино", "Джон Траволта", "Танец"] },
  { id: "e14", emoji: "👊🧼🩸🏢", name: "Бойцовский клуб", type: "film", year: 1999, hints: ["Брэд Питт", "Эдвард Нортон", "Мыло"] },
  { id: "e15", emoji: "🦁🌍🌅👑", name: "Король Лев", type: "film", year: 1994, hints: ["Дисней", "Симба", "Африка"] },
  { id: "e16", emoji: "🏴‍☠️⚓💀🚢", name: "Пираты Карибского моря", type: "film", year: 2003, hints: ["Джонни Депп", "Джек Воробей", "Чёрная жемчужина"] },
  { id: "e17", emoji: "🤖🔫🔧💀", name: "Терминатор", type: "film", year: 1984, hints: ["Арнольд Шварценеггер", "Скайнет", "Я вернусь"] },
  { id: "e18", emoji: "💤🌀🏗️🏙️", name: "Начало", type: "film", year: 2010, hints: ["Кристофер Нолан", "Сон внутри сна", "Леонардо Ди Каприо"] },
  { id: "e19", emoji: "🎭😏💃🏙️", name: "Маска", type: "film", year: 1994, hints: ["Джим Керри", "Зелёная маска", "Стэнли Ипкисс"] },
  { id: "e20", emoji: "🗡️🐺🏔️❄️", name: "Холодное сердце", type: "film", year: 2013, hints: ["Дисней", "Эльза", "Анна"] },
  { id: "e21", emoji: "🚗💨🔫😤💥", name: "Форсаж", type: "film", year: 2001, hints: ["Вин Дизель", "Пол Уокер", "Гонки"] },
  { id: "e22", emoji: "🦇🌙🏙️🦸", name: "Бэтмен", type: "film", year: 2005, hints: ["Кристиан Бэйл", "Готэм", "Брюс Уэйн"] },
  { id: "e23", emoji: "🐝👩‍❤️‍👨🕸️🏙️", name: "Человек-паук", type: "film", year: 2002, hints: ["Сэм Рэйми", "Питер Паркер", "Укус паука"] },
  { id: "e24", emoji: "🎹🌙🌊🌹", name: "Амели", type: "film", year: 2001, hints: ["Оде Тюато", "Франция", "Париж"] },
  { id: "e25", emoji: "🧟‍♂️🏃🔫🏚️", name: "Ходячие мертвецы", type: "serial", year: 2010, hints: ["Рик Граймс", "Зомби-апокалипсис", "Атланта"] },
  { id: "e26", emoji: "👑🐉⚔️🩸", name: "Игра престолов", type: "serial", year: 2011, hints: ["Джордж Мартин", "Железный трон", "Вестерос"] },
  { id: "e27", emoji: "📎💼😂🖨️", name: "Офис", type: "serial", year: 2005, hints: ["Майкл Скотт", "Дандер Миффлин", "Стив Карелл"] },
  { id: "e28", emoji: "🧪💰😎💀", name: "Во все тяжкие", type: "serial", year: 2008, hints: ["Уолтер Уайт", "Метод", "Брайан Крэнстон"] },
  { id: "e29", emoji: "☕🛋️😂🤗", name: "Друзья", type: "serial", year: 1994, hints: ["Центральная кофейня", "Рэйчел и Росс", "Нью-Йорк"] },
  { id: "e30", emoji: "🧠🌙🚲👾", name: "Очень странные дела", type: "serial", year: 2016, hints: ["Джим Хоппер", "Параллельный мир", "Одиннадцать"] },
  { id: "e31", emoji: "🍕🔫👨‍👩‍👦‍👦💰", name: "Клан Сопрано", type: "serial", year: 1999, hints: ["Тони Сопрано", "Мафия", "Нью-Джерси"] },
  { id: "e32", emoji: "🔪🩸🔬🌙", name: "Декстер", type: "serial", year: 2006, hints: ["Майами", "Убийца убийц", "Декстер Морган"] },
  { id: "e33", emoji: "🏥💊🔧🧠", name: "Доктор Хаус", type: "serial", year: 2004, hints: ["Хью Лори", "Диагностика", "Тросточка"] },
  { id: "e34", emoji: "🕵️‍♂️💻🔒🕵️‍♀️", name: "Мистер Робот", type: "serial", year: 2015, hints: ["Эллиот Алдерсон", "Хакер", "Рами Малек"] },
  { id: "e35", emoji: "🧔🏻‍♂️🗡️🏰🥶", name: "Ведьмак", type: "serial", year: 2019, hints: ["Геральт из Ривии", "Цири", "Фэнтези-мир"] },
  { id: "e36", emoji: "🕵️‍♂️🎻🏢🔍", name: "Шерлок", type: "serial", year: 2010, hints: ["Бенедикт Камбербэтч", "Бейкер-стрит 221Б", "Ватсон"] },
  { id: "e37", emoji: "⚛️🍕🏢🎮", name: "Теория большого взрыва", type: "serial", year: 2007, hints: ["Шелдон Купер", "Бугагашенька", "Физики-гики"] },
  { id: "e38", emoji: "🌴✈️💥🏝️", name: "Остаться в живых", type: "serial", year: 2004, hints: ["Авиакатастрофа", "Остров", "Числа 4 8 15 16 23 42"] },
  { id: "e39", emoji: "🍩👨‍👩‍👧‍👦🏠🍺", name: "Симпсоны", type: "serial", year: 1989, hints: ["Спрингфилд", "Гомер", "Жёлтая семья"] },
  { id: "e40", emoji: "🧪🌌🥒🌀", name: "Рик и Морти", type: "serial", year: 2013, hints: ["Огурчик Рик", "Портальная пушка", "Безумный учёный"] },
  { id: "e41", emoji: "🎩🐎🥃🔪", name: "Острые козырьки", type: "serial", year: 2013, hints: ["Томас Шелби", "Бирмингем", "Лезвия в кепках"] },
  { id: "e42", emoji: "📱👁️💀⚙️", name: "Черное зеркало", type: "serial", year: 2011, hints: ["Технологии будущего", "Антиутопия", "Экран смартфона"] },
  { id: "e43", emoji: "🧅💚🏰🐴", name: "Шрек", type: "film", year: 2001, hints: ["Огр", "Болото", "Осёл"] },
  { id: "e44", emoji: "⚡🧙‍♂️🦉🏰", name: "Гарри Поттер", type: "film", year: 2001, hints: ["Хогвартс", "Мальчик, который выжил", "Волан-де-Морт"] },
  { id: "e45", emoji: "⚔️🛸🪐🤖", name: "Звездные войны", type: "film", year: 1977, hints: ["Световой меч", "Дарт Вейдер", "Да пребудет с тобой Сила"] },
  { id: "e46", emoji: "🦸‍♂️🦸‍♀️💎🌍", name: "Мстители", type: "film", year: 2012, hints: ["Marvel", "Камни бесконечности", "Танос"] },
  { id: "e47", emoji: "🥛🔫🪴👧", name: "Леон", type: "film", year: 1994, hints: ["Натали Портман", "Киллер", "Цветок в горшке"] },
  { id: "e48", emoji: "🐭⚡🔦🌿", name: "Зеленая миля", type: "film", year: 1999, hints: ["Джон Коффи", "Тюрьма", "Мышонок под кроватью"] },
  { id: "e49", emoji: "🏠🎄🧱🕸️", name: "Один дома", type: "film", year: 1990, hints: ["Кевин Маккаллистер", "Ловушки", "Рождество"] },
  { id: "e50", emoji: "🦈🏊‍♂️🚢🌊", name: "Челюсти", type: "film", year: 1975, hints: ["Акула-людоед", "Стивен Спилберг", "Океан"] },
  { id: "e51", emoji: "🐴🌹🍷🎩", name: "Крестный отец", type: "film", year: 1972, hints: ["Вито Корлеоне", "Мафия", "Предложение, от которого нельзя отказаться"] },
  { id: "e52", emoji: "🚩🏥🔫⛰️", name: "По соображениям совести", type: "film", year: 2016, hints: ["Эндрю Гарфилд", "Окинава", "Медик без оружия"] },
  { id: "e53", emoji: "🐕🚉🧣😢", name: "Хатико: Самый верный друг", type: "film", year: 2009, hints: ["Ричард Гир", "Верность", "Вокзал"] },
  { id: "e54", emoji: "🧥🔫🎹🇺🇸", name: "Брат 2", type: "film", year: 2000, hints: ["Сергей Бодров", "Чикаго", "В чем сила, брат?"] },
  { id: "e55", emoji: "🌿🥃🔫🎩", name: "Джентльмены", type: "film", year: 2019, hints: ["Гай Ричи", "Марихуана", "Мэттью Макконахи"] },
  { id: "e56", emoji: "🧠📈🔢✍️", name: "Игры разума", type: "film", year: 2001, hints: ["Рассел Кроу", "Математика", "Шизофрения"] },
  { id: "e57", emoji: "🎹🚗🍳🍗", name: "Зеленая книга", type: "film", year: 2018, hints: ["Расистский юг", "Вигго Мортенсен", "Пианист"] },
  { id: "e58", emoji: "💰🥃🛥️💊", name: "Волк с Уолл-стрит", type: "film", year: 2013, hints: ["Джордан Белфорт", "Леонардо Ди Каприо", "Биржа"] },
  { id: "e59", emoji: "🔫🐴🩸⛓️", name: "Джанго освобожденный", type: "film", year: 2012, hints: ["Квентин Тарантино", "Рабство", "Джейми Фокс"] },
  { id: "e60", emoji: "👗🎩💌💃", name: "Гордость и предубеждение", type: "film", year: 2005, hints: ["Джейн Остин", "Элизабет Беннет", "Мистер Дарси"] },
  { id: "e61", emoji: "🏥🌊🧩🔦", name: "Остров проклятых", type: "film", year: 2010, hints: ["Маршал", "Леонардо Ди Каприо", "Психиатрическая лечебница"] },
  { id: "e62", emoji: "📦🕵️‍♂️🌨️📖", name: "Семь", type: "film", year: 1995, hints: ["Семь грехов", "Брэд Питт", "Что в коробке?"] },
  { id: "e63", emoji: "🦋🕯️🦷🥩", name: "Молчание ягнят", type: "film", year: 1991, hints: ["Ганнибал Лектер", "Энтони Хопкинс", "Кларисса"] },
  { id: "e64", emoji: "🎩🪄🕊️🚪", name: "Престиж", type: "film", year: 2006, hints: ["Фокусники", "Кристофер Нолан", "Тесла"] },
  { id: "e65", emoji: "🎹🏚️❄️🍲", name: "Пианист", type: "film", year: 2002, hints: ["Вторая мировая", "Варшавское гетто", "Эдриан Броуди"] },
  { id: "e66", emoji: "💃🕺🎹🌌", name: "Ла-Ла Ленд", type: "film", year: 2016, hints: ["Голливуд", "Мюзикл", "Райан Гослинг"] },
  { id: "e67", emoji: "⛩️🧒🐽🐉", name: "Унесенные призраками", type: "film", year: 2001, hints: ["Баня", "Тихиро", "Безликий"] },
  { id: "e68", emoji: "🏰🚒👒🔮", name: "Ходячий замок", type: "film", year: 2004, hints: ["Хаул", "Софи", "Кальцифер"] },
  { id: "e69", emoji: "👶👵⏰🚢", name: "Загадочная история Бенджамина Баттона", type: "film", year: 2008, hints: ["Брэд Питт", "Омоложение", "Рождение стариком"] },
  { id: "e70", emoji: "⚡🚗👩‍🦳✨", name: "Век Адалин", type: "film", year: 2015, hints: ["Бессмертие", "Авария", "Блейк Лайвли"] },
  { id: "e71", emoji: "🎧🏢🏢🤫", name: "Жизнь других", type: "film", year: 2006, hints: ["ГДР", "Прослушка", "Штази"] },
  { id: "e72", emoji: "🏰🍰🏨🎀", name: "Отель Гранд Будапешт", type: "film", year: 2014, hints: ["Уэс Андерсон", "Консьерж", "Мсье Густав"] },
  { id: "e73", emoji: "🥁🩸🎼🤘", name: "Одержимость", type: "film", year: 2014, hints: ["Барабанщик", "Дж.К. Симмонс", "Ужасный учитель"] },
  { id: "e74", emoji: "🎲🐒🪵🌩️", name: "Джуманджи", type: "film", year: 1995, hints: ["Настольная игра", "Робин Уильямс", "Джунгли"] },
  { id: "e75", emoji: "🏜️🛸🔔👴", name: "Кин-дза-дза!", type: "film", year: 1986, hints: ["Пепелац", "Ку!", "Скрипач не нужен"] },
  { id: "e76", emoji: "🩹💍🛳️🍹", name: "Бриллиантовая рука", type: "film", year: 1968, hints: ["Геша", "Семен Семеныч", "Черт побери!"] },
  { id: "e77", emoji: "🕰️⚔️🤴⚡", name: "Иван Васильевич меняет профессию", type: "film", year: 1973, hints: ["Машина времени", "Царь", "Танцуют все!"] },
  { id: "e78", emoji: "👮‍♂️🧱😴🚚", name: "Операция «Ы»", type: "film", year: 1965, hints: ["Трус, Балбес и Бывалый", "Шурик", "Напарник"] },
  { id: "e79", emoji: "💼👓💃🏢", name: "Служебный роман", type: "film", year: 1977, hints: ["Мымра", "Новосельцев", "Статистическое учреждение"] },
  { id: "e80", emoji: "👳‍♂️🥚🏃‍♂️⛄", name: "Джентльмены удачи", type: "film", year: 1971, hints: ["Доцент", "Шлем", "Редиска"] },
  { id: "e81", emoji: "🧥📻🏢🚂", name: "Брат", type: "film", year: 1997, hints: ["Сергей Бодров", "Питер", "Наутилус Помпилиус"] },
  { id: "e82", emoji: "🕵️‍♂️🎷🚐🎻", name: "Место встречи изменить нельзя", type: "serial", year: 1979, hints: ["Жеглов и Шарапов", "Черная кошка", "Высоцкий"] },
  { id: "e83", emoji: "⚓🕵️‍♂️🏢🍖", name: "Ликвидация", type: "serial", year: 2007, hints: ["Одесса", "Гоцман", "После войны"] },
  { id: "e84", emoji: "📱🔫🚗👬", name: "Бригада", type: "serial", year: 2002, hints: ["Саша Белый", "90-е", "Четыре друга"] },
];

async function run() {
  console.log('Fetching Kinokadr movies...');
  const { data: kMovies } = await supabase.from('kinokadr_movies').select('*');
  console.log(`Found ${kMovies?.length || 0} movies in Kinokadr.`);

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
