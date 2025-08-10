import { themes, readData, getPathsAndValues, getColorBrightness, rgb2hex, writeData, showToast, copyToClipboard } from "./main.js";

/**
 * Scoreboard class manages the live scoreboard functionality for both input and output modes.
 * Handles real-time data synchronization, UI updates, event history, and theme management.
 */
export class Scoreboard {
    /**
     * Initialize the Scoreboard with configuration and DOM elements
     * @param {string} type - 'input' for admin interface, 'output' for display
     * @param {jQuery} $html_frame - Main scoreboard container
     * @param {number} channel - Channel number for data synchronization
     * @param {string} theme - Theme identifier for styling
     * @param {User|null} user - Authenticated user object (required for input mode)
     */
    constructor(type = 'input', $html_frame = $('.scoreboard'), channel, theme = 'rg', user = null) {
        this.type = type;
        this.user = user;
        
        // Frontend elements - using const for immutable references
        this.$html_frame = $html_frame;
        this.$themeInput = $('#theme');
        this.$channelInput = $('#channel');
        this.$scoreChangeButtons = $('.button[team][change]');
        this.$setChangeButtons = $('.set_controls_container .button');
        this.$scoreboardInputs = this.$html_frame.find($('input:not([type=submit]), textarea'));
        this.$setCounter = $('#Set_Count');
        this.$resetScoresButton = $('#reset_scores');
        this.$sets = $('.set');
        this.$setScoreCounterA = $('.a_sets_won');
        this.$setScoreCounterB = $('.b_sets_won');
        this.$activeScoreCounterA = $('.a_score_active');
        this.$activeScoreCounterB = $('.b_score_active');
        this.$settingsEntries = $('.setting_entry.boolean input');
        this.$urlOutputContainer = $('.url_output_container');
        this.$urlOutput = $('.url_output');
        this.$logoutButton = $('#logout');
        this.$scoreHistoryContainer = $('.score_history');
        
        // Stored variables
        this.channel = Number(channel);
        this.theme = theme;
        this.settings = {
            "show_player_names": 1,
            "show_color": 1,
            "show_group_score": 0,
            "show_serve_indicator": 0,
            "show_score_history": 0,
            "show_score_history_chart": 0,
        };
        this.active_set = 1;
        this.ScoreHistoryChart = null;
        this.event_history = [];
        this.data_interval = null;
        this.update_interval = null;
        
        // Init function
        this.init();
    }

    /**
     * Initialize the scoreboard with event listeners and data synchronization
     * Sets up intervals for UI updates and data fetching based on board type
     */
    init() {
        this.initEventListeners();
        this.insertLiveData();
        
        // Update UI every 300ms for smooth real-time updates
        this.update_interval = setInterval(() => {
            this.updateUI();
        }, 300);

        // Simplified interval logic - removed redundant code
        // Input mode: slower updates (1500ms) since admin controls the data
        // Output mode: faster updates (300ms) for real-time display
        const dataIntervalDelay = this.type === 'input' ? 1500 : 300;
        this.data_interval = setInterval(() => {
            this.insertLiveData();
        }, dataIntervalDelay);

        // Set theme for output type
        if (this.type === 'output') {
            this.setTheme(this.theme);
ß        }
    }

    /**
     * Update all UI components in a single pass for performance
     * Only updates score history for output mode to avoid unnecessary processing
     */
    updateUI() {
        this.updateSets();
        this.updateSetScore();
        this.updateActiveScore();
        this.updateIndicators();
        this.updateSettings();
        this.handleEventHistory();
        this.updateOldScoreInputCounter();
        
        // Only update score history for output type
        if (this.type === 'output') {
            this.updateScoreHistory();
            this.updateScoreHistoryChart();
        }
    }

