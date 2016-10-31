'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var MINUTES_IN_HOUR = 60;
var MINUTES_IN_DAY = MINUTES_IN_HOUR * 24;
var WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var ROBBERY_DAYS_COUNT = 3;

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

function getIntervalInMinutes(interval, timeZone) {
    return {
        from: getMinutes(interval.from, timeZone),
        to: getMinutes(interval.to, timeZone)
    };
}

function getMinutes(str, timeZone) {
    var separators = /[ :+]/;
    var data = str.split(separators);
    var timeInMinutes = parseInt(data[1], 10) * MINUTES_IN_HOUR + parseInt(data[2], 10) +
        (parseInt(timeZone, 10) - parseInt(data[3], 10)) * MINUTES_IN_HOUR;

    return MINUTES_IN_DAY * WEEKDAYS.indexOf(data[0]) + timeInMinutes;
}

function getScheduleInMinutesForBank(workingHours) {
    var from = workingHours.from.split(/[:+]/);
    var to = workingHours.to.split(/[:+]/);

    var schedule = [];
    var minutesFrom = parseInt(from[0], 10) * MINUTES_IN_HOUR + parseInt(from[1], 10);
    var minutesTo = parseInt(to[0], 10) * MINUTES_IN_HOUR + parseInt(to[1], 10);
    for (var i = 0; i < 3; i++) {
        schedule.push({
            from: minutesFrom + MINUTES_IN_DAY * i,
            to: minutesTo + MINUTES_IN_DAY * i,
            timeZone: from[2]
        });
    }

    return schedule;
}

function splitSchedule(schedule) {
    var firstInterval = {
        from: 0,
        to: schedule[0].from
    };

    var secondInterval = {
        from: schedule[0].to,
        to: MINUTES_IN_DAY * ROBBERY_DAYS_COUNT
    };

    return [firstInterval, secondInterval];
}

function findFreeTime(schedule) {
    var freeTimeIntervals = splitSchedule(schedule);

    schedule.forEach(function (interval) {
        var last = freeTimeIntervals.length - 1;
        var elem = freeTimeIntervals[last];

        if (interval.to <= elem.from) {

            return;
        }

        // Интервалы пересекаются
        if ((interval.from <= elem.from) && (elem.from < interval.to)) {
            freeTimeIntervals[last] = {
                from: interval.to,
                to: MINUTES_IN_DAY * ROBBERY_DAYS_COUNT
            };

            return;
        }

        // Один внутри другого
        if (interval.from >= elem.from) {
            freeTimeIntervals[last] = {
                from: elem.from,
                to: interval.from
            };
            freeTimeIntervals.push({
                from: interval.to,
                to: MINUTES_IN_DAY * ROBBERY_DAYS_COUNT
            });
        }
    });

    return freeTimeIntervals;
}

function getCommonSchedule(gangSchedule, timeZone) {
    var commonSchedule = [];

    Object.keys(gangSchedule).forEach(function (name) {
        commonSchedule = commonSchedule.concat(gangSchedule[name]
            .map(function (interval) {

                return getIntervalInMinutes(interval, timeZone);
            }));
    });
    commonSchedule.sort(compare);

    return commonSchedule;
}

function intersectIntervals(bankTime, freeTime) {
    var result = {};

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

    bankTime.forEach(function (bankInterval) {
        var intervals = freeTime.map(function (freeTimeInterval) {
            return intersectIntervals(bankInterval, freeTimeInterval);
        });
        result = result.concat(intervals);
    });

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
    return Math.sign(first.from - second.from);
}

function getDateFromMinutes(minutes) {
    var dayNumber = Math.floor(minutes / MINUTES_IN_DAY);
    var day = WEEKDAYS[dayNumber];
    minutes = minutes - dayNumber * MINUTES_IN_DAY;

    var hours = Math.floor(minutes / MINUTES_IN_HOUR);
    minutes = minutes - hours * MINUTES_IN_HOUR;

    return {
        day: day,
        hours: formatTime(hours),
        minutes: formatTime(minutes)
    };
}

function formatTime(time) {
    return time >= 10 ? time : '0' + time;
}
