export class JapaneseLeadersManager {
    constructor() {
        this.emperors = [];
        this.shoguns = [];
        this.other_leaders = [];
        this.isLoaded = false;
    }

    /**
     * Gets an element using querySelector
     * @param {String} id The identifier of the element
     * @returns the desired element
     */
    $(id) {
        return document.querySelector(id);
    }

    /**
     * Returns a year string with "B.C" appended if the year is B.C
     * @param {number} year the input year
     * @returns the appended string if year is B.C, else just the year
     */
    yearIsBC(year) {
        return year < 0 ? -year + " B.C" : year;
    }


    /**
     * Loads the leadership data 
     */
    async loadData() {
        try {
            const [emperorList, shogunList, otherLeadersList] = await Promise.all([
                fetch("assets/jsons/emperors.json"),
                fetch("assets/jsons/shoguns.json"),
                fetch("assets/jsons/tertiary_leaders.json")
            ])
            this.emperors = await emperorList.json();
            this.shoguns = await shogunList.json();
            this.other_leaders = await otherLeadersList.json();
            this.isLoaded = true
        } catch (error) {
            console.error("Failed to load leadership data", error);
        }

    }

    /**
     * Gets the leaders for a particular year
     * @param {number} targetYear the target year
     * @returns the leaders data
     */
    getLeadersForYear(targetYear) {
        if (!this.isLoaded) {
            console.log("Data not loaded")
            return null;
        }

        return {
            emperor: this.emperors.find(e => {
                const end = e.endYear === null ? Infinity : e.endYear;
                return targetYear >= e.startYear && targetYear <= end;
            }) || null,
            shogun: this.shoguns.find(s => {
                return targetYear >= s.startYear && targetYear <= s.endYear;
            }) || null,
            other_leader: this.other_leaders.find(other => {
                const end = other.endYear === null ? Infinity : other.endYear;
                return targetYear >= other.startYear && targetYear <= end;
            }) || null
        };
    }

    /**
     * Updates the leaders' cards for the given year
     * @param {number} year the input year
     */
    updateLeaderCard(year) {
        const leader = this.getLeadersForYear(year);
        const leaders = leader ? leader : null;
        this.$(".leaders_boxes").innerHTML = this.renderLeaderCard(leaders)
    }

    /**
     * Renders the HTML for the leader cards to be appended to the leaders section
     * @param {Object} leader The leader data
     * @returns The HTML for the leader boxes 
     */
    renderLeaderCard(leader) {


        if (!leader) {
            return `<div class="leader_box" style="display: none" id="emperor_box">
                    <div class="leader_image" id="emperor_image">
                        <img src="" alt="">
                    </div>
                    <div class="leader_info" id="emperor_info">
                        <h4></h4>
                        <div class="reign_and_lifespan">
                            <h5>Reign:</h5>
                            <h5>Lifespan:</h5>
                        </div>
                        <div class="leader_description">
                            <p></p>
                        </div>
                    </div>
                </div>
                <div class="leader_box" style="display: none" id="shogun_box">
                    <div class="leader_image" id="shogun_image">
                        <img src="" alt="">
                    </div>
                    <div class="leader_info" id="shogun_info">
                        <h4></h4>
                        <div class="reign_and_lifespan">
                            <h5>Reign:</h5>
                            <h5>Lifespan:</h5>
                        </div>
                        <div class="leader_description">
                            <p></p>
                        </div>
                    </div>
                </div>`;
        }

        let leadersCards = ``;
        leadersCards = leader.emperor ? `<div class="leader_box" id="emperor_box">
                    <div class="leader_image" id="emperor_image">
                        <img src="${leader.emperor.image}" alt="emperor">
                    </div>
                    <div class="leader_info" id="emperor_info">
                        <h4>${leader.emperor.name}</h4>
                        <div class="reign_and_lifespan">
                            <h5>Reign: ${this.yearIsBC(leader.emperor.startYear)} - ${leader.emperor.endYear != null ? this.yearIsBC(leader.emperor.endYear) : "present"}</h5>
                            <h5>Lifespan: ${this.yearIsBC(leader.emperor.birthYear)} - ${leader.emperor.deathYear != null ? this.yearIsBC(leader.emperor.deathYear) : "present"}</h5>
                        </div>
                        <div class="leader_description">
                            <p><b>${leader.emperor.description}</b></p>
                        </div>
                    </div>
                </div>` : `<div class="leader_box" style="display: none" id="emperor_box">
                    <div class="leader_image" id="emperor_image">
                        <img src="" alt="">
                    </div>
                    <div class="leader_info" id="emperor_info">
                        <h4></h4>
                        <div class="reign_and_lifespan">
                            <h5>Reign:</h5>
                            <h5>Lifespan:</h5>
                        </div>
                        <div class="leader_description">
                            <p></p>
                        </div>
                    </div>
                </div>`;

        leadersCards += leader.shogun ? `<div class="leader_box" id="shogun_box">
                    <div class="leader_image" id="shogun_image">
                        <img src="${leader.shogun.image}" alt="shogun">
                    </div>
                    <div class="leader_info" id="shogun_info">
                        <h4><sup>${leader.shogun.role}</sup><br>${leader.shogun.name}</h4>
                        <div class="reign_and_lifespan">
                            <h5>Reign: ${leader.shogun.startYear} - ${leader.shogun.endYear}</h5>
                            <h5>Lifespan: ${leader.shogun.birthYear} - ${leader.shogun.deathYear}</h5>
                        </div>
                        <div class="leader_description">
                            <p><b>${leader.shogun.description}</b></p>
                        </div>
                    </div>
                </div>`: `<div class="leader_box" style="display: none" id="shogun_box">
                    <div class="leader_image" id="shogun_image">
                        <img src="" alt="">
                    </div>
                    <div class="leader_info" id="shogun_info">
                        <h4></h4>
                        <div class="reign_and_lifespan">
                            <h5>Reign:</h5>
                            <h5>Lifespan:</h5>
                        </div>
                        <div class="leader_description">
                            <p></p>
                        </div>
                    </div>
                </div>`;

        leadersCards += leader.other_leader ? `<div class="leader_box" id="other_leader_box">
                    <div class="leader_image" id="other_leader_image">
                        <img src="${leader.other_leader.image}" alt="other_leader">
                    </div>
                    <div class="leader_info" id="other_leader_info">
                        <h4><sup>${leader.other_leader.role}</sup><br>${leader.other_leader.name}</h4>
                        <div class="reign_and_lifespan">
                            <h5>In power: ${leader.other_leader.startYear} - ${leader.other_leader.endYear === null ? "present" : leader.other_leader.endYear}</h5>
                            <h5>Lifespan: ${leader.other_leader.birthYear === null ? "?" : leader.other_leader.birthYear} - ${leader.other_leader.deathYear === null ? "present" : leader.other_leader.deathYear}</h5>
                        </div>
                        <div class="leader_description">
                            <p><b>${leader.other_leader.description}</b></p>
                        </div>
                    </div>
                </div>`: `<div class="leader_box" style="display: none" id="other_leader_box">
                    <div class="leader_image" id="other_leader_image">
                        <img src="" alt="">
                    </div>
                    <div class="leader_info" id="other_leader_info">
                        <h4></h4>
                        <div class="reign_and_lifespan">
                            <h5>Reign:</h5>
                            <h5>Lifespan:</h5>
                        </div>
                        <div class="leader_description">
                            <p></p>
                        </div>
                    </div>
                </div>`;

        return leadersCards;
    }

}