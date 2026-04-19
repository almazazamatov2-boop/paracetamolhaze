/**
 * ПОКЕРНЫЙ ДВИЖОК (Texas Hold'em)
 * Реализует правила раздачи, ставок, очередности и определения победителя.
 */

export type Suit = 'H' | 'D' | 'C' | 'S';
export type Value = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    value: Value;
}

export interface PokerPlayer {
    id: string;
    name: string;
    chips: number;
    bet: number;         // Ставка в текущем раунде
    totalBet: number;    // Общая ставка за всю раздачу (для side-потов)
    cards: Card[];
    folded: boolean;
    allIn: boolean;
    isDealer: boolean;
    isSmallBlind: boolean;
    isBigBlind: boolean;
}

export interface SidePot {
    amount: number;
    eligiblePlayerIds: string[];
}

export interface PokerGameState {
    players: PokerPlayer[];
    pot: number;
    sidePots: SidePot[];
    currentBet: number;
    dealerIndex: number;
    activePlayerIndex: number;
    phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
    communityCards: Card[];
    lastRaiserId: string | null;
    deck: Card[];
}

// Ранги карт для оценки
const VALUE_RANKS: Record<Value, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const HAND_RANKS = {
    HIGH_CARD: 0,
    PAIR: 1,
    TWO_PAIR: 2,
    THREE_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_KIND: 7,
    STRAIGHT_FLUSH: 8,
    ROYAL_FLUSH: 9
};

