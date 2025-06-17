function round(num, digits) {
    value = 10 ** digits
    return Math.trunc(num * value) / value
}

function leading_zero(value) {
    return `${value < 10 ? "0" : ""}${value}`
}

function format_time(value) {
    return `${leading_zero(value.getHours())}:${leading_zero(value.getMinutes())}:${leading_zero(value.getSeconds())}`
}

function format_latlon(coords) {
    const lat = coords.latitude
    const lon = coords.longitude
    const latC = lat >= 0 ? 'N' : 'S'
    const lonC = lon >= 0 ? 'E' : 'W'
    return `${latC} ${Math.abs(lat)}, ${lonC} ${Math.abs(lon)}`
}

function asDeg(value) {
    return `${value} º`
}

async function cached_locationsv2(coords) {
    const where = `${coords.latitude}, ${coords.longitude}`
    const cached = localStorage.getItem(where)
    if (!cached) {
        const options = { mode: "cors" }
        const name = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&zoom=14&format=jsonv2`, options)
            .then(response =>
                response.json()
            )
            .then(value => {
                return value.display_name
            })
            .catch(error => {
                console.log(error)
                document.getElementById("error").innerText = error.message
                document.getElementById("error").classList.add("visible")
            })
        localStorage.setItem(where, name ? name : where)
    }
    return localStorage.getItem(where)
}

function do_calculations() {
    const now = new Date()
    document.getElementById("time_local").innerText = format_time(now)

    if (window.currentPosition) {
        const coords = window.currentPosition
        const where = `${coords.latitude}, ${coords.longitude}`
        const solar_calc = solar_time(coords.latitude, coords.longitude, now)

        document.getElementById("time_solar").innerText = solar_calc.reloj_solar
        document.getElementById("where_latlon").innerText = `(${format_latlon(coords)})`
        update_details(solar_calc)
        cached_locationsv2(coords).then(name =>
            document.getElementById("where").innerText = name
        )
    }
}

function update_details(calculations) {
    document.getElementById("reloj").innerText = calculations.reloj
    document.getElementById("relojUTC").innerText = calculations.relojUTC
    document.getElementById("relojHML").innerText = calculations.relojHML
    document.getElementById("relojS").innerText = calculations.relojS
    // document.getElementById("reloj_solar").innerText = calculations.reloj_solar
    document.getElementById("HS").innerText = calculations.HS
    document.getElementById("Ita").innerText = calculations.Ita
    document.getElementById("Bab").innerText = calculations.Bab
    document.getElementById("Tem").innerText = calculations.Tem
    document.getElementById("Canti").innerText = calculations.Canti
    document.getElementById("Declinacion").innerText = calculations.Declinacion
    document.getElementById("LonGeog").innerText = calculations.LonGeog
    document.getElementById("Longitude").innerText = calculations.Longitude
    document.getElementById("AscRec").innerText = calculations.AscRec
    document.getElementById("EcuaTiem").innerText = calculations.EcuaTiem
    document.getElementById("Elev").innerText = asDeg(calculations.Elev)
    document.getElementById("MaxElev").innerText = asDeg(calculations.MaxElev)
    document.getElementById("Acimut").innerText = asDeg(calculations.Acimut)
    document.getElementById("AcimutOcaso").innerText = asDeg(calculations.AcimutOcaso)
    document.getElementById("Duracion").innerText = calculations.Duracion
    document.getElementById("Mediodia").innerText = calculations.Mediodia
    document.getElementById("Orto").innerText = calculations.Orto
    document.getElementById("Ocaso").innerText = calculations.Ocaso
    document.getElementById("diajuliano").innerText = calculations.diajuliano
    document.getElementById("fecha").innerText = calculations.fecha
}

do_calculations();

window.intervalId = setInterval(do_calculations, 500);
window.watchId = navigator.geolocation.watchPosition((position) => {
    const coords = {
        latitude: round(position.coords.latitude, 3),
        longitude: round(position.coords.longitude, 3),
    }
    window.currentPosition = coords
    console.debug(`Updated location: ${coords.latitude}, ${coords.longitude}`)
    do_calculations()
}, (error) => {
    console.error(`Geolocation error ${error.code}: ${error.message}`)
    document.getElementById("error").innerText = error.message
    if (error.code === 1) {
        document.getElementById("error").classList.add("visible")
    }
    else {
        document.getElementById("error").classList.remove("visible")
    }
}, {
    timeout: 5000,
    enableHighAccuracy: true,
    maximumAge: 0
});

const checkboxElement = document.querySelector("#show_description");
checkboxElement.addEventListener("change", (event) => {
    var r = document.querySelector(':root');
    var value = getComputedStyle(r).getPropertyValue('--show-descriptions')
    r.style.setProperty('--show-descriptions', value === 'none' ? 'block' : 'none');
});

