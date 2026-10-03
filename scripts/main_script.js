import { JapaneseLeadersManager } from "./JapaneseLeadersManager.js";
import { ClickAndHoldButton } from "./ClickAndHoldButton.js";
import { JapaneseEventManager } from "./JapaneseEventManager.js";
import { CityManager } from "./CityManager.js";

/**
 * Returns an element using querySelector
 * @param {String} id the identifier of the element (add the prefix "." for a class, "#" for an id)
 * @returns the desired element
 */
function $(id) {
    return document.querySelector(id);
}

//Initialise map
var map = L.map('map', {
    center: [38.4693321, 136.8566629],
    zoom: 5,
});

// Store the geojson styles for the land and ocean in a map
let geoJSONStyles = new Map()
geoJSONStyles.set("ocean", {
    fillColor: "#5370ba",
    fillOpacity: 1,
    color: "#5370ba",
    weight: 1
})

geoJSONStyles.set("landmass", {
    fillColor: "#323c3d",
    fillOpacity: 1,
    color: "#333",
    weight: 1
})

/**
 * Draws the given geojson file onto the map
 * @param {String} geojsonFile The geojson file name to be drawn
 * @param {String} style The name of the style to be applied to the geojson
 */
function drawGeoJSON(geojsonFile, style) {
    fetch("assets/jsons/" + geojsonFile)
        .then(response => response.json())
        .then(data => {
            const offsets = [-360, 0, 360];

            offsets.forEach(offset => {
                const shiftedData = shiftGeometryCollection(data, offset);

                L.geoJSON(shiftedData, {
                    style: geoJSONStyles.get(style)
                }).addTo(map);
            });
        });
}


/**
 * Clones the geojson data and attaches a clone to the left and right of the primary central geojson map.
 * @param {Object[]} data The geojson data to be cloned 
 * @param {*} offsetLng The offset longitude to shift the data by
 * @returns the cloned geojson
 */
function shiftGeometryCollection(data, offsetLng) {
    const cloned = JSON.parse(JSON.stringify(data));

    //Shifts the coordinates by the offset
    function shiftCoords(coords) {
        if (!coords) return;
        if (typeof coords[0] === 'number') {
            coords[0] += offsetLng;
        } else {
            coords.forEach(shiftCoords);
        }
    }

    if (cloned.geometries && Array.isArray(cloned.geometries)) {
        cloned.geometries.forEach(geom => {
            if (geom && geom.coordinates) {
                shiftCoords(geom.coordinates);
            }
        });
    }

    return cloned;
}

//draw ocean and land geojson data to the map
drawGeoJSON("ocean_world.json", "ocean");
drawGeoJSON("world.json", "landmass");

/**
 * Returns the year attached with B.C if the year is B.C
 * @param {number} year the input year 
 * @returns a string of the year with B.C attached if the year is B.C
 */
function yearIsBC(year) {
    return year < 0 ? -year + " B.C" : year;
}

/**
 * Updates the selected year box card with the year and historical period
 * @param {number} year The selected year
 */
function updateSelectedYearBox(year) {
    $("#selected_year_box").innerHTML = `${yearIsBC(parseInt(year))}<br>${getHistoricalPeriod(year)}`;
    $("#current_period_display").innerHTML = getHistoricalPeriod(year)
}

/**
 * Gets the Japanese historical period to which a year belongs
 * @param {number} year The input year
 * @returns The string of the historical period name
 */
function getHistoricalPeriod(year) {
    if (year < 250) { return "Yayoi Period"; }
    else if (year < 538) { return "Kofun Period"; }
    else if (year < 710) { return "Asuka Period"; }
    else if (year < 794) { return "Nara Period"; }
    else if (year < 1185) { return "Heian Period"; }
    else if (year < 1333) { return "Kamakura Period"; }
    else if (year < 1573) { return "Muromachi Period"; }
    else if (year < 1603) { return "Azuchi-Momoyama Period" }
    else if (year < 1868) { return "Edo Period"; }
    else if (year < 1912) { return "Meiji Period"; }
    else if (year < 1926) { return "Taisho Period"; }
    else if (year < 1989) { return "Showa Period"; }
    else if (year < 2019) { return "Heisei Period"; }
    else { return "Reiwa Period"; }
}

// create instances of the leaders, events, and city managers
const leaderManager = new JapaneseLeadersManager();
const japaneseEventManager = new JapaneseEventManager(map);
const cityManager = new CityManager(map);


window.addEventListener("load", async () => {

    // load data
    await Promise.all([
        leaderManager.loadData(),
        japaneseEventManager.loadData(),
        cityManager.loadData()
    ]);

    /**
     * Performs these functions when the year changes to update the UI.
     */
    function handleYearChange() {
        updateSelectedYearBox($("#year_slider").value);
        leaderManager.updateLeaderCard(parseInt($("#year_slider").value));
        japaneseEventManager.updateMapForYear(parseInt($("#year_slider").value));
        cityManager.updateMapForYear(parseInt($("#year_slider").value))
    }

    handleYearChange()

    // Add zoom listener to map to update city label sizes
    map.addEventListener("zoomend", () => {
        cityManager.updateMapForYear(parseInt($("#year_slider").value));
        cityManager.updateCityLabelSizes();

    })

    // when the year slider is moved
    $("#year_slider").addEventListener("input", () => {
        handleYearChange()
    });

    // click events for the back event button
    $("#back_event_button").addEventListener("click", () => {
        const previousYear = japaneseEventManager.goToPreviousYear(parseInt($("#year_slider").value));

        if ($("#year_slider")) {
            $("#year_slider").value = previousYear
            handleYearChange()
        }
    })

    // click events for the forward event button
    $("#forward_event_button").addEventListener("click", () => {
        const futureYear = japaneseEventManager.goToNextYear(parseInt($("#year_slider").value));

        if ($("#year_slider")) {
            $("#year_slider").value = futureYear
            handleYearChange()
        }
    })

    //Initialise the forward and back year click and hold buttons
    new ClickAndHoldButton($("#back_year_button"), () => {
        $("#year_slider").value = parseInt($("#year_slider").value) - 1;
        handleYearChange()
    })

    new ClickAndHoldButton($("#forward_year_button"), () => {
        $("#year_slider").value = parseInt($("#year_slider").value) + 1;
        handleYearChange()
    })

    const filters = document.querySelector("#events_filter")
    filters.addEventListener("change", (e)=>{
        if (e.target.matches("input[type='checkbox']")){
            japaneseEventManager.updateCheckedEvents(parseInt($("#year_slider").value));
        }
    })
})