    /**
     * Apply theme styling and HTML structure based on theme configuration
     * @param {string} theme - Theme identifier from themes object
     */
    setTheme(theme) {
        // Simplified fallback logic
        if (!(theme in themes)) {
            theme = this.type === 'output' ? 'full' : 'rg';
        }

        const css_path = themes[theme].css_path;
        const extensionIndex = css_path.lastIndexOf('.');
        const css_path_input = css_path.slice(0, extensionIndex) + "_input" + css_path.slice(extensionIndex);

        // Remove all stylesheets
        $('link[rel="stylesheet"]').remove();

        // Add relevant stylesheets
        $('<link>').attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', '../css/base.css').appendTo('head');
        $('<link>').attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', css_path).appendTo('head');
        
        if (this.type === 'input') {
            $('<link>').attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', css_path_input).appendTo('head');
        } else if (this.type === 'output') {
            // Set corresponding html
            const html_structure = themes[theme].html_structure;
            $('.scoreboard').hide();
            $(`.scoreboard[theme="${html_structure}"]`).show();
            
            // Simplified conditional logic
            $('.score_history').toggleClass('hidden', html_structure !== 'vertical_score');
        }
    }


    /**
     * Initialize all event listeners for user interactions
     * Handles score changes, set navigation, settings updates, and data synchronization
     */
    initEventListeners() {
        // Theme input dropdown listener
        this.$themeInput.change((event) => {
            this.theme = $(event.target).val();
            this.updateUrlOutput();
        });

        // Channel input dropdown listener
        this.$channelInput.change((event) => {
            this.channel = $(event.target).val();
            this.insertLiveData();
            this.updateUI();
        });

        // URL output container click handler
        this.$urlOutputContainer.click(() => {
            const text = this.$urlOutput.attr('href');
            copyToClipboard(text);
            showToast('📋', 'Copied url to clipboard');
        });

        // Score input handler with simplified logic
        this.$scoreboardInputs.filter('[fb-data*="score"]').on('input', (event) => {
            const $target = $(event.target);
            const team = this.getScoreElemDetails($target)?.team;
            const newScore = Number($target.val());
            const oldScore = Number(this.$html_frame.find('.team_score').attr(`score_${team}`));
            const isSquadScore = $target.attr('fb-data').includes('squad_score');

            // Handle score decrease (remove history events)
            if (newScore < oldScore && !isSquadScore) {
                this.removeScoreHistoryEvents(team, newScore);
            } else {
                // Add new event to history
                const eventData = {
                    type: isSquadScore ? 'squad_score' : 'score',
                    team: team,
                    score: newScore,
                };
                
                if (!isSquadScore) {
                    eventData.set = this.active_set;
                }
                
                this.event_history.push(eventData);
            }

            this.updateOldScoreInputCounter();
            this.uploadData([$target]);
        });

        // Non-score input handler
        this.$scoreboardInputs.not('[fb-data*="score"]').on('input', (event) => {
            this.uploadData([$(event.target)]);
        });

        // Score change buttons handler
        this.$scoreChangeButtons.click((event) => {
            const $scoreButton = $(event.target);
            const $activeSetElem = $('.set.active');
            const team = $scoreButton.attr('team');
            const change = Number($scoreButton.attr('change'));
            const $scoreElem = $activeSetElem.find(`.score[fb-data*="team_${team}"]`);
            const currentScore = Number($scoreElem.val());

            if (currentScore + change >= 0) {
                $scoreElem.val(currentScore + change).trigger('input');
            }
        });

        // Set counter input handler
        this.$setCounter.on('input', () => {
            this.updateSets();
            this.event_history.push({
                type: 'set',
                set: this.active_set,
            });
        });

        // Set change buttons handler
        this.$setChangeButtons.click((event) => {
            const $setButton = $(event.target);
            const change = Number($setButton.attr('change'));
            const currentSet = Number(this.$setCounter.val());
            const newSet = currentSet + change;

            if (newSet > 0 && newSet <= 7) {
                this.active_set = newSet;
                this.$setCounter.trigger('input');
                this.updateSets();
                this.uploadData([this.$setCounter]);
            }
        });

        // Settings entries handler
        this.$settingsEntries.click((event) => {
            const $trigger = $(event.target);
            const value = $trigger.prop('checked') ? 1 : 0;
            const part = $trigger.attr('fb-data').split('.').pop();
            this.settings[part] = value;
            this.updateSettings();
            this.uploadData([$trigger]);
        });

        // Reset scores button handler
        this.$resetScoresButton.click(() => {
            $('[fb-data*="score"]').val(0);
            this.active_set = 1;
            this.updateSets();
            this.event_history.push({ type: 'reset' });
            this.uploadData();
        });

        // Logout button handler
        this.$logoutButton.click(() => {
            localStorage.clear();
            location.reload();
        });
    }

