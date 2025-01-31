const themeSwitcher = document.getElementById('light');
const body = document.body;
const characters = document.getElementById('characters');
const locationElem = document.getElementById('location');
const combatElem = document.getElementById('combat');
const reset = document.getElementById('reset');
const light = document.getElementById('light')

let isMoon = true;
let defeatedEnemies = 0;

themeSwitcher.addEventListener('click', () => {
    const themeColors = {
        moon: {
            background: 'rgba(245, 245, 220, 0.7)',
            color: '#000000',
            characterBg: 'rgb(237, 237, 213)',
            resetColor: '#ae03e29d',
            resetBorder: '0.5px solid #ae03e26d',
            resetShadow: '0 0 5px #6003e273'
        },
        sun: {
            background: '#000000',
            color: 'beige',
            characterBg: '#0f0f0f',
            resetColor: '#ffffff',
            resetBorder: '0.5px solid #ffffff48',
            resetShadow: '0 0 5px #ffffff73'
        }
    };

    const currentTheme = isMoon ? themeColors.moon : themeColors.sun;

    light.src = isMoon ? 'img/sun.png' : 'img/moon.png';
    body.style.backgroundColor = currentTheme.background;
    characters.style.backgroundColor = currentTheme.characterBg;
    body.style.color = currentTheme.color;
    locationElem.style.backgroundColor = currentTheme.characterBg;
    combatElem.style.backgroundColor = currentTheme.characterBg;
    reset.style.color = currentTheme.resetColor;
    reset.style.border = currentTheme.resetBorder;
    reset.style.boxShadow = currentTheme.resetShadow;

    isMoon = !isMoon;
});


function updateText(elemId, text) {
    const elem = document.getElementById(elemId);
    if (elem) {
        elem.textContent = text;
    }
}

function updateLocationDisplay() {
    document.getElementById('current-location').textContent = currentLocation;
}

const items = {
    "Зелье здоровья": {
        quantity: 2,
        effect: (character) => {
            const healthRestored = 30;
            character.health = Math.min(100, character.health + healthRestored);
            logEvent(`${character.name} восстанавливает ${healthRestored} здоровья. Текущее здоровье: ${character.health}.`);
        }
    }
};

const character = {
    name: "Человек",
    health: 100,
    power: 10,
    initialProtection: 5, 
    protection: 5,
    level: 1,
    inventory: items,
    defenseTurns: 0,
    totalDefenseUses: 0,

    updateDisplay: function () {
        updateText('health', this.health);
        updateText('power', this.power);
        updateText('protection', this.protection);
        updateText('level', this.level);
        updateText('inventory', this.getInventoryDisplay());
    },

    getInventoryDisplay: function () {
        return Object.keys(this.inventory)
            .map(item => `${item} x${this.inventory[item].quantity}`)
            .join(", ");
    },

    takeDamage: function (damage) {
        const effectiveDamage = Math.max(0, damage - this.protection);
        this.health = Math.max(0, this.health - effectiveDamage);
        logEvent(`${this.name} получает ${effectiveDamage} урона. Оставшееся здоровье: ${this.health}.`);
        this.updateDisplay();

        if (this.health <= 0) {
            this.handleDeath();
        }
    },

    defend: function () {
        if (this.totalDefenseUses < 2) {
            logEvent(`${this.name} готовится к защите.`);
            this.totalDefenseUses++;
            this.defenseTurns = 2;
            this.protection += 5; 
            logEvent(`${this.name} увеличивает защиту до ${this.protection} на время.`);
            this.updateDisplay();
        } else {
            logEvent(`${this.name} больше не может использовать защиту в этой игре.`);
        }
    },

    handleDeath: function () {
        const combatLog = document.getElementById('combat-log');
        combatLog.innerHTML += "<p>Вы погибли. О Вас никто и не вспомнит. Начнёте заново?</p>";
        hideBattleOptions();
    },

    useItem: function (item) {
        if (this.inventory[item] && this.inventory[item].quantity > 0) {
            logEvent(`${this.name} использует ${item}.`);
            this.inventory[item].effect(this);
            this.inventory[item].quantity--;

            if (this.inventory[item].quantity <= 0) {
                logEvent(`${item} больше нет в инвентаре.`);
                delete this.inventory[item];
            }
            this.updateDisplay();
        } else {
            logEvent(`Инвентарь пуст`);
        }
    },

    attack: function (target) {
        const damage = Math.max(0, this.power - target.protection);
        logEvent(`${this.name} атакует ${target.name} и наносит ${damage} урона.`);
        target.takeDamage(damage);
    },

    turnEnd: function () {
        if (this.defenseTurns > 0) {
            this.defenseTurns--;
            if (this.defenseTurns === 0) {
                this.protection = this.initialProtection; 
                logEvent(`Защита становится: ${this.protection}.`);
                this.updateDisplay();
            }
        } else if (this.totalDefenseUses >= 2 && this.protection > this.initialProtection) {
            this.protection = this.initialProtection; 
            logEvent(`Защита становится: ${this.protection}.`);
            this.updateDisplay();
        }
    },
};

const troll = {
    name: "Тролль",
    health: 80,
    power: 30,
    protection: 8,

    takeDamage: function (damage) {
        this.health = Math.max(0, this.health - damage);
        logEvent(`${this.name} получает ${damage} урона. Осталось здоровья: ${this.health}.`);

        if (this.health <= 0) {
            defeatedEnemies++;
            logEvent(`${this.name} был побежден! Что делаем дальше?`);
            hideBattleOptions();
            showLocationButtons();
            isInBattle = false;
        }
    },

    attack: function (target) {
        const damage = Math.max(0, this.power - target.protection);
        logEvent(`${this.name} атакует ${target.name} и наносит ${damage} урона.`);
        target.takeDamage(damage);
    }
};

