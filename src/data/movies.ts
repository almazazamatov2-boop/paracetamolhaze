export interface Movie {
  emoji: string
  name: string
  aliases: string[]
  year: number
  type: 'film' | 'serial'
  genre: string
  hints: string[]
}

export const movies: Movie[] = [
  { emoji: "👻🏠🔪👴", name: "Сияние", aliases: ["Сияние", "The Shining"], year: 1980, type: "film", genre: "хоррор", hints: ["Стэнли Кубрик", "Отель 'Оверлук'", "Джек Николсон"] },
  { emoji: "🚢💔🥶🌊", name: "Титаник", aliases: ["Титаник", "Titanic"], year: 1997, type: "film", genre: "драма", hints: ["Джеймс Кэмерон", "Леонардо Ди Каприо", "Айсберг"] },
  { emoji: "👨‍💻🕶️💊🧱", name: "Матрица", aliases: ["Матрица", "The Matrix"], year: 1999, type: "film", genre: "фантастика", hints: ["Киану Ривз", "Красная таблетка", "Нео"] },
  { emoji: "🔒🔨🌧️🕊️", name: "Побег из Шоушенка", aliases: ["Побег из Шоушенка", "Шоушенк", "Shawshank"], year: 1994, type: "film", genre: "драма", hints: ["Тим Роббинс", "Тюрьма", "Морган Фриман"] },
  { emoji: "🚀🕳️🌍⏰", name: "Интерстеллар", aliases: ["Интерстеллар", "Interstellar"], year: 2014, type: "film", genre: "фантастика", hints: ["Кристофер Нолан", "Чёрная дыра", "Мэттью Макконахи"] },
  { emoji: "🃏😭🦇🏙️", name: "Джокер", aliases: ["Джокер", "Joker"], year: 2019, type: "film", genre: "драма", hints: ["Тодд Филлипс", "Готэм", "Хоакин Феникс"] },
  { emoji: "⚔️🦁🏟️👑", name: "Гладиатор", aliases: ["Гладиатор", "Gladiator"], year: 2000, type: "film", genre: "боевик", hints: ["Рассел Кроу", "Древний Рим", "Ридли Скотт"] },
  { emoji: "🏃💨🍫🪖", name: "Форрест Гамп", aliases: ["Форрест Гамп", "Forrest Gump"], year: 1994, type: "film", genre: "драма", hints: ["Том Хэнкс", "Шоколадные конфеты", "Бегун"] },
  { emoji: "🚗⚡🕰️🛹", name: "Назад в будущее", aliases: ["Назад в будущее", "Back to the Future"], year: 1985, type: "film", genre: "фантастика", hints: ["Мартин Макфлай", "Машина времени", "Делориан"] },
  { emoji: "🦖🦕🌴🥚", name: "Парк Юрского периода", aliases: ["Парк Юрского периода", "Jurassic Park"], year: 1993, type: "film", genre: "фантастика", hints: ["Стивен Спилберг", "Динозавры", "Остров"] },
  { emoji: "💍🌋🧝‍♂️🗡️", name: "Властелин колец", aliases: ["Властелин колец", "Lord of the Rings"], year: 2001, type: "film", genre: "фэнтези", hints: ["Питер Джексон", "Фродо", "Кольцо всевластия"] },
  { emoji: "🌍💙🐉🌿", name: "Аватар", aliases: ["Аватар", "Avatar"], year: 2009, type: "film", genre: "фантастика", hints: ["Джеймс Кэмерон", "Пандора", "На'ви"] },
  { emoji: "💰🔫💃📊", name: "Криминальное чтиво", aliases: ["Криминальное чтиво", "Pulp Fiction"], year: 1994, type: "film", genre: "криминал", hints: ["Квентин Тарантино", "Джон Траволта", "Танец"] },
  { emoji: "👊🧼🩸🏢", name: "Бойцовский клуб", aliases: ["Бойцовский клуб", "Fight Club"], year: 1999, type: "film", genre: "триллер", hints: ["Брэд Питт", "Эдвард Нортон", "Мыло"] },
  { emoji: "🦁🌍🌅👑", name: "Король Лев", aliases: ["Король Лев", "Lion King"], year: 1994, type: "film", genre: "мультфильм", hints: ["Дисней", "Симба", "Африка"] },
  { emoji: "🏴‍☠️⚓💀🚢", name: "Пираты Карибского моря", aliases: ["Пираты Карибского моря", "Pirates"], year: 2003, type: "film", genre: "фэнтези", hints: ["Джонни Депп", "Джек Воробей", "Чёрная жемчужина"] },
  { emoji: "🤖🔫🔧💀", name: "Терминатор", aliases: ["Терминатор", "Terminator"], year: 1984, type: "film", genre: "фантастика", hints: ["Арнольд Шварценеггер", "Скайнет", "Я вернусь"] },
  { emoji: "💤🌀🏗️🏙️", name: "Начало", aliases: ["Начало", "Inception"], year: 2010, type: "film", genre: "фантастика", hints: ["Кристофер Нолан", "Сон внутри сна", "Леонардо Ди Каприо"] },
  { emoji: "🎭😏💃🏙️", name: "Маска", aliases: ["Маска", "The Mask"], year: 1994, type: "film", genre: "комедия", hints: ["Джим Керри", "Зелёная маска", "Стэнли Ипкисс"] },
  { emoji: "🗡️🐺🏔️❄️", name: "Холодное сердце", aliases: ["Холодное сердце", "Frozen"], year: 2013, type: "film", genre: "мультфильм", hints: ["Дисней", "Эльза", "Анна"] },
  { emoji: "🚗💨🔫😤💥", name: "Форсаж", aliases: ["Форсаж", "Fast and Furious"], year: 2001, type: "film", genre: "боевик", hints: ["Вин Дизель", "Пол Уокер", "Гонки"] },
  { emoji: "🦇🌙🏙️🦸", name: "Бэтмен", aliases: ["Бэтмен", "Batman"], year: 2005, type: "film", genre: "боевик", hints: ["Кристиан Бэйл", "Готэм", "Брюс Уэйн"] },
  { emoji: "🐝👩‍❤️‍👨🕸️🏙️", name: "Человек-паук", aliases: ["Человек-паук", "Spider-Man"], year: 2002, type: "film", genre: "боевик", hints: ["Сэм Рэйми", "Питер Паркер", "Укус паука"] },
  { emoji: "🎹🌙🌊🌹", name: "Амели", aliases: ["Амели", "Amelie"], year: 2001, type: "film", genre: "комедия", hints: ["Оде Тюато", "Франция", "Париж"] },
  { emoji: "🧟‍♂️🏃🔫🏚️", name: "Ходячие мертвецы", aliases: ["Ходячие мертвецы", "Walking Dead"], year: 2010, type: "serial", genre: "хоррор", hints: ["Рик Граймс", "Зомби-апокалипсис", "Атланта"] },
  { emoji: "👑🐉⚔️🩸", name: "Игра престолов", aliases: ["Игра престолов", "Game of Thrones"], year: 2011, type: "serial", genre: "фэнтези", hints: ["Джордж Мартин", "Железный трон", "Вестерос"] },
  { emoji: "📎💼😂🖨️", name: "Офис", aliases: ["Офис", "The Office"], year: 2005, type: "serial", genre: "комедия", hints: ["Майкл Скотт", "Дандер Миффлин", "Стив Карелл"] },
  { emoji: "🧪💰😎💀", name: "Во все тяжкие", aliases: ["Во все тяжкие", "Breaking Bad"], year: 2008, type: "serial", genre: "драма", hints: ["Уолтер Уайт", "Метод", "Брайан Крэнстон"] },
  { emoji: "☕🛋️😂🤗", name: "Друзья", aliases: ["Друзья", "Friends"], year: 1994, type: "serial", genre: "комедия", hints: ["Центральная кофейня", "Рэйчел и Росс", "Нью-Йорк"] },
  { emoji: "🧠🌙🚲👾", name: "Очень странные дела", aliases: ["Очень странные дела", "Stranger Things"], year: 2016, type: "serial", genre: "фантастика", hints: ["Джим Хоппер", "Параллельный мир", "Одиннадцать"] },
  { emoji: "🍕🔫👨‍👩‍👦‍👦💰", name: "Клан Сопрано", aliases: ["Клан Сопрано", "Sopranos"], year: 1999, type: "serial", genre: "криминал", hints: ["Тони Сопрано", "Мафия", "Нью-Джерси"] },
  { emoji: "🔪🩸🔬🌙", name: "Декстер", aliases: ["Декстер", "Dexter"], year: 2006, type: "serial", genre: "триллер", hints: ["Майами", "Убийца убийц", "Декстер Морган"] },
  { emoji: "🏥💊🔧🧠", name: "Доктор Хаус", aliases: ["Доктор Хаус", "House"], year: 2004, type: "serial", genre: "драма", hints: ["Хью Лори", "Диагностика", "Тросточка"] },
  { emoji: "🕵️‍♂️💻🔒🕵️‍♀️", name: "Мистер Робот", aliases: ["Мистер Робот", "Mr. Robot"], year: 2015, type: "serial", genre: "триллер", hints: ["Эллиот Алдерсон", "Хакер", "Рами Малек"] },
  { emoji: "🧔🏻‍♂️🗡️🏰🥶", name: "Ведьмак", aliases: ["Ведьмак", "The Witcher"], year: 2019, type: "serial", genre: "фэнтези", hints: ["Геральт из Ривии", "Цири", "Фэнтези-мир"] },
  { emoji: "🕵️‍♂️🎻🏢🔍", name: "Шерлок", aliases: ["Шерлок", "Sherlock"], year: 2010, type: "serial", genre: "детектив", hints: ["Бенедикт Камбербэтч", "Бейкер-стрит 221Б", "Ватсон"] },
  { emoji: "⚛️🍕🏢🎮", name: "Теория большого взрыва", aliases: ["Теория большого взрыва", "The Big Bang Theory"], year: 2007, type: "serial", genre: "комедия", hints: ["Шелдон Купер", "Бугагашенька", "Физики-гики"] },
  { emoji: "🌴✈️💥🏝️", name: "Остаться в живых", aliases: ["Остаться в живых", "Lost", "Лост"], year: 2004, type: "serial", genre: "фэнтези", hints: ["Авиакатастрофа", "Остров", "Числа 4 8 15 16 23 42"] },
  { emoji: "🍩👨‍👩‍👧‍👦🏠🍺", name: "Симпсоны", aliases: ["Симпсоны", "The Simpsons"], year: 1989, type: "serial", genre: "мультфильм", hints: ["Спрингфилд", "Гомер", "Жёлтая семья"] },
  { emoji: "🧪🌌🥒🌀", name: "Рик и Морти", aliases: ["Рик и Морти", "Rick and Morty"], year: 2013, type: "serial", genre: "мультфильм", hints: ["Огурчик Рик", "Портальная пушка", "Безумный учёный"] },
  { emoji: "🎩🐎🥃🔪", name: "Острые козырьки", aliases: ["Острые козырьки", "Peaky Blinders"], year: 2013, type: "serial", genre: "драма", hints: ["Томас Шелби", "Бирмингем", "Лезвия в кепках"] },
  { emoji: "📱👁️💀⚙️", name: "Черное зеркало", aliases: ["Черное зеркало", "Black Mirror"], year: 2011, type: "serial", genre: "фантастика", hints: ["Технологии будущего", "Антиутопия", "Экран смартфона"] },
  { emoji: "🧅💚🏰🐴", name: "Шрек", aliases: ["Шрек", "Shrek"], year: 2001, type: "film", genre: "мультфильм", hints: ["Огр", "Болото", "Осёл"] },
  { emoji: "⚡🧙‍♂️🦉🏰", name: "Гарри Поттер", aliases: ["Гарри Поттер", "Harry Potter"], year: 2001, type: "film", genre: "фэнтези", hints: ["Хогвартс", "Мальчик, который выжил", "Волан-де-Морт"] },
  { emoji: "⚔️🛸🪐🤖", name: "Звездные войны", aliases: ["Звездные войны", "Star Wars"], year: 1977, type: "film", genre: "фантастика", hints: ["Световой меч", "Дарт Вейдер", "Да пребудет с тобой Сила"] },
  { emoji: "🦸‍♂️🦸‍♀️💎🌍", name: "Мстители", aliases: ["Мстители", "Avengers"], year: 2012, type: "film", genre: "боевик", hints: ["Marvel", "Камни бесконечности", "Танос"] },
  { emoji: "🥛🔫🪴👧", name: "Леон", aliases: ["Леон", "Leon"], year: 1994, type: "film", genre: "криминал", hints: ["Натали Портман", "Киллер", "Цветок в горшке"] },
  { emoji: "🐭⚡🔦🌿", name: "Зеленая миля", aliases: ["Зеленая миля", "Green Mile"], year: 1999, type: "film", genre: "драма", hints: ["Джон Коффи", "Тюрьма", "Мышонок под кроватью"] },
  { emoji: "🏠🎄🧱🕸️", name: "Один дома", aliases: ["Один дома", "Home Alone"], year: 1990, type: "film", genre: "комедия", hints: ["Кевин Маккаллистер", "Ловушки", "Рождество"] },
  { emoji: "🦈🏊‍♂️🚢🌊", name: "Челюсти", aliases: ["Челюсти", "Jaws"], year: 1975, type: "film", genre: "триллер", hints: ["Акула-людоед", "Стивен Спилберг", "Океан"] },
  { emoji: "🐴🌹🍷🎩", name: "Крестный отец", aliases: ["Крестный отец", "The Godfather"], year: 1972, type: "film", genre: "криминал", hints: ["Вито Корлеоне", "Мафия", "Предложение, от которого нельзя отказаться"] },
];