    /**
     * Remove score history events when score is decreased
     * This maintains accurate event history for undo functionality
     * @param {string} team - Team identifier ('a' or 'b')
     * @param {number} newScore - The new score value
     */
    removeScoreHistoryEvents(team, newScore) {
        const reversedHistory = this.event_history.slice().reverse();
        for (let i = 0; i < reversedHistory.length; i++) {
            const event = reversedHistory[i];
            if (event.type === 'score' && event.team === team && event.score > newScore) {
                this.event_history.splice(this.event_history.length - 1 - i, 1);
                break;
            }
        }
    }

    /**
     * Fetch and process live data from Firebase
     * Handles different data types: event history, admin settings, team colors, and general values
     */
    async insertLiveData() {
        console.log("inserting live data for channel ", this.channel);

        // Receive data from firebase
        const data = await readData(this.channel);
        const pathsAndValues = getPathsAndValues(data);

        // Process each path and value
        for (const [path, value] of Object.entries(pathsAndValues)) {
            const $elem = $(`[fb-data="${path}"]`);

            if (path.includes('event_history')) {
                this.event_history = Array.isArray(value) ? value : [];
            } else if (path.includes('admin_settings')) {
                this.insertAdminSetting(path, value);
            } else if (path.includes('team') && path.includes('color')) {
                this.insertColor($elem, path, value);
            } else if (path.includes('active_set')) {
                this.active_set = value;
            } else {
                // Set value based on element type
                $elem.is('input') ? $elem.val(value) : $elem.text(value);
            }
        }
    }

    /**
     * Insert admin setting value into local settings object
     * @param {string} path - Firebase path containing the setting
     * @param {*} value - Setting value to store
     */
    async insertAdminSetting(path, value) {
        const part = path.split('.').pop();
        this.settings[part] = value;
    }

    /**
     * Process team color updates with brightness calculations
     * Applies CSS variables and light/dark class adjustments
     * @param {jQuery} $elem - Color input element
     * @param {string} path - Firebase path containing color data
     * @param {string} value - Color value (hex or rgb)
     */
    async insertColor($elem, path, value) {
        let color = value;
        const brightness = getColorBrightness(rgb2hex(value));

        // Clip at dark values to prevent complete black
        if (brightness <= 23) {
            color = '#222222';
        }

        // Determine team from path
        const team = path.includes('team_a') ? 'a' : path.includes('team_b') ? 'b' : null;
        if (!team) return;

        if ($elem.is('input')) {
            $elem.val(value);
        } else {
            // Add color to CSS variable
            $('html').css(`--${team.toUpperCase()}_Color`, color);

            const $teamElems = $(`.team.team_${team}`);

            // Simplified brightness logic
            if (brightness >= 230) {
                $elem.addClass('light');
                $teamElems.addClass('light');
            } else if (brightness >= 150) {
                $elem.removeClass('light');
                $teamElems.addClass('light');
            } else {
                $elem.removeClass('light');
                $teamElems.removeClass('light');
            }
        }
    }

    /**
     * Upload data to Firebase with authentication checks
     * Processes element values and converts them to appropriate database format
     * @param {Array} elemList - List of jQuery elements to upload (optional, uploads all if undefined)
     */
    async uploadData(elemList) {
        // Check if selected channel is allowed
        if (!this.user || !this.channel || !this.user.channels.includes(Number(this.channel))) {
            if (this.channel) {
                showToast("❌", "You're not authenticated for this channel");
            }
            return;
        }

        // Upload all if there are no specific elements
        if (typeof elemList === 'undefined') {
            elemList = $("*[fb-data]");
        }

        // Prepare data for upload
        const newData = {};
        this.handleEventHistory();
        newData[`/match-${this.channel}/event_history`] = this.event_history;

        // Process each element
        $(elemList).each((i, elem) => {
            const $elem = $(elem);
            const fbDataAttr = $elem.attr("fb-data");
            
            if (!fbDataAttr) return;

            // Get value based on element type
            const value = $elem.is(":checkbox") ? ($elem.is(":checked") ? 1 : 0) : $elem.val();

            // Create database path
            const dbSelector = fbDataAttr.replace(/\./g, '/');
            const pathToVariable = `/match-${this.channel}/${dbSelector}`;

            // Convert to integer for score and active_set paths
            let finalValue = value;
            if (pathToVariable.includes('score') || pathToVariable.includes('active_set')) {
                try {
                    finalValue = parseInt(value);
                } catch (error) {
                    console.error(value, " can't be converted to integer");
                    return;
                }
            }

            newData[pathToVariable] = finalValue;
        });

        writeData(newData);
    }

