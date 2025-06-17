//<!--
// *************************************************************************
// Cálcula automáticamente la posición del sol y otros datos astronómicos de interés
// El código fuente es accesible y gratuito. Copyleft 2003
// Ver 1.0 Anselmo Pérez Serrada
// Ver 5.2 2007-05-31 Luis Vadillo
// *****************************************************************************
var rad2deg = 180 / Math.PI, deg2rad = Math.PI / 180, Tseg = 1e3, Tmin = 6e4, Thor = 36e5, Tdia = 864e5, Tanom = 365.2596354, Ttrop = 365.2421895, Vareolar = 360 / Tanom, Vmed = 360 / Ttrop;
// Global variables **********************************************************************
var Latitud;        // = 40.41 default (Meridiano de Madrid) in the xhtml form, previously used by several functions
var Longitud;        // = -3.688 default (Meridiano de Madrid) in the xhtml form, previously used by several functions
var miReloj = null;  // stopwatch

// Trigonometrical functions in degrees
function sind(t) { return Math.sin(Math.PI / 180 * t) } function cosd(t) { return Math.cos(Math.PI / 180 * t) } function tand(t) { return Math.tan(Math.PI / 180 * t) } function asind(t) { return 180 / Math.PI * Math.asin(t) } function acosd(t) { return 180 / Math.PI * Math.acos(t) } function atand(t) { return 180 / Math.PI * Math.atan(t) } function atan2d(t, n) { return 180 / Math.PI * Math.atan2(t, n) }
// Normalizes an angle expressing it as a real value between 0 deg and 360 deg 
function normaliza(ang) {
    var numrevs = ang / 360;
    return (360 * (numrevs - Math.floor(numrevs)));
}

// Normalizes an angle expressing it as a real value between -180 deg and 180 deg 
function normaliza180(ang) {
    var numrevs = ang / 360;
    return (360 * (numrevs - Math.round(numrevs)));
}

// Extends the Math.round() method so that it deals with ndec decimal figures
function redondea(num, ndec) {
    var mult = 1;
    for (cnt = 1; cnt <= ndec; cnt++) mult *= 10;
    return Math.round(num * mult) / mult;
}

// Transforms an angle expressed in degrees into the HH:MM:SS format, corresponding 
// 12:00:00 to 180 deg and 24:00:00 to 360 deg
function DegToHMS(ang) {
    ang = normaliza(ang);
    var horas = (Math.floor(ang / 15)).toString();
    var mins = (Math.floor(4 * (ang % 15))).toString();
    var segs = (Math.round((ang * 240) % 60)).toString();

    if (horas.length == 1) horas = "0" + horas;
    if (mins.length == 1) mins = "0" + mins;
    if (segs.length == 1) segs = "0" + segs;

    return `${horas}:${mins}:${segs}`
}

// Transforms a Date() object into an hour string like this HH:MM:SS
function HourToString(objDate) {
    var horas = objDate.getHours().toString();
    var mins = objDate.getMinutes().toString();
    var segs = objDate.getSeconds().toString();

    if (horas.length == 1) horas = "0" + horas;
    if (mins.length == 1) mins = "0" + mins;
    if (segs.length == 1) segs = "0" + segs;

    return (" " + horas + ":" + mins + ":" + segs + " ");
}

// Transforms a Date() object into a date string like this YYYY/MM/DD
function DayToString(objDate) {
    var anyo = objDate.getFullYear().toString();
    var mes = (objDate.getMonth() + 1).toString();
    var dia = objDate.getDate().toString();

    if (mes.length == 1) mes = "0" + mes;
    if (dia.length == 1) dia = "0" + dia;

    return (" " + anyo + "-" + mes + "-" + dia + " ")
}

// //\\ Main function *********************************************************************
// Loops every 0.5 seconds. Takes the local system's time, date and timezone and then
// calculates first the Earth's orbital values and then the different hours types

