import dayjs from 'dayjs'

/** Dayjs ships no `fil`/`tl` locale — register a small Filipino pack for pickers and relative dates. */
const fil = {
  name: 'fil',
  weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
  weekdaysShort: 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
  weekdaysMin: 'Li_Lu_Ma_Mi_Hu_Bi_Sa'.split('_'),
  months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
  monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
  weekStart: 0,
  formats: {
    LT: 'h:mm A',
    LTS: 'h:mm:ss A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A',
  },
  relativeTime: {
    future: 'sa loob ng %s',
    past: '%s ang nakalipas',
    s: 'ilang segundo',
    m: 'isang minuto',
    mm: '%d minuto',
    h: 'isang oras',
    hh: '%d oras',
    d: 'isang araw',
    dd: '%d araw',
    M: 'isang buwan',
    MM: '%d buwan',
    y: 'isang taon',
    yy: '%d taon',
  },
  ordinal: (n: number) => `${n}`,
}

dayjs.locale(fil, undefined, true)

export default fil