    /**
     * Get all played sets (sets before the current active set)
     * @returns {Array} Array of jQuery set elements
     */
    getPlayedSets() {
        const playedSets = [];
        for (let i = 0; i < this.active_set - 1; i++) {
            playedSets.push(this.$sets[i]);
        }
        return playedSets;
    }

    /**
     * Get score element for a specific set and team
     * @param {number} set - Set number (1-7)
     * @param {string} team - Team identifier ('a' or 'b')
     * @returns {jQuery} Score element
     */
    getScoreElem(set, team) {
        return $(this.$sets[set - 1]).find(`[fb-data*="score"][fb-data*="team_${team}"]`);
    }

    /**
     * Extract team and set information from score element
     * @param {jQuery} $score_elem - Score element to analyze
     * @returns {Object|null} Object with team and set properties, or null if invalid
     */
    getScoreElemDetails($score_elem) {
        const fbDataAttr = $score_elem.attr('fb-data');

        if (!fbDataAttr) {
            return null;
        }

        // Determine team from attribute
        const team = fbDataAttr.includes('team_a') ? 'a' : fbDataAttr.includes('team_b') ? 'b' : null;

        // Extract set number with regex
        const setMatch = fbDataAttr.match(/set_(\d+)/);
        const set = setMatch ? setMatch[1] : null;

        return { team, set };
    }

    /**
     * Get current score for a specific set and team
     * @param {number} set - Set number (1-7)
     * @param {string} team - Team identifier ('a' or 'b')
     * @returns {number} Current score
     */
    getScore(set, team) {
        const $scoreElem = this.getScoreElem(set, team);
        return Number($scoreElem.is('input') ? $scoreElem.val() : $scoreElem.text());
    }

    /**
     * Determine the winner of a specific set
     * @param {number} set - Set number (1-7)
     * @returns {string|null} Team identifier ('a', 'b') or null if tie
     */
    getWinner(set) {
        const scoreA = this.getScore(set, 'a');
        const scoreB = this.getScore(set, 'b');
        
        if (scoreA > scoreB) return 'a';
        if (scoreB > scoreA) return 'b';
        return null;
    }

    /**
     * Calculate total sets won by a team
     * @param {string} team - Team identifier ('a' or 'b')
     * @returns {number} Number of sets won
     */
    getSetScore(team) {
        let setScore = 0;
        const playedSets = this.getPlayedSets();
        
        for (let i = 0; i < playedSets.length; i++) {
            if (this.getWinner(i + 1) === team) {
                setScore += 1;
            }
        }

        return setScore;
    }

    updateSets() {
        this.$setCounter.val(this.active_set);
        this.updateSetsVisibility();
        this.updateSetWinners();
    }

    updateSetsVisibility() {
        this.$sets.each((i, set) => {
            const $set = $(set);
            const setNumber = i + 1;
            
            $set.hide().removeClass('active');
            
            if (setNumber <= this.active_set) {
                $set.show();
                if (setNumber === this.active_set) {
                    $set.addClass('active');
                }
            }
        });
    }

    updateSetWinners() {
        const $scoreElems = this.$html_frame.find('[fb-data*="score"]');

        $scoreElems.each((i, elem) => {
            const $scoreElem = $(elem);
            const details = this.getScoreElemDetails($scoreElem);
            
            if (!details || details.set === this.active_set) {
                $scoreElem.removeClass('winner loser');
                return;
            }

            const winner = this.getWinner(details.set);
            if (winner === details.team) {
                $scoreElem.removeClass('loser').addClass('winner');
            } else if (winner !== null) {
                $scoreElem.removeClass('winner').addClass('loser');
            } else {
                $scoreElem.removeClass('winner loser');
            }
        });
    }

