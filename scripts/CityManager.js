export class CityManager {
    constructor(map, minZoom = 5) {
        this.cities = [];
        this.markers = [];
        this.map = map;
        this.minZoom = minZoom;
        this.isLoaded = false;
    }

    /**
     * loads the city data and creates the markers from the data 
     */
    async loadData() {
        try {
            let res = await fetch("assets/jsons/cities.json");
            this.cities = await res.json();
            this._createCityLabels()
            this.isLoaded = true;
        } catch (error) {
            console.error("The city data could not be loaded.", error);
        }
    }

    /**
     * Creates the labels for each city on the map
     */
    _createCityLabels() {
        this.cities.forEach(city => {
            const customTextIcon = L.divIcon({
                className: `city_label_icon ${city.importance}_city`,
                html: `
                <div class="city_label_container">
                    <span class="city_dot"></span>
                    <span class="city_label_text">${city.name}</span>
                </div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            for (let i = -1; i <= 1; i++) {
                const currentMarker = L.marker([city.coordinates[0], city.coordinates[1] + (360*i)], { icon: customTextIcon });
                currentMarker.bindPopup(`
                <div class="city_popup">
                    <h4>${city.name}</h4>
                    <p>${city.description}</p>
                </div>`);

                this.markers.push({
                    data: city,
                    instance: currentMarker,
                    isOnMap: false
                });
            }
        });
    }

    /**
     * Updates the map the map for a given year
     * @param {number} selectedYear the year 
     * @returns 
     */
    updateMapForYear(selectedYear) {
        // Return if no data
        if (!this.isLoaded) { return }

        // get zoom to determine if a city should be visible on the map
        const currentZoom = this.map.getZoom();

        this.markers.forEach(item => {
            const { startYear, endYear } = item.data;
            const finalEndYear = endYear === null ? Infinity : endYear;

            const isInYearRange = selectedYear >= startYear && selectedYear <= finalEndYear;
            const isZoomedInEnough = currentZoom >= this.minZoom;

            const shouldBeVisible = isInYearRange && isZoomedInEnough;

            if (shouldBeVisible && !item.isOnMap) {
                item.instance.addTo(this.map);
                item.isOnMap = true;
            }
            else if (!shouldBeVisible && item.isOnMap) {
                this.map.removeLayer(item.instance);
                item.isOnMap = false;

            }
        });
    }

    /**
     * Updates the size of the city labels depending on the zoom
     */
    updateCityLabelSizes() {
        const currentZoom = this.map.getZoom();
        const baseZoom = 5;
        const baseFontSize = 10;
        const maxFontSize = 24;
        const minFontSize = 8;

        const calculatedSize = baseFontSize * Math.pow(1.3, currentZoom - baseZoom);

        const clampedSize = Math.max(minFontSize, Math.min(maxFontSize, calculatedSize));

        const labelElements = document.querySelectorAll('.city_label_text');
        labelElements.forEach(element => {
            element.style.fontSize = `${clampedSize}px`;
        })
    }
}