export const PokerLogic = {
    /**
     * Создание и тасовка колоды (Fisher-Yates)
     */
    createDeck(): Card[] {
        const suits: Suit[] = ['H', 'D', 'C', 'S'];
        const values: Value[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        const deck: Card[] = [];
        
        for (const s of suits) {
            for (const v of values) {
                deck.push({ suit: s, value: v });
            }
        }

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        return deck;
    },

    /**
     * Подготовка новой раздачи
     */
    prepareNewHand(players: any[], dealerIndex: number, blindValue: number, buyIn: number): PokerGameState {
        const deck = this.createDeck();
        const activePlayersCount = players.length;
        
        // Позиции
        const dIdx = dealerIndex % activePlayersCount;
        const sbIdx = (dIdx + 1) % activePlayersCount;
        const bbIdx = (dIdx + 2) % activePlayersCount;

        const sbAmount = blindValue;
        const bbAmount = blindValue * 2;

        const pokerPlayers: PokerPlayer[] = players.map((p, i) => {
            let chips = p.chips ?? buyIn;
            let bet = 0;
            let isAllIn = false;

            if (i === sbIdx) {
                const actual = Math.min(chips, sbAmount);
                chips -= actual;
                bet = actual;
                if (chips === 0) isAllIn = true;
            } else if (i === bbIdx) {
                const actual = Math.min(chips, bbAmount);
                chips -= actual;
                bet = actual;
                if (chips === 0) isAllIn = true;
            }

            return {
                id: String(p.id),
                name: p.display_name || p.name,
                chips,
                bet,
                totalBet: bet,
                cards: [deck.pop()!, deck.pop()!],
                folded: false,
                allIn: isAllIn,
                isDealer: i === dIdx,
                isSmallBlind: i === sbIdx,
                isBigBlind: i === bbIdx
            };
        });

        return {
            players: pokerPlayers,
            pot: pokerPlayers.reduce((sum, p) => sum + p.bet, 0),
            sidePots: [],
            currentBet: bbAmount,
            dealerIndex: dIdx,
            activePlayerIndex: (bbIdx + 1) % activePlayersCount,
            phase: 'preflop',
            communityCards: [],
            lastRaiserId: pokerPlayers[bbIdx].id,
            deck
        };
    },

    /**
     * Обработка действия игрока
     */
    handleAction(state: PokerGameState, playerId: string, action: 'fold' | 'call' | 'raise' | 'check', amount?: number): PokerGameState {
        const newState = JSON.parse(JSON.stringify(state)) as PokerGameState;
        const pIdx = newState.players.findIndex(p => p.id === playerId);
        if (pIdx === -1 || newState.phase === 'showdown') return state;

        const player = newState.players[pIdx];

        if (action === 'fold') {
            player.folded = true;
        } else if (action === 'check') {
            if (player.bet < newState.currentBet) {
                // Если чекнуть нельзя (есть ставка), делаем колл вместо этого или игнорим
                return this.handleAction(state, playerId, 'call');
            }
        } else if (action === 'call') {
            const needed = newState.currentBet - player.bet;
            const actual = Math.min(player.chips, needed);
            player.chips -= actual;
            player.bet += actual;
            player.totalBet += actual;
            newState.pot += actual;
            if (player.chips === 0) player.allIn = true;
        } else if (action === 'raise') {
            const raiseTo = amount || (newState.currentBet * 2);
            const needed = raiseTo - player.bet;
            const actual = Math.min(player.chips, needed);
            
            // Если игрок идет олл-ин меньшей суммой чем рейз — это просто олл-ин
            player.chips -= actual;
            player.bet += actual;
            player.totalBet += actual;
            newState.pot += actual;
            
            if (player.bet > newState.currentBet) {
                newState.currentBet = player.bet;
                newState.lastRaiserId = player.id;
            }

            if (player.chips === 0) player.allIn = true;
        }

        // Проверка: остался ли только один игрок
        const activeNotFolded = newState.players.filter(p => !p.folded);
        if (activeNotFolded.length === 1) {
            return this.resolveOneWinner(newState, activeNotFolded[0]);
        }

        // Очередь следующего
        let nextIdx = (pIdx + 1) % newState.players.length;
        let loops = 0;
        while ((newState.players[nextIdx].folded || newState.players[nextIdx].allIn) && loops < newState.players.length) {
            nextIdx = (nextIdx + 1) % newState.players.length;
            loops++;
        }

        // Проверка завершения круга
        // Круг завершен если:
        // 1. Все активные игроки уравняли currentBet (или олл-ин)
        // 2. Мы вернулись к последнему рейзеру
        const everyoneActed = activeNotFolded.every(p => p.folded || p.allIn || p.bet === newState.currentBet);
        const backToRaiser = newState.players[nextIdx].id === newState.lastRaiserId;

        if (everyoneActed && backToRaiser) {
            return this.nextPhase(newState);
        } else {
            newState.activePlayerIndex = nextIdx;
        }

        return newState;
    },

    nextPhase(state: PokerGameState): PokerGameState {
        if (state.phase === 'showdown') return state;

        // Сброс ставок раунда
        state.players.forEach(p => p.bet = 0);
        state.currentBet = 0;
        state.lastRaiserId = null;

        // Переход фаз
        if (state.phase === 'preflop') {
            state.phase = 'flop';
            state.communityCards.push(state.deck.pop()!, state.deck.pop()!, state.deck.pop()!);
        } else if (state.phase === 'flop') {
            state.phase = 'turn';
            state.communityCards.push(state.deck.pop()!);
        } else if (state.phase === 'turn') {
            state.phase = 'river';
            state.communityCards.push(state.deck.pop()!);
        } else if (state.phase === 'river') {
            state.phase = 'showdown';
            return this.resolveShowdown(state);
        }

        // Очередь после флопа — первый активный слева от дилера
        let nextIdx = (state.dealerIndex + 1) % state.players.length;
        let l = 0;
        while ((state.players[nextIdx].folded || state.players[nextIdx].allIn) && l < state.players.length) {
            nextIdx = (nextIdx + 1) % state.players.length;
            l++;
        }
        state.activePlayerIndex = nextIdx;
        state.lastRaiserId = state.players[nextIdx].id; // Чтобы круг прошел полностью

        return state;
    },

    /**
     * Все сфолдили, кроме одного
     */
    resolveOneWinner(state: PokerGameState, winner: PokerPlayer): PokerGameState {
        const wIdx = state.players.findIndex(p => p.id === winner.id);
        state.players[wIdx].chips += state.pot;
        state.pot = 0;
        state.phase = 'waiting' as any; // Сигнал для UI закончить раздачу
        return state;
    },

    /**
     * Оценка силы руки (7 карт -> лучшая 5-карточная рука)
     * Возвращает числовой рейтинг для сравнения
     */
    evaluateHand(cards: Card[]): number {
        if (cards.length < 5) return 0;

        const ranks = cards.map(c => VALUE_RANKS[c.value]).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        
        // Группировка по рангу
        const counts: Record<number, number> = {};
        ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
        const freq = Object.entries(counts).map(([r, c]) => ({ r: parseInt(r), c })).sort((a,b) => b.c - a.c || b.r - a.r);

        // Проверка Флеша
        const suitCounts: Record<string, number> = {};
        suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
        const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);
        const isFlush = !!flushSuit;

        // Проверка Стрита
        const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
        if (uniqueRanks.includes(14)) uniqueRanks.push(1); // Дикий Туз для A-2-3-4-5
        
        let straightHigh = -1;
        for (let i = 0; i <= uniqueRanks.length - 5; i++) {
            if (uniqueRanks[i] - uniqueRanks[i+4] === 4) {
                straightHigh = uniqueRanks[i];
                break;
            }
        }
        const isStraight = straightHigh !== -1;

        // Комбинации
        // 1. Стрит-Флеш / Роял-Флеш
        if (isFlush && isStraight) {
            const flushCards = cards.filter(c => c.suit === flushSuit).map(c => VALUE_RANKS[c.value]);
            // Проверка стрита внутри масти
            const fUnique = Array.from(new Set(flushCards)).sort((a,b) => b-a);
             if (fUnique.includes(14)) fUnique.push(1);
             for(let i=0; i<= fUnique.length - 5; i++) {
                 if (fUnique[i] - fUnique[i+4] === 4) {
                     return (fUnique[i] === 14 ? HAND_RANKS.ROYAL_FLUSH : HAND_RANKS.STRAIGHT_FLUSH) * 1e10 + fUnique[i];
                 }
             }
        }

        // 2. Каре
        if (freq[0].c === 4) return HAND_RANKS.FOUR_KIND * 1e10 + freq[0].r * 1e2 + freq[1].r;

        // 3. Фулл-Хаус
        if (freq[0].c === 3 && freq[1].c >= 2) return HAND_RANKS.FULL_HOUSE * 1e10 + freq[0].r * 1e2 + freq[1].r;

        // 4. Флеш
        if (isFlush) {
            const flushCards = cards.filter(c => c.suit === flushSuit).map(c => VALUE_RANKS[c.value]).sort((a,b) => b-a);
            return HAND_RANKS.FLUSH * 1e10 + flushCards.slice(0, 5).reduce((acc, r, i) => acc + r * Math.pow(15, 4-i), 0);
        }

        // 5. Стрит
        if (isStraight) return HAND_RANKS.STRAIGHT * 1e10 + straightHigh;

        // 6. Сет (Тройка)
        if (freq[0].c === 3) return HAND_RANKS.THREE_KIND * 1e10 + freq[0].r * 1e4 + freq[1].r * 1e2 + freq[2].r;

        // 7. Две пары
        if (freq[0].c === 2 && freq[1].c === 2) return HAND_RANKS.TWO_PAIR * 1e10 + freq[0].r * 1e4 + freq[1].r * 1e2 + freq[2].r;

        // 8. Пара
        if (freq[0].c === 2) return HAND_RANKS.PAIR * 1e10 + freq[0].r * 1e8 + ranks.filter(r => r !== freq[0].r).slice(0, 3).reduce((acc, r, i) => acc + r * Math.pow(15, 2-i), 0);

        // 9. Старшая карта
        return HAND_RANKS.HIGH_CARD * 1e10 + ranks.slice(0, 5).reduce((acc, r, i) => acc + r * Math.pow(15, 4-i), 0);
    },

    /**
     * Определение победителей
     */
    findWinners(players: PokerPlayer[], communityCards: Card[]): { id: string, score: number, handName: string }[] {
        const scores = players.map(p => {
            if (p.folded) return { id: p.id, score: -1, handName: 'Folded' };
            const score = this.evaluateHand([...p.cards, ...communityCards]);
            return { id: p.id, score, handName: this.getHandName(score) };
        });

        const maxScore = Math.max(...scores.map(s => s.score));
        return scores.filter(s => s.score === maxScore);
    },

    getHandName(score: number): string {
        const rank = Math.floor(score / 1e10);
        const names = ["Старшая карта", "Пара", "Две пары", "Сет", "Стрит", "Флеш", "Фулл-Хаус", "Каре", "Стрит-Флеш", "Рояль-Флеш"];
        return names[rank] || "Неизвестно";
    },

    resolveShowdown(state: PokerGameState): PokerGameState {
        const winners = this.findWinners(state.players, state.communityCards);
        const winAmount = Math.floor(state.pot / winners.length);
        
        winners.forEach(w => {
            const pIdx = state.players.findIndex(p => p.id === w.id);
            if (pIdx !== -1) state.players[pIdx].chips += winAmount;
        });

        state.pot = 0;
        state.phase = 'showdown';
        return state;
    }
};