function solar_time(lat, lon, time) {
    var Latitud = lat
    var Longitud = lon;
    var ahora = time;

    var HCanti;

    var huso = ahora.getTimezoneOffset(); // in minutes of time 
    var ahoraUT = new Date(ahora - Tdia + huso * Tmin);
    var FechaRef = new Date(2000, 0, 1, 12 - huso / 60, 0);  // 1st Jan 2000 at 12:00 UT
    var DifFechas = (ahoraUT - FechaRef) / Tdia + 1.0;
    //  var DifSiglos =  DifFechas / 36525;
    var FechaJD = ahora.valueOf() / Tdia + 2440587.5;

    var Hahora = ahora.getHours() * 15
        + ahora.getMinutes() / 4
        + ahora.getSeconds() / 240;
    var Hhuso = huso / 4;  // in degrees

    var StrFecha = DayToString(ahora);

    // Main algorithm ***********************************************************************
    // This is the basic algorithm that computes the Earth's position on the
    // ecliptic according to D. Savoie's "La Gnomonique" pag 53.

    var Lref = 280.46645683;              // - 1.71946*DifSiglos
    var Aref = 357.5291088;               // + ???*DifSiglos 

    var LMed = Lref + Vmed * DifFechas;
    //LMed = normaliza(LMed);            // see below  
    var AnomaliaMedia = Aref + Vareolar * DifFechas;

    var Eps = 23.43928111;                // - 0.0013*DifSiglos
    var sinEps = 0.3977769958;
    var secEps = 1.089939483;
    var excen = 0.0167086342;             // - 42.04e-6*DifSiglos
    var k1 = rad2deg * 2 * excen;
    var k2 = rad2deg * 5 / 4 * excen * excen;

    var EqCent = k1 * sind(AnomaliaMedia) + k2 * sind(2 * AnomaliaMedia);

    LonEcl = normaliza(LMed + EqCent);

    //  Now we may calculate the Equatorial Coordinates of the Sun and its Equation of Time
    var Decl = asind(sind(LonEcl) * sinEps);
    var AscRec = atan2d(sind(LonEcl), cosd(LonEcl) * secEps);
    AscRec = normaliza(AscRec);
    var HEoT = normaliza180(AscRec - LMed);          // measured in degrees
    var EoT = 4 * HEoT * 60;   // measured in seconds of time  

    var HCorreccionTotal = Hhuso - HEoT - Longitud;
    var HCivil = Hahora + HCorreccionTotal;
    var HAngHorSol = HCivil - 180;

    // And then, having the local hour angle of the sun we may calculate the rest of the things needed

    var Elev = asind(sind(Decl) * sind(Latitud) + cosd(Decl) * cosd(Latitud) * cosd(HAngHorSol));
    var Acim = atan2d(sind(HAngHorSol), sind(Latitud) * cosd(HAngHorSol) - cosd(Latitud) * tand(Decl)) - (Latitud < 0 ? 180 : 0);

    var AngSidereo = HAngHorSol + AscRec;
    var LonGeog = normaliza180(HAngHorSol + 1.0 * Longitud);
    var AzOcc = acosd(-sind(Decl) / cosd(Latitud));
    var MaxElev = Math.abs(90 - 1.0 * Latitud + Decl);

    var ArcoSemiDiurno = acosd(-tand(Latitud) * tand(Decl));
    var ArcoSemiNocturno = 180 - ArcoSemiDiurno;

    var Hita = HAngHorSol - ArcoSemiDiurno;
    var Hbab = HAngHorSol + ArcoSemiDiurno;
    var Hmed = Hahora - HAngHorSol;     //ALT : 180º - HCorreccionTotal
    var Hort = Hahora - Hbab;           //ALT: Hmed - ASD
    var Hocc = Hahora - Hita;           //ALT: Hmed + ASD

    var Htem = 90 * (Elev > 0 ? normaliza(Hbab) / ArcoSemiDiurno : normaliza(Hita) / ArcoSemiNocturno);
    var AcimC = atan2d(sind(HAngHorSol), cosd(Latitud) * cosd(HAngHorSol) + sind(Latitud) * tand(Decl));
    var minims = new Array(-180, -135, -90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90, 135);
    var HorasC = new Array(
        "MATINAE", "LAUDES", "PRIMA", "SECUNDA",
        "TERTIA", "QUARTA", "QUINTA", "SEXTA",
        "SEPTIMA", "OCTAVA", "NONA", "DECIMA",
        "UNDECIMA", "DUODECIM", "VESPERAE", "COMPLETAE"
    );

    for (i = 0; i < 15 && AcimC > minims[i]; i++)
        HCanti = HorasC[i];

    return {
        'reloj': DegToHMS(Hahora),
        'relojUTC': DegToHMS(Hahora + Hhuso),
        'relojHML': DegToHMS(Hahora + Hhuso - 1.0 * Longitud),
        'relojS': DegToHMS(HCivil),
        'reloj_solar': DegToHMS(HCivil),
        'HS': DegToHMS(AngSidereo),
        'Ita': DegToHMS(Hita),
        'Bab': DegToHMS(Hbab),
        'Tem': DegToHMS(Htem),
        'Canti': HCanti,
        'Declinacion': redondea(Decl, 2),
        'LonGeog': -redondea(LonGeog, 2),
        'Longitude': redondea(LonEcl, 2),
        'AscRec': DegToHMS(AscRec),
        'EcuaTiem': redondea(EoT, 0),
        'Elev': redondea(Elev, 2),
        'Acimut': redondea(Acim, 2),
        'AcimutOcaso': redondea(AzOcc, 2),
        'MaxElev': redondea(MaxElev, 2),
        'Duracion': DegToHMS(2 * ArcoSemiDiurno),
        'Mediodia': DegToHMS(Hmed),
        'Orto': DegToHMS(Hort),
        'Ocaso': DegToHMS(Hocc),
        'diajuliano': redondea(FechaJD, 4),
        'fecha': StrFecha,
    }

}
