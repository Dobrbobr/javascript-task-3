'use strict';
function example() {
    var time = 90;
    var gangSchedule = {
        Danny: [
            {from: 'ПН 12:00+5', to: 'ПН 17:00+5'},
            {from: 'ВТ 13:00+5', to: 'ВТ 16:00+5'}
        ],
        Rusty: [
            {from: 'ПН 11:30+5', to: 'ПН 16:30+5'},
            {from: 'ВТ 13:00+5', to: 'ВТ 16:00+5'}
        ],
        Linus: [
            {from: 'ПН 09:00+3', to: 'ПН 14:00+3'},
            {from: 'ПН 21:00+3', to: 'ВТ 09:30+3'},
            {from: 'СР 09:30+3', to: 'СР 15:00+3'}
        ]
    };
    var bankWorkingHours = {
        from: '10:00+5',
        to: '18:00+5'
    };
    var bankWorking = getScheduleInMinutesForBank(bankWorkingHours);
    var timestamps = [];
    for (var name in gangSchedule) {
        var transformedSchedule = getScheduleInMinutes(gangSchedule[name], bankWorking[0].timeZone);
        timestamps = timestamps.concat(transformedSchedule);
        timestamps = timestamps.sort(sortByStart);
    }
    timestamps = findFreeTime(timestamps);
    timestamps = intersect(timestamps, bankWorking);// промежутки времени, когда можно действовать
    if (timestamps.length === 0 ) console.log(false);
    else {
        var flag = isEnoughForRobbery(timestamps, time);
        console.log(flag);
    }

}
/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
var MinutesInDay = 1440;
var Week = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */


exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var bankWorkingInMinutes = getScheduleInMinutesForBank(bankWorkingHours);
    var commonSchedule = getCommonSchedule(gangSchedule, bankWorkingInMinutes[0].timeZone);
    var freeTimesIntervals = findFreeTime(commonSchedule);
    var intervalsForRobbery = intersect(freeTimesIntervals, bankWorkingInMinutes);// промежутки времени, когда можно действовать

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (intervalsForRobbery.length === 0 ) {

                return false;
            }

            return (isEnoughForRobbery(intervalsForRobbery, duration));
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
};



function getScheduleInMinutes(schedule, timeZona) {
    var newSchedule = [];
    for (var i = 0; i < schedule.length; i++) {
        newSchedule.push({from: getMinutes(schedule[i].from, timeZona), to: getMinutes(schedule[i].to, timeZona)});
    }

    return newSchedule;
}

function getMinutes(str, timeZona) {
    var minute;
    var separators = /[ :+]/;
    var data = str.split(separators);
    var inMinutes= Number(data[1]) * 60 + Number(data[2]) + Number(timeZona - data[3]) * 60;

    return minute = MinutesInDay*Week[data[0]] + inMinutes;
}

function getScheduleInMinutesForBank(workingHours) {
    var dataFrom = workingHours.from.split(/[:+]/);
    var dataTo = workingHours.to.split(/[:+]/);
    var bankInMinutes = [];
    var fromInM=Number(dataFrom[0]) * 60 + Number(dataFrom[1]);
    var toInM=Number(dataTo[0]) * 60 + Number(dataTo[1]);
    bankInMinutes.push({
        from: fromInM,
        to: toInM,
        timeZone: dataFrom[2]
    });
    bankInMinutes.push({
        from: FromInM + MinutesInDay,
        to: toInM + MinutesInDay,
        timeZone: dataFrom[2]
    });
    bankInMinutes.push({
        from: FromInM + MinutesInDay*2,
        to: toInM + MinutesInDay*2,
        timeZone: dataFrom[2]
    });

    return bankInMinutes;
}

function findFreeTime(schedule) {
    var obj = [];
    obj.push({from: 0, to: schedule[0].from});
    obj.push({from: schedule[0].to, to: MinutesInDay*3});
    for (var i = 1; i < schedule.length; i++) {
        var last = obj.length - 1;
        var elem = obj[last];
        if (schedule[i].to <= elem.from) {
            continue;
        }
        if ((schedule[i].from <= elem.from) && (elem.from < schedule[i].to)) { //пересекает
            obj[last] = {from: schedule[i].to, to: MinutesInDay*3};
            continue;
        }
        if (schedule[i].from >= elem.from) {//лежит внутри
            obj[last] = {from: elem.from, to: schedule[i].from};
            obj.push({from: schedule[i].to, to: MinutesInDay*3});
        }
    }
    return obj;
}

function getCommonSchedule(gangSchedule, timeZone) {
    var commonSchedule = [];
    for (var name in gangSchedule) {
        var scheduleInMinutes = getScheduleInMinutes(gangSchedule[name], timeZone);
        commonSchedule = commonSchedule.concat(scheduleInMinutes)
            .sort(sortByStart);
    }

}

function intersect(freeTime, bankTime) { //массив из интервалов
    var result = [];
    for (var i in bankTime) {
        for (var k in freeTime) {
            if (((bankTime[i].from <= freeTime[k].to) && (freeTime[k].from <= bankTime[i].from)) && (freeTime[k].to <= bankTime[i].to))
                result.push({from: bankTime[i].from, to: freeTime[k].to}); //пересекает справа

            if ((bankTime[i].from <= freeTime[k].to) && (freeTime[k].to >= i.to))
                result.push({from: bankTime[i].from, to: bankTime[i].to}); //внутри

            if ((bankTime[i].from <= freeTime[k].from) && ((freeTime[k].to >= bankTime[i].to) && (freeTime[k].from <= bankTime[i].to)))
                result.push({from: freeTime[k].from, to: bankTime[i].to}); //пересекает слева

            if ((bankTime[i].from <= freeTime[k].from) && (freeTime[k].to <= bankTime[i].to))
                result.push({from: freeTime[k].from, to: freeTime[k].to}); //содержит в себе
        }
    }

    return result;

}

function isEnoughForRobbery(availableIntervals, time) {
    for (var elem in availableIntervals) {
        if (time <= (availableIntervals[elem].to - availableIntervals[elem].from)) {
            return true;
        }
    }
    return false;

}

function sortByStart(first, second) {
    if (first.from - second.from < 0)
        return -1;
    if (first.from - second.from > 0)
        return 1;

    return 0;
}



