'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var MINUTES_IN_HOUR = 60;
var MINUTES_IN_DAY = MINUTES_IN_HOUR * 24;
var WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */


exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var bankSchedule = getScheduleInMinutesForBank(workingHours);
    var commonSchedule = getCommonSchedule(schedule, bankSchedule[0].timeZone);
    var freeTimeIntervals = findFreeTime(commonSchedule);
    var robberyIntervals = intersect(freeTimeIntervals, bankSchedule);
    var moment = getRobberyMomentTime(robberyIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return moment !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            var formattedTime = getDateFromMinutes(moment.from);
            if (formattedTime.hours < 10) {
                formattedTime.hours = '0' + formattedTime.hours;
            }
            if (formattedTime.minutes < 10) {
                formattedTime.minutes = '0' + formattedTime.minutes;
            }


            return template.replace('%HH', formattedTime.hours)
                .replace('%MM', formattedTime.minutes)
                .replace('%DD', formattedTime.day);
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

function getScheduleInMinutes(schedule, timeZone) {
    var newSchedule = [];
    for (var i = 0; i < schedule.length; i++) {
        newSchedule.push({
            from: getMinutes(schedule[i].from, timeZone),
            to: getMinutes(schedule[i].to, timeZone)
        });
    }

    return newSchedule;
}

function getMinutes(str, timeZone) {
    var separators = /[ :+]/;
    var data = str.split(separators);
    var timeInMinutes = Number(data[1]) * 60 + Number(data[2]) +
        (Number(timeZone) - Number(data[3])) * 60;

    return MINUTES_IN_DAY * WEEKDAYS.indexOf(data[0]) + timeInMinutes;
}

function getScheduleInMinutesForBank(workingHours) {
    var from = workingHours.from.split(/[:+]/);
    var to = workingHours.to.split(/[:+]/);

    var schedule = [];
    var minutesFrom = Number(from[0]) * 60 + Number(from[1]);
    var minutesTo = Number(to[0]) * 60 + Number(to[1]);
    schedule.push({
        from: minutesFrom,
        to: minutesTo,
        timeZone: from[2]
    });
    schedule.push({
        from: minutesFrom + MINUTES_IN_DAY,
        to: minutesTo + MINUTES_IN_DAY,
        timeZone: from[2]
    });
    schedule.push({
        from: minutesFrom + MINUTES_IN_DAY * 2,
        to: minutesTo + MINUTES_IN_DAY * 2,
        timeZone: from[2]
    });

    return schedule;
}

function findFreeTime(schedule) {
    var freeTimeIntervals = [];

    freeTimeIntervals.push({
        from: 0,
        to: schedule[0].from
    });
    freeTimeIntervals.push({
        from: schedule[0].to,
        to: MINUTES_IN_DAY * 3
    });

    for (var i = 1; i < schedule.length; i++) {
        var last = freeTimeIntervals.length - 1;
        var elem = freeTimeIntervals[last];

        if (schedule[i].to <= elem.from) {
            continue;
        }

        // Интервалы пересекаются
        if ((schedule[i].from <= elem.from) && (elem.from < schedule[i].to)) {
            freeTimeIntervals[last] = {
                from: schedule[i].to,
                to: MINUTES_IN_DAY * 3
            };
            continue;
        }

        // Один внутри другого
        if (schedule[i].from >= elem.from) {
            freeTimeIntervals[last] = {
                from: elem.from,
                to: schedule[i].from
            };
            freeTimeIntervals.push({
                from: schedule[i].to,
                to: MINUTES_IN_DAY * 3
            });
        }
    }

    return freeTimeIntervals;
}

function getCommonSchedule(gangSchedule, timeZone) {
    var commonSchedule = [];

    Object.keys(gangSchedule).forEach(function (name) {
        var scheduleInMinutes = getScheduleInMinutes(gangSchedule[name], timeZone);

        commonSchedule = commonSchedule.concat(scheduleInMinutes)
            .sort(compare);
    });

    return commonSchedule;
}

function isIntersected(bankTime, freeTime) {
    var result = [];

    // пересекает справа
    if (((bankTime.from <= freeTime.to) && (freeTime.from <= bankTime.from)) &&
        (freeTime.to <= bankTime.to)) {
        result = {
            from: bankTime.from,
            to: freeTime.to
        };
    }

    // один внутри другого
    if ((bankTime.from <= freeTime.from) && (freeTime.to <= bankTime.to)) {
        result = {
            from: bankTime.from,
            to: bankTime.to
        };
    }

    // пересекает слева
    if ((bankTime.from <= freeTime.from) &&
        ((freeTime.to >= bankTime.to) && (freeTime.from <= bankTime.to))) {
        result = {
            from: freeTime.from,
            to: bankTime.to
        };
    }

    // содержит в себе
    if ((bankTime.from <= freeTime.from) && (freeTime.to <= bankTime.to)) {
        result = {
            from: freeTime.from,
            to: freeTime.to
        };
    }

    return result;
}

function intersect(freeTime, bankTime) {
    var result = [];

    for (var i = 0; i < bankTime.length; i++) {
        for (var k = 0; k < freeTime.length; k++) {
            result.push(isIntersected(bankTime[i], freeTime[k]));
        }
    }

    return result;
}

function isEnoughForRobbery(interval, duration) {
    return interval.to - interval.from >= duration;
}

function getRobberyMomentTime(availableIntervals, duration) {
    for (var i = 0; i < availableIntervals.length; i++) {

        if (isEnoughForRobbery(availableIntervals[i], duration)) {
            return availableIntervals[i];
        }
    }

    return null;
}

function compare(first, second) {
    if (first.from - second.from < 0) {
        return -1;
    }

    if (first.from - second.from > 0) {
        return 1;
    }

    return 0;
}

function getDateFromMinutes(minutes) {
    var dayNumber = Math.floor(minutes / MINUTES_IN_DAY);
    var day = WEEKDAYS[dayNumber];
    minutes = minutes - dayNumber * MINUTES_IN_DAY;

    var hours = Math.floor(minutes / MINUTES_IN_HOUR);
    minutes = minutes - hours * MINUTES_IN_HOUR;

    return {
        day: day,
        hours: hours,
        minutes: minutes
    };
}
