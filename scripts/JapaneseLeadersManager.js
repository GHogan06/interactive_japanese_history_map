export class JapaneseLeadersManager {
    constructor(currentYear) {
        this.emperors = [];
        this.shoguns = [];
        this.other_leaders = [];
        this.isLoaded = false;
        this.activeIndices = { emperor: 0, shogun: 0, other_leader: 0 };
        this.currentYear = currentYear
        // Attach event listener to the container parent using delegation
        const leadersContainer = document.querySelector(".leaders_boxes");

        if (leadersContainer) {
            leadersContainer.addEventListener("click", (e) => {
                const btn = e.target.closest(".carousel_btn");
                if (!btn) return;

                // Find the parent .leader_box container
                const leaderBox = btn.closest(".leader_box");
                if (!leaderBox) return;

                // Extract roleKey from the box ID (e.g. "emperor_box" -> "emperor")
                const roleKey = leaderBox.id.replace("_box", "");
                const direction = parseInt(btn.dataset.direction, 10);

                this.cycleLeader(roleKey, direction);
            });
        }
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
            emperor: this.emperors.filter(e => {
                const end = e.endYear === null ? Infinity : e.endYear;
                return targetYear >= e.startYear && targetYear <= end;
            }) || null,
            shogun: this.shoguns.filter(s => {
                return targetYear >= s.startYear && targetYear <= s.endYear;
            }) || null,
            other_leader: this.other_leaders.filter(other => {
                const end = other.endYear === null ? Infinity : other.endYear;
                return targetYear >= other.startYear && targetYear <= end;
            }) || null
        };
    }

    /**
     * Updates the leaders' cards for the given year
     * @param {number} year the input year
     */
    updateLeaderCard(year, isYearChange = true) {
        this.currentYear = year;

        if (isYearChange) {
            this.activeIndices = { emperor: 0, shogun: 0, other_leader: 0 }
        }
        const leader = this.getLeadersForYear(year);
        const leaders = leader ? leader : null;
        this.$(".leaders_boxes").innerHTML = this.renderLeaderCard(leaders)
    }

    /**
     * Renders the HTML for the leader cards to be appended to the leaders section
     * @param {Object} leader The leader data
     * @returns The HTML for the leader boxes 
     */
    renderLeaderCard(leaders) {
        if (!this.activeIndices) {
            this.activeIndices = { emperor: 0, shogun: 0, other_leader: 0 }
        }

        let leaderCards = "";
        leaderCards += this.renderLeaderRoleCard("emperor", leaders.emperor, this.activeIndices.emperor);
        leaderCards += this.renderLeaderRoleCard("shogun", leaders.shogun, this.activeIndices.shogun);
        leaderCards += this.renderLeaderRoleCard("other_leader", leaders.other_leader, this.activeIndices.other_leader);

        return leaderCards;
    }

    cycleLeader(roleKey, direction) {
        const yearLeaders = this.getLeadersForYear(this.currentYear)
        if (!yearLeaders) { return }

        const leaderList = yearLeaders[roleKey];
        if (!leaderList || leaderList.length <= 1) { return }

        const total = leaderList.length;
        let currentIndex = this.activeIndices[roleKey] || 0;
        currentIndex = (currentIndex + direction + total) % total;

        this.activeIndices[roleKey] = currentIndex;
        this.updateLeaderCard(this.currentYear, false);
    }

    renderLeaderRoleCard(roleKey, leaderList, activeIndex = 0) {
        // If no leaders exist for this role, return an empty/hidden card
        if (!leaderList || leaderList.length === 0) {
            return `<div class="leader_box" style="display: none" id="${roleKey}_box"></div>`;
        }

        // Select current leader based on active index
        const leader = leaderList[activeIndex] || leaderList[0];
        const total = leaderList.length;

        const prevBtn = total > 1 ? `
        <button class="carousel_btn prev_btn" data-direction="-1">◀</button>
    ` : '';

        const nextBtn = total > 1 ? `
        <button class="carousel_btn next_btn" data-direction="1">▶</button>
    ` : '';

        const indicator = total > 1 ? `
        <span class="carousel_indicator">${activeIndex + 1} / ${total}</span>
    ` : '';



        // Render HTML Card
       return `
        <div class="leader_box" id="${roleKey}_box">
            ${prevBtn}
            
            <div class="leader_image" id="${roleKey}_image">
                <img src="${leader.image}" alt="${roleKey}">
            </div>
            
            <div class="leader_info" id="${roleKey}_info">
                <h4>
                    ${leader.role ? `<sup>${leader.role}</sup><br>` : ''}
                    ${leader.name}
                </h4>
                <div class="reign_and_lifespan">
                    <h5>${roleKey == "emperor" ? "Reign" : "In power:"} ${this.yearIsBC(leader.startYear)} - ${leader.endYear != null ? this.yearIsBC(leader.endYear) : "present"}</h5>
                    <h5>Lifespan: ${leader.birthYear != null ? this.yearIsBC(leader.birthYear) : "?"} - ${leader.deathYear != null ? this.yearIsBC(leader.deathYear) : "present"}</h5>
                </div>
                <div class="leader_description">
                    <p><b>${leader.description}</b></p>
                </div>
                ${indicator} <!-- Placed at the end of leader_info -->
            </div>
            
            ${nextBtn}
        </div>
    `;
    }
}