    updateSetScore() {
        this.$setScoreCounterA.text(this.getSetScore('a'));
        this.$setScoreCounterB.text(this.getSetScore('b'));
    }

    updateActiveScore() {
        this.$activeScoreCounterA.text(this.getScore(this.active_set, 'a'));
        this.$activeScoreCounterB.text(this.getScore(this.active_set, 'b'));
    }

    getServingTeam() {
        if (this.event_history.length === 0) return null;
        
        const lastScoreEvent = this.event_history.slice().reverse().find(event => event.type === 'score');
        return lastScoreEvent ? lastScoreEvent.team : null;
    }

    updateIndicators() {
        this.updateServeIndicator();
    }

    updateServeIndicator() {
        const servingTeam = this.getServingTeam();
        const $serverIndicators = $('.serve_indicator');
        
        $serverIndicators.removeClass('active');
        if (servingTeam) {
            $serverIndicators.filter(`.team_${servingTeam}`).addClass('active');
        }
    }

    updateSettings() {
        // Update checkbox states
        Object.entries(this.settings).forEach(([key, value]) => {
            const $settingsEntry = this.$settingsEntries.filter(`[fb-data*="${key}"]`);
            $settingsEntry.prop('checked', value === 1);
        });

        // Update visibility states
        this.updateGroupScoreVisibility();
        this.updateColorIndicatorVisibility();
        this.updatePlayerNamesVisibility();
        this.updateServeIndicatorVisibility();
        this.updateUrlOutput();
        this.updateScoreHistoryVisibility();
        this.updateScoreHistoryChartVisibility();
    }

    updateGroupScoreVisibility() {
        const isVisible = this.settings.show_group_score === 1;
        $('.group_score, .group-indicator').toggle(isVisible);
    }

    updateColorIndicatorVisibility() {
        const isVisible = this.settings.show_color === 1;
        $('.color-indicator').toggle(isVisible);
    }

    updatePlayerNamesVisibility() {
        const isVisible = this.settings.show_player_names === 1;
        $('body').attr('players', isVisible ? 'show' : 'hidden');
        $('.players').toggle(isVisible);
    }

    updateServeIndicatorVisibility() {
        const isVisible = this.settings.show_serve_indicator === 1;
        $('.serve_indicator').toggle(isVisible);
    }

    updateScoreHistoryVisibility() {
        const isVisible = this.settings.show_score_history === 1;
        $('.score_history').toggle(isVisible);
    }

    updateScoreHistoryChartVisibility() {
        const isVisible = this.settings.show_score_history_chart === 1;
        const $chartContainer = $('.chartContainer');
        
        if (isVisible && $chartContainer.is(':hidden')) {
            $chartContainer.slideDown(400, "easeOutCubic");
            this.scoreChart?.update();
        } else if (!isVisible && $chartContainer.is(':visible')) {
            $chartContainer.slideUp(300, "easeOutCubic");
        }
    }

    updateUrlOutput() {
        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = baseUrl.replace("input.html", "output.html");
        let urlOutput = `${newUrl}?channel=${this.channel}`;

        if (this.theme) {
            urlOutput += `&theme=${this.theme}`;
        }

        this.$urlOutput.text(urlOutput).attr('href', urlOutput);
    }

    updateAvailableChannels() {
        this.$channelInput.empty();

        if (!this.user) return;

        let channelExists = false;

        this.user.channels.forEach(channel => {
            this.$channelInput.append($('<option></option>').val(channel).html(channel));
            if (channel === this.channel) {
                channelExists = true;
            }
        });

        if (channelExists) {
            this.$channelInput.val(this.channel);
        } else {
            this.channel = this.user.channels[0];
            this.$channelInput.val(this.channel);
            setTimeout(() => {
                showToast("ℹ️", `Due to authentification the channel got changed to "${this.user.channels[0]}".`, 2000);
            }, 2200);
        }
    }

