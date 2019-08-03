// @flow
import moment from 'moment';
const offset = 100;

moment.defineLocale('pt-br', {
  months : 'Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro'.split('_'),
  monthsShort : 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split('_'),
  weekdays : 'Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado'.split('_'),
  weekdaysShort : 'Dom_Seg_Ter_Qua_Qui_Sex_Sáb'.split('_'),
  weekdaysMin : 'Dom_2ª_3ª_4ª_5ª_6ª_Sáb'.split('_'),
  longDateFormat : {
      LT : 'HH:mm',
      L : 'DD/MM/YYYY',
      LL : 'D [de] MMMM [de] YYYY',
      LLL : 'D [de] MMMM [de] YYYY [às] LT',
      LLLL : 'dddd, D [de] MMMM [de] YYYY [às] LT'
  },
  calendar : {
      sameDay: '[Hoje às] LT',
      nextDay: '[Amanhã às] LT',
      nextWeek: 'dddd [às] LT',
      lastDay: '[Ontem às] LT',
      lastWeek: function () {
          return (this.day() === 0 || this.day() === 6) ?
              '[Último] dddd [às] LT' : // Saturday + Sunday
              '[Última] dddd [às] LT'; // Monday - Friday
      },
      sameElse: 'L'
  },
  relativeTime : {
      future : 'em %s',
      past : '%s atrás',
      s : 'segundos',
      m : 'um minuto',
      mm : '%d minutos',
      h : 'uma hora',
      hh : '%d horas',
      d : 'um dia',
      dd : '%d dias',
      M : 'um mês',
      MM : '%d meses',
      y : 'um ano',
      yy : '%d anos'
  },
  ordinal : '%dº'
});

function buildEvent(column, left, width, dayStart) {
  const startTime = moment(column.start);
  const endTime = column.end
    ? moment(column.end)
    : startTime.clone().add(1, 'hour');
  const dayStartTime = startTime
    .clone()
    .hour(dayStart)
    .minute(0);
  const diffHours = startTime.diff(dayStartTime, 'hours', true);

  column.top = diffHours * offset;
  column.height = endTime.diff(startTime, 'hours', true) * offset;
  column.width = width;
  column.left = left;
  return column;
}

function collision(a, b) {
  return a.end > b.start && a.start < b.end;
}

function expand(ev, column, columns) {
  var colSpan = 1;

  for (var i = column + 1; i < columns.length; i++) {
    var col = columns[i];
    for (var j = 0; j < col.length; j++) {
      var ev1 = col[j];
      if (collision(ev, ev1)) {
        return colSpan;
      }
    }
    colSpan++;
  }

  return colSpan;
}

function pack(columns, width, calculatedEvents, dayStart) {
  var colLength = columns.length;

  for (var i = 0; i < colLength; i++) {
    var col = columns[i];
    for (var j = 0; j < col.length; j++) {
      var colSpan = expand(col[j], i, columns);
      var L = (i / colLength) * width;
      var W = (width * colSpan) / colLength - 10;

      calculatedEvents.push(buildEvent(col[j], L, W, dayStart));
    }
  }
}

function populateEvents(events, screenWidth, dayStart) {
  let lastEnd;
  let columns;
  let self = this;
  let calculatedEvents = [];

  events = events
    .map((ev, index) => ({ ...ev, index: index }))
    .sort(function(a, b) {
      if (a.start < b.start) return -1;
      if (a.start > b.start) return 1;
      if (a.end < b.end) return -1;
      if (a.end > b.end) return 1;
      return 0;
    });

  columns = [];
  lastEnd = null;

  events.forEach(function(ev, index) {
    if (lastEnd !== null && ev.start >= lastEnd) {
      pack(columns, screenWidth, calculatedEvents, dayStart);
      columns = [];
      lastEnd = null;
    }

    var placed = false;
    for (var i = 0; i < columns.length; i++) {
      var col = columns[i];
      if (!collision(col[col.length - 1], ev)) {
        col.push(ev);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([ev]);
    }

    if (lastEnd === null || ev.end > lastEnd) {
      lastEnd = ev.end;
    }
  });

  if (columns.length > 0) {
    pack(columns, screenWidth, calculatedEvents, dayStart);
  }
  return calculatedEvents;
}

export default populateEvents;