const orc = {
    name: "Орк",
    health: 50,
    power: 15,
    protection: 5,

    takeDamage: function (damage) {
        this.health = Math.max(0, this.health - damage);
        logEvent(`${this.name} получает ${damage} урона. Осталось здоровья: ${this.health}.`);

        if (this.health <= 0) {
            defeatedEnemies++;
            logEvent(`${this.name} был побежден!`);
            character.level += 1;
            character.power += 20;
            logEvent(`${character.name} повышает уровень до ${character.level} и получает +20 к силе! Текущая сила: ${character.power}. Что дальше?`);
            character.updateDisplay();
            hideBattleOptions();
            showLocationButtons();
            isInBattle = false;
        }
    },

    attack: function (target) {
        const damage = Math.max(0, this.power - target.protection);
        logEvent(`${this.name} атакует ${target.name} и наносит ${damage} урона.`);
        target.takeDamage(damage);
    }
};

const locations = {
    village: 'Деревня',
    forest: 'Лес',
    dungeon: 'Подземелье'
};

function logEvent(message) {
    const combatLog = document.getElementById('combat-log');
    combatLog.innerHTML += `<p>${message}</p>`;
}

let currentLocation = locations.village;
let isInBattle = false;
const visitedLocations = {
    forest: false,
    dungeon: false
};

function updateStyleDisplay(elemId, style) {
    document.getElementById(elemId).style.display = style;
}

function hideBattleOptions() {
    ['attack', 'defend', 'use'].forEach(id => updateStyleDisplay(id, 'none'));
}

function showLocationButtons() {
    const buttonsToShow = [
        { id: 'go-village', condition: currentLocation === locations.village },
        { id: 'return-village', condition: currentLocation === locations.forest || currentLocation === locations.dungeon },
        { id: 'go-forest', condition: !visitedLocations.forest },
        { id: 'go-dungeon', condition: !visitedLocations.dungeon }
    ];

    buttonsToShow.forEach(button => updateStyleDisplay(button.id, button.condition ? 'block' : 'none'));
}

function hideLocationButtons() {
    ['go-forest', 'go-dungeon', 'return-village', 'go-village'].forEach(id => updateStyleDisplay(id, 'none'));
}

function prepareForBattle(enemy) {
    ['attack', 'defend', 'use'].forEach(id => updateStyleDisplay(id, 'block'));

    document.getElementById('attack').onclick = () => handleCombat(enemy, character.attack);
    document.getElementById('defend').onclick = () => handleCombat(enemy, character.defend);
    document.getElementById('use').onclick = () => {
        character.useItem("Зелье здоровья");
        character.turnEnd();
        if (enemy.health > 0) {
            enemy.attack(character);
        }
    };
}

function handleCombat(enemy, action) {
    action.call(character, enemy);
    character.turnEnd();
    if (enemy.health > 0) {
        enemy.attack(character);
    }
}

updateStyleDisplay('reset', 'block');
document.getElementById('reset').onclick = function () {
    const contentDiv = document.getElementById('content');
    const reloadMessage = document.getElementById('reloadMessage');
    contentDiv.style.display = 'none';
    reloadMessage.style.display = 'block';
    setTimeout(() => {
        location.reload();
    }, 200);
}

function initializeGame() {
    character.updateDisplay();
    hideBattleOptions();
    showLocationButtons();
    updateLocationDisplay();
}

document.getElementById('go-forest').addEventListener('click', () => {
    if (!isInBattle) {
        currentLocation = locations.forest;
        logEvent('Вы идете в лес. Встречаете Тролля. Он нападает! Что будем делать?');
        updateLocationDisplay();
        prepareForBattle(troll);
        isInBattle = true;
        visitedLocations.forest = true;
        hideLocationButtons();
    } else {
        logEvent('Вы не можете уйти в другую локацию, пока идет бой!');
    }
});

document.getElementById('go-dungeon').addEventListener('click', () => {
    if (!isInBattle) {
        currentLocation = locations.dungeon;
        logEvent('Вы идете в подземелье. Встречаете Орка! Он явно агрессивно настроен');
        updateLocationDisplay();
        prepareForBattle(orc);
        isInBattle = true;
        visitedLocations.dungeon = true;
        hideLocationButtons();
    } else {
        logEvent('Вы не можете уйти в другую локацию, пока идет бой!');
    }
});


document.getElementById('return-village').addEventListener('click', () => {
    if (!isInBattle) {
        currentLocation = locations.village;
        logEvent('Вы выбрали "вернуться в деревню".');

        if (defeatedEnemies === 2) {
            logEvent(`${character.name} вернулся в деревню как герой, победив тролля и орка! Местные жители чевствуют Вас на славу!`);
        } else {
            logEvent(`${character.name} вернулся в деревню,попал в местный паб ии.. спился. Что-то Вы явно упустили. Начнёте заново?`);
        }

        updateLocationDisplay();
        showLocationButtons();
        hideLocationButtons();
    } else {
        logEvent('Вы не можете уйти в другую локацию, пока идет бой!');
    }
});


document.getElementById('go-village').addEventListener('click', () => {
    if (!isInBattle) {
        logEvent('Вы остаетесь в деревне и встречаете пьяную толпу, теряя 50 здоровья!');
        character.takeDamage(50);
        logEvent('Оставаться нельзя. Куда дальше?');
        hideLocationButtons();
        document.getElementById('go-forest').style.display = 'block';
        document.getElementById('go-dungeon').style.display = 'block';
    } else {
        logEvent('Вы не можете остаться в деревне, пока идет бой!');
    }
});

initializeGame();