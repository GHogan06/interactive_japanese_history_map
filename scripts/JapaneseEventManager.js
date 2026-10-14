export class JapaneseEventManager {
    constructor(map) {
        this.map = map
        this.events = []
        this.markers = []
        this.markerIcon = {
            military: "assets/images/map_markers/military.png",
            political: "assets/images/map_markers/political.png",
            religious: "assets/images/map_markers/religious.png",
            cultural: "assets/images/map_markers/cultural.png",
            diplomatic: "assets/images/map_markers/diplomatic.png",
            economic: "assets/images/map_markers/economic.png",
            natural: "assets/images/map_markers/natural.png",
            other: "assets/images/map_markers/other.png",
            default: "assets/images/map_markers/default.png"
        };
        this.activeCategories = this.findCheckedEvents()
        this.eventsContainer = document.getElementById("events_list_container");
        this.yearDisplay = document.getElementById("current_year_display");
        this.isLoaded = false;

        this.markerClusterGroup = L.markerClusterGroup({
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });
        this.map.addLayer(this.markerClusterGroup);

        this.currentYearEvents = [];
        this.currentEventIndex = 0;
        this.intraYearContainer = document.getElementById("intra_year_nav_container");
        this.yearEventCounter = document.getElementById("year_event_counter");
        this.currentYear = null;
        this.isSingleEventView = false;
        this.exitSingleViewButton = document.getElementById("exit_single_event_button");

        if (this.exitSingleViewButton){
            this.exitSingleViewButton.addEventListener("click", ()=>{this.exitSingleEventView()})
        }


        this._setUpZoomListener();
    }

    /**
     * Load the data and create the map markers for the events. Gives error if data cannot be loaded.
     */
    async loadData() {
        try {
            const res = await fetch("assets/jsons/events.json");
            this.events = await res.json();
            this._createMarkers();
            this.isLoaded = true;
        } catch (error) {
            console.error("Error: Failed to load events data.", error);
        };
    }

    /**
     * Adds a zoomend listener to the map so that the marker icons' size change depending on the zoom
     */
    _setUpZoomListener() {
        this.map.on("zoomend", () => {
            const zoom = this.map.getZoom();
            const newSize = this.getIconSizeForZoom(zoom);
            const newAnchor = newSize[0] / 2;

            // for each marker, set it to the updated size
            this.markers.forEach(item => {
                const marker = item.instance;
                const category = item.data.category ? item.data.category.toLowerCase() : 'default';
                const iconPath = this.markerIcon[category] || this.markerIcon.default;

                const updatedIcon = L.icon({
                    iconUrl: iconPath,
                    iconSize: newSize,
                    iconAnchor: [newAnchor, newAnchor],
                    popupAnchor: [0, -newAnchor],
                    className: 'event_png_marker'
                });

                marker.setIcon(updatedIcon);
            });
        });
    }

    /**
     *  Returns the size the icon should be at according to the map's zoom level
     * @param {number} zoom The current zoom level of the map
     * @returns the width/height the icon should have at the zoom
     */
    getIconSizeForZoom(zoom) {
        if (zoom < 6) return [16, 16];        // Small when zoomed out
        if (zoom >= 6 && zoom < 9) return [32, 32]; // Medium
        return [50, 50];                      // Full size when zoomed in
    }

    /**
     *Creates the icon and marker for a given event 
     * @param {Object} event 
     * @returns the marker for an event
     */
    createCustomMarker(event) {
        // creating icon
        const iconPath = this.markerIcon[event.category.toLowerCase()] || this.markerIcon.default;
        const currentZoom = this.map.getZoom();
        const size = this.getIconSizeForZoom(currentZoom);
        const anchor = size[0] / 2;



        const eventIcon = L.icon({
            iconUrl: iconPath,
            iconSize: size,
            iconAnchor: [anchor, anchor],
            popupAnchor: [0, -anchor],
            className: 'event_png_marker'
        });

        // creating markers
        const markers = []
        for (let i = -1; i <= 1; i++) {
            let currentMarker = L.marker([event.coordinates[0], event.coordinates[1] + (360 * i)], { icon: eventIcon })
            // Store category for future feature of filtering by event type
            currentMarker.options.category = event.category;
            currentMarker.options.year = event.year;
            markers.push(currentMarker);
        }




        return markers;
    }

    /**
     * Create the list of markers for the program
     */
    _createMarkers() {
        this.events.forEach(event => {
            const eventMarkers = this.createCustomMarker(event);

            eventMarkers.forEach(marker => {
                marker.bindPopup(`
                <div class="event_popup">
                    <h4>${event.title} (${event.year})</h4>
                    <h5>Event Type: ${event.category}</h5>
                    <img class="event_image" src=${event.image}>
                    <p>${event.description}</p>
                </div>`);

                this.markers.push({
                    data: event,
                    instance: marker,
                    isOnMap: false
                });
            })


        });
    }

    /**
     * Updates the sidebar to add cards for each event for the given year
     * @param {Object[]} yearEvents The list of events
     * @param {number} year The year
     * @returns 
     */
    _updateSidebarEvents(yearEvents, year) {
        // update year display
        if (this.yearDisplay) {
            this.yearDisplay.innerText = year < 0 ? -year + " B.C" : year;
        }

        // if no events container, return
        if (!this.eventsContainer) {
            console.log("No events container")
            return
        }

        // reset container
        this.eventsContainer.innerHTML = ""

        // filter to get events for the desired year
        const activeEvents = yearEvents.filter(event => (event.year === year && this.activeCategories.has(event.category.toLowerCase())));
        const inactiveEvents = yearEvents.filter(event => event.year === year && !this.activeCategories.has(event.category.toLowerCase()));

        if (inactiveEvents.length > 0) {
            this.eventsContainer.innerHTML = `<p class="no_events_msg">There ${inactiveEvents.length > 1 ? "are " + inactiveEvents.length + " hidden events" : "is 1 hidden event"} for this year.</p>`;
        }
        else if (activeEvents.length === 0) {
            this.eventsContainer.innerHTML = `<p class="no_events_msg">There are no notable events for this year.</p>`;
            return;
        }

        // create cards for each event, click event if the event has coordinates to fly to
        activeEvents.forEach(event => {
            const eventCard = document.createElement("div");
            eventCard.className = "event_card";

            eventCard.innerHTML = `
                <div class="event_card_header">
                    <span class="event_title">${event.title}</span>
                    <span class="event_date">${event.year < 0 ? (- event.year) + " B.C" : event.year}</span>
                </div>
                <p class="event_description">${event.description}</p>
            `;

            if (event.coordinates) {
                eventCard.classList.add("clickable_event");
                eventCard.addEventListener("click", () => {
                    this.exitSingleEventView()
                    this.map.flyTo(event.coordinates, 7, { duration: 1 })
                });
            }

            // append to container
            this.eventsContainer.appendChild(eventCard)

        })

    }

    /**
     * Updates the map for the year
     * @param {number} year the new year 
     * @returns 
     */
    updateMapForYear(year) {
        // if data not loaded, return
        if (!this.isLoaded) { return }

        this.currentYear = year;
        this.isSingleEventView = false;

        this.markers.forEach(item => {
            const yearMatch = year === item.data.year;
            const eventCategory = item.data.category ? item.data.category.toLowerCase() : 'default'

            const isVisible = (yearMatch && this.activeCategories.has(eventCategory));


            if (isVisible && !item.isOnMap) {
                this.markerClusterGroup.addLayer(item.instance)
                item.isOnMap = true;
            }
            else if (!isVisible && item.isOnMap) {
                this.markerClusterGroup.removeLayer(item.instance)
                item.isOnMap = false;
            }
        });

        // Intra-year events
        this.currentYearEvents = this.events.filter((event) => {
            return event.year === year && this.activeCategories.has(event.category.toLowerCase())
        });

        this.currentYearEvents.sort(function (a, b) {
            if (a.month == b.month) {
                return a.date - b.date;
            }
            else {
                return a.month - b.month;
            }
        })


        this.currentEventIndex = 0;
        const firstEventofYear = this.currentYearEvents[0];

        if (this.intraYearContainer) {
            if (this.currentYearEvents.length > 1) {
                this.intraYearContainer.style.display = "block";
                if (this.yearEventCounter) {
                    this.yearEventCounter.innerText = `${firstEventofYear.month ? this._getMonthName(firstEventofYear.month) : ""} ${firstEventofYear.date ? firstEventofYear.date : ""}`
                }
                if (this.exitSingleViewButton){
                    this.exitSingleViewButton.style.display = "none";
                }
            }
            else {
                this.intraYearContainer.style.display = "none";
            }
        }

        this._updateSidebarEvents(this.events, year)
    }

    /**
     * Gets all the years that have events
     * @returns an ordered list of years that have events
     */
    getEventsYears() {
        if (!this.events || this.events.length === 0) {
            return []
        }

        const years = this.events.map(event => event.year);

        return [... new Set(years)].sort((a, b) => (a - b));

    }

    /**
     * Gets the last year that has an event associates with it.
     * @param {number} currentYear the current year 
     * @returns the previous year that had an event
     */
    goToPreviousYear(currentYear) {
        const eventYears = this.getEventsYears();

        if (eventYears.length === 0) { return currentYear }

        const pastYears = eventYears.filter(year => year < currentYear);

        if (pastYears.length > 0) {
            const previousYear = pastYears[pastYears.length - 1];
            return previousYear;
        }

        return currentYear

    }

    /**
     * Gets the next year that has an event associated with it
     * @param {number} currentYear the current year 
     * @returns the next year that has an event
     */
    goToNextYear(currentYear) {
        const eventYears = this.getEventsYears();

        if (eventYears.length === 0) { return currentYear }

        const futureYears = eventYears.filter(year => year > currentYear);

        if (futureYears.length > 0) {
            const futureYear = futureYears[0];
            return futureYear;
        }

        return currentYear

    }

    findCheckedEvents() {
        const eventsFilter = document.querySelectorAll(".event_type_filter > input")
        const activeCategories = new Set()
        eventsFilter.forEach(input => {
            if (input.checked) {
                const eventCategory = input.getAttribute("id").replace("_filter", "").toLowerCase();
                activeCategories.add(eventCategory)
            }
        });
        return activeCategories
    }

    updateCheckedEvents(year) {
        this.activeCategories = this.findCheckedEvents();
        this.updateMapForYear(year);
    }

    _getMonthName(month) {
        switch (month) {
            case 1:
                return "January";
            case 2:
                return "February";
            case 3:
                return "March";
            case 4:
                return "April";
            case 5:
                return "May";
            case 6:
                return "June";
            case 7:
                return "July";
            case 8:
                return "August";
            case 9:
                return "September";
            case 10:
                return "October";
            case 11:
                return "November";
            case 12:
                return "December";
            default:
                return "";
        }
    }

    nextEventInYear() {
        if (!this.currentYearEvents || this.currentYearEvents <= 1) { return };
        if (!this.isSingleEventView){
            this.isSingleEventView = true;
            this.currentEventIndex = 0
        }
        else{
        this.currentEventIndex = (this.currentEventIndex + 1) % this.currentYearEvents.length;
        }
        this._focusOnIntraYearEvent();

    }

    previousEventInYear() {
        if (!this.currentYearEvents || this.currentYearEvents <= 1) { return };
        if (!this.isSingleEventView){
            this.isSingleEventView = true;
            this.currentEventIndex = 0;
        }
        else{
            this.currentEventIndex = (this.currentEventIndex - 1 + this.currentYearEvents.length) % this.currentYearEvents.length;
        }
        
        this._focusOnIntraYearEvent();

    }

    _focusOnIntraYearEvent() {
        if (!this.currentYearEvents ||this.currentYearEvents.length === 0) { return };

        const activeEvent = this.currentYearEvents[this.currentEventIndex];
        if (!activeEvent){return}

        if (this.yearEventCounter) {
            this.yearEventCounter.innerText = `${activeEvent.month ? this._getMonthName(activeEvent.month) : ""} ${activeEvent.date ? activeEvent.date : ""}`
        }

        if (this.exitSingleViewButton) {
            this.exitSingleViewButton.style.display = "block"
        }

        this.markers.forEach(item => {
            const isTargetEvent = (item.data === activeEvent);
            const eventCategory = item.data.category ? item.data.category.toLowerCase() : 'default';
            const isVisible = (isTargetEvent && this.activeCategories.has(eventCategory));

            if (isVisible && !item.isOnMap) {
                this.markerClusterGroup.addLayer(item.instance);
                item.isOnMap = true;
            }
            else if (!isVisible && item.isOnMap) {
                this.markerClusterGroup.removeLayer(item.instance);
                item.isOnMap = false;
            }
        });

        if (activeEvent.coordinates) {
            this.map.flyTo(activeEvent.coordinates, 8, { duration: 1 });

            const targetMarker = this.markers.find(m => {
                if (m.data.id !== activeEvent.id || !m.isOnMap) return false;
                const lng = m.instance.getLatLng().lng;
                return lng >= -180 && lng <= 180;
            });

            if (targetMarker && targetMarker.instance) {
                this.markerClusterGroup.zoomToShowLayer(targetMarker.instance, () =>{
                    setTimeout(()=>{targetMarker.instance.openPopup()}, 1000);
                })
            }
        }
    }

    exitSingleEventView(){
        if (!this.isLoaded || !this.isSingleEventView || this.currentYear === null){return}

        this.isSingleEventView = false;

        this.markers.forEach(item =>{
            const yearMatch = (this.currentYear === item.data.year);
            const eventCategory = item.data.category ? item.data.category.toLowerCase() : "default";
            const isVisible = (yearMatch && this.activeCategories.has(eventCategory));

            if (isVisible && !item.isOnMap){
                item.instance.closePopup();
                this.markerClusterGroup.addLayer(item.instance);
                item.isOnMap = true
            }
            else if (!isVisible && item.isOnMap){
                this.markerClusterGroup.removeLayer(item.instance);
                item.isOnMap = false;
            }

            if (this.intraYearContainer){
                this.intraYearContainer.style.display = "block";

                if (this.yearEventCounter){
                    this.yearEventCounter.innerText = ``
                }
                if (this.exitSingleViewButton){
                    this.exitSingleViewButton.style.display = "none";
                }
            }

        })
    }




}