    updateOldScoreInputCounter() {
        this.$html_frame.find('.team_score')
            .attr('score_a', this.getScore(this.active_set, 'a'))
            .attr('score_b', this.getScore(this.active_set, 'b'));
    }

    handleEventHistory() {
        if (this.event_history.length > 164) {
            this.event_history = this.event_history.slice(-164);
        }
    }

    /**
     * Get score history for a specific set, filtering from last reset event
     * @param {number} set - Set number to get history for (defaults to active set)
     * @returns {Array} Filtered array of score events
     */
    getScoreHistory(set = this.active_set) {
        // Find the last reset event
        let startIndex = -1;
        for (let i = this.event_history.length - 1; i >= 0; i--) {
            if (this.event_history[i].type === 'reset') {
                startIndex = i;
                break;
            }
        }

        const slicedEventHistory = this.event_history.slice(startIndex + 1);
        return slicedEventHistory.filter(event => event.type === 'score' && event.set === set);
    }

    /**
     * Convert score history to team points list for chart visualization
     * Maintains last known score for each team across all events
     * @param {Array} slicedEventHistory - Filtered event history
     * @param {string} team - Team identifier ('a' or 'b')
     * @returns {Array} Array of score values for chart data
     */
    scoreHistoryToTeamPoints(slicedEventHistory, team) {
        const teamPointsList = [];
        let lastScore = 0;

        slicedEventHistory.forEach(event => {
            if (event.type === 'score') {
                if (event.team.toLowerCase() === team.toLowerCase()) {
                    lastScore = Number(event.score);
                }
                teamPointsList.push(lastScore);
            }
        });

        return teamPointsList;
    }

    /**
     * Update score history display with visual indicators
     * Shows score progression and active streaks for each team
     */
    updateScoreHistory() {
        this.$scoreHistoryContainer.find('.scores .team').each((i, container) => {
            const $container = $(container);
            const team = $container.attr('team');
            const scoresList = this.scoreHistoryToTeamPoints(this.getScoreHistory(), team);
            
            $container.empty();
            
            let streak = 0;
            scoresList.forEach((score, index) => {
                const isActive = score > (index > 0 ? scoresList[index - 1] : 0);
                streak = isActive ? streak + 1 : 0;
                const status = isActive ? 'active' : '';
                const element = `<div class="score_item ${status}" streak="${streak}">${score}</div>`;
                $container.append(element);
            });
        });
    }

    /**
     * Update Chart.js visualization of score progression
     * Creates line chart showing both teams' score progression over time
     * Uses team colors and provides visual feedback for score changes
     */
    updateScoreHistoryChart() {
        const scoresTeamA = this.scoreHistoryToTeamPoints(this.getScoreHistory(), 'a');
        const scoresTeamB = this.scoreHistoryToTeamPoints(this.getScoreHistory(), 'b');
        const labels = scoresTeamA.map((_, i) => `${i + 1}`);

        const ctx = document.getElementById('scoreChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.scoreChart) {
            this.scoreChart.destroy();
        }

        this.scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Team A",
                        data: scoresTeamA,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        segment: {
                            borderColor: getComputedStyle(document.documentElement).getPropertyValue("--A_Color").trim(),
                            backgroundColor: ctx => {
                                if (!ctx.p1 || !ctx.chart.data.datasets[1]) return '#000000';
                                const dataset2Value = ctx.chart.data.datasets[1].data[ctx.p0DataIndex];
                                return ctx.p1.parsed.y > dataset2Value ?
                                    `${getComputedStyle(document.documentElement).getPropertyValue("--A_Color").trim()}44` :
                                    `${getComputedStyle(document.documentElement).getPropertyValue("--B_Color").trim()}44`;
                            },
                        },
                        fill: '+1',
                    },
                    {
                        label: "Team B",
                        data: scoresTeamB,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue("--B_Color").trim(),
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue("--B_Color").trim()}22`,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: "false"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: {
                        display: false,
                        title: { display: false, text: 'Punkt' },
                        grid: { display: false }
                    },
                    y: {
                        display: false,
                        title: { display: false, text: 'Punkte' },
                        grid: { display: false },
                        beginAtZero: true
                    }
                }
            }
        });

        this.scoreChart.update();
    }
}
