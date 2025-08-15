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
        this.$winPoints = $('#win_points');
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
        
        // Game settings
        this.gameSettings = {
            "win_points": 15, // Standard winning score
            "min_win_margin": 2, // Minimum points difference to win
            "max_sets": 3, // Maximum number of sets
            "hardcap": 21
        };
        
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
        }
    }

    /**
     * Update the starting team selector to show the current set's starting team
     */
    updateStartingTeamSelector() {
        // Update all starting team selectors for all sets
        for (let setNumber = 1; setNumber <= 7; setNumber++) {
            const $selector = this.$html_frame.find(`#starting_team_${setNumber}`);
            if ($selector.length > 0) {
                const currentStartingTeam = this.getStartingTeam(setNumber);
                if (currentStartingTeam) {
                    $selector.val(currentStartingTeam);
                }
            }
        }
        
        // Update hidden starting_team fields in output.html to reflect current set
        if (this.type === 'output') {
            this.$html_frame.find(`[fb-data*="score.set_"][fb-data*=".starting_team"]`).each((index, element) => {
                const $element = $(element);
                $element.attr('fb-data', `score.set_${this.active_set}.starting_team`);
            });
        }
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
        this.updateStartingTeamSelector();
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

        // Starting team dropdown listener
        this.$html_frame.find('.starting_team_selector select').change((event) => {
            this.updateIndicators();
            this.uploadData([$(event.target)]);
        });

        // Update starting team selector when set changes
        this.$setCounter.on('input', () => {
            this.updateStartingTeamSelector();
        });

        // URL output container click handler
        this.$urlOutputContainer.click(() => {
            const text = this.$urlOutput.attr('href');
            copyToClipboard(text);
            showToast('📋', 'Copied url to clipboard');
        });

        // Data import button handler
        $('#import_data').click(() => {
            this.importDataFromJson();
        });

        // Score input handler with simplified logic
        this.$scoreboardInputs.filter('[fb-data*="score"]').on('input', (event) => {
            const $target = $(event.target);
            const team = this.getScoreElemDetails($target)?.team;
            const newScore = Number($target.val()) || 0; // Default to 0 if NaN
            const oldScore = Number(this.$html_frame.find('.team_score').attr(`score_${team}`)) || 0;
            const isSquadScore = $target.attr('fb-data').includes('squad_score');

            // Only add to event history if we have valid scores
            if (!isNaN(newScore) && !isNaN(oldScore)) {
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

        // Toggle switch handler
        $('.toggle-switch input[type="checkbox"]').change((event) => {
            const $checkbox = $(event.target);
            const $toggleSwitch = $checkbox.closest('.toggle-switch');
            const value = $checkbox.prop('checked') ? 1 : 0;
            const part = $checkbox.attr('fb-data').split('.').pop();
            
            // Update toggle switch appearance
            $toggleSwitch.toggleClass('active', $checkbox.prop('checked'));
            
            // Update settings
            this.settings[part] = value;
            this.updateSettings();
            this.uploadData([$checkbox]);
        });

        // Winning score handler
        this.$winPoints.on('input', (event) => {
            const value = Number($(event.target).val());
            this.gameSettings.win_points = value;
            this.uploadData([$(event.target)]);
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
     * Import data from JSON format in the textarea
     * Parses JSON data and applies it to the form fields
     */
    importDataFromJson() {
        const jsonText = $('#Data_Import').val().trim();
        
        if (!jsonText) {
            showToast("❌", "Please enter JSON data in the textarea");
            return;
        }

        try {
            const data = JSON.parse(jsonText);
            
            // Check if data has the expected structure
            if (!data || typeof data !== 'object') {
                showToast("❌", "Invalid JSON format");
                return;
            }

            // Process the data and update form fields using the common function
            this.processDataAndUpdateFields(data, true);

            // Find all updated elements for database upload
            const updatedElements = [];
            const pathsAndValues = getPathsAndValues(data);

            $.each(Object.entries(pathsAndValues), (_, [path, value]) => {
                const $elem = $(`[fb-data="${path}"]`);
                if ($elem.length > 0) {
                    updatedElements.push($elem);
                }
            });

            // Upload the imported data to database
            if (updatedElements.length > 0) {
                this.uploadData(updatedElements);
                showToast("✅", `Successfully imported ${updatedElements.length} fields`);
                
                // Clear the textarea after successful import
                $('#Data_Import').val('');
            } else {
                showToast("⚠️", "No matching fields found for the imported data");
            }

        } catch (error) {
            console.error("JSON parsing error:", error);
            showToast("❌", "Invalid JSON format: " + error.message);
        }
    }

    /**
     * Remove score history events when score is decreased
     * This maintains accurate event history for undo functionality
     * @param {string} team - Team identifier ('a' or 'b')
     * @param {number} newScore - The new score value
     */
    removeScoreHistoryEvents(team, newScore) {
        const reversedHistory = this.event_history.slice().reverse();
        $.each(reversedHistory, (index, event) => {
            if (event.type === 'score' && event.team === team && event.score > newScore) {
                this.event_history.splice(this.event_history.length - 1 - index, 1);
                return false; // break the loop
            }
        });
    }

    /**
     * Fetch and process live data from Firebase
     * Handles different data types: event history, admin settings, team colors, and general values
     */
    async insertLiveData() {
        console.log("inserting live data for channel ", this.channel);

        // Receive data from firebase
        const data = await readData(this.channel);
        this.processDataAndUpdateFields(data);
    }

    /**
     * Process data object and update form fields
     * Common function used by both live data insertion and JSON import
     * @param {Object} data - Data object to process
     * @param {boolean} isImport - Whether this is an import operation (affects special handling)
     */
    processDataAndUpdateFields(data, isImport = false) {
        const pathsAndValues = getPathsAndValues(data);

        // Process each path and value
        $.each(Object.entries(pathsAndValues), (_, [path, value]) => {
            const $elem = $(`[fb-data="${path}"]`);

            if (path.includes('event_history')) {
                this.event_history = Array.isArray(value) ? value : [];
            } else if (path.includes('admin_settings')) {
                this.insertAdminSetting(path, value);
            } else if (path.includes('teams_info') && path.includes('color')) {
                this.insertColor($elem, path, value);
            } else if (path.includes('active_set')) {
                this.active_set = value;
            } else if (path.includes('first_serve_team')) {
                // Handle first serve team setting
                if ($elem.is('input') || $elem.is('select')) {
                    $elem.val(value);
                } else {
                    $elem.text(value);
                }
            } else if (path.includes('starting_team')) {
                // Handle starting team setting
                if ($elem.is('input') || $elem.is('select')) {
                    $elem.val(value);
                } else {
                    $elem.text(value);
                }
                
                // Update the selector if this is for the current set
                if (path.includes(`set_${this.active_set}`)) {
                    this.updateStartingTeamSelector();
                }
            } else if (path.includes('game_settings')) {
                // Handle game settings (winning score, max sets, hardcap, etc.)
                const settingKey = path.split('.').pop();
                this.gameSettings[settingKey] = Number(value);

                // Update the UI
                if ($elem.is('input') || $elem.is('select')) {
                    $elem.val(value);
                } else {
                    $elem.text(value);
                }
            } else {
                // Set value based on element type
                this.setElementValue($elem, value);
            }
        });
    }

    /**
     * Set value on an element based on its type
     * @param {jQuery} $elem - Element to update
     * @param {*} value - Value to set
     */
    setElementValue($elem, value) {
        if ($elem.is('input[type="checkbox"]')) {
            $elem.prop('checked', value === 1 || value === true);
        } else if ($elem.is('input[type="color"]')) {
            $elem.val(value);
        } else if ($elem.is('input') || $elem.is('select')) {
            $elem.val(value);
        } else {
            $elem.text(value);
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
        var color = value;
        var brightness = getColorBrightness(rgb2hex(value));

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
        $.each(elemList, (_, elem) => {
            const $elem = $(elem);
            const fbDataAttr = $elem.attr("fb-data");
            
            if (!fbDataAttr) return;

            // Get value based on element type
            const value = $elem.is(":checkbox") ? ($elem.is(":checked") ? 1 : 0) : $elem.val();

            // Create database path
            const dbSelector = fbDataAttr.replace(/\./g, '/');
            const pathToVariable = `/match-${this.channel}/${dbSelector}`;

            // Convert to integer for score and active_set paths, but not for starting_team or admin_settings
            let finalValue = value;
            if ((pathToVariable.includes('score') || pathToVariable.includes('active_set')) && 
                !pathToVariable.includes('starting_team') && 
                !pathToVariable.includes('admin_settings')) {
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
        console.log("uploaded data to firebase", newData);
    }

    /**
     * Get all played sets (sets before the current active set)
     * @returns {Array} Array of jQuery set elements
     */
    getPlayedSets() {
        const playedSets = [];
        $.each(this.$sets, (i, set) => {
            if (i + 1 < this.active_set) {
                playedSets.push(set);
            }
        });
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
     * Calculate total sets won by a team
     * @param {string} team - Team identifier ('a' or 'b')
     * @returns {number} Number of sets won
     */
    getSetScore(team) {
        let setScore = 0;
        const playedSets = this.getPlayedSets();
        
        $.each(playedSets, (i, set) => {
            if (this.setWinner(i + 1) === team) {
                setScore += 1;
            }
        });

        return setScore;
    }

    updateSets() {
        this.$setCounter.val(this.active_set);
        this.updateSetsVisibility();
        this.updateSetWinners();
    }

    updateSetsVisibility() {
        // The counter (setNumber) should be local to each group of set elements,
        // i.e., for each parent element containing a group of .set elements, the counter restarts.
        // We'll iterate over each parent group, then over its .set children.

        // Find all unique parent elements that contain .set elements
        const setGroups = [];
        this.$sets.each(function () {
            const parent = $(this).parent()[0];
            if (parent && !setGroups.includes(parent)) {
                setGroups.push(parent);
            }
        });

        setGroups.forEach((groupElem) => {
            const $groupSets = $(groupElem).children('.set');
            $groupSets.each((i, set) => {
                const $set = $(set);
                const setNumber = i + 1; // Counter is local to this group

                $set.hide().removeClass('active completed');

                if (setNumber <= this.active_set) {
                    $set.show();
                    if (setNumber === this.active_set) {
                        $set.addClass('active');
                    }
                }

                // Add 'completed' class if the set is already decided
                if (this.setWinner && this.setWinner(setNumber) != null) {
                    $set.addClass('completed');
                }
            });
        });
    }

    updateSetWinners() {
        const $scoreElems = this.$html_frame.find('[fb-data*="score"]');

        $.each($scoreElems, (i, elem) => {
            const $scoreElem = $(elem);
            const details = this.getScoreElemDetails($scoreElem);
            let { team, set } = details

            if (!details || (details.set == this.active_set && this.setWinner(details.set) == null)) {
                $scoreElem.removeClass('winner loser');
                return;
            }

            const winner = this.setWinner(details.set);
            if (winner == details.team) {
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

    /**
     * Get the team that should be serving based on new rules
     * Serve alternates every 2 serves regardless of point outcome
     * In overtime mode (when winning score is reached but 2-point margin not met), serve changes after every point
     * @returns {Object|null} Object with team and serve number, or null if no serve data
     */
    getServingTeam() {
        // Get the starting team for this set from database
        const startingTeam = this.getStartingTeam(this.active_set);
        if (!startingTeam) return null;
        
        // Count total points in this set
        const totalPoints = this.getTotalPointsInSet(this.active_set);
        
        // Check if we're in overtime mode
        const isOvertime = this.isInOvertime(this.active_set);
        
        if (isOvertime) {
            // Overtime rules: serve changes after every point
            const servingTeam = totalPoints % 2 === 0 ? startingTeam : (startingTeam === 'a' ? 'b' : 'a');
            return {
                team: servingTeam,
                serveNumber: 1, // Always single serve in overtime
                isOvertime: true
            };
        }
        
        // Normal rules: first serve is single, then alternates every 2 points
        let servingTeam, serveNumber;
        if (totalPoints === 0) {
            servingTeam = startingTeam;
            serveNumber = 1;
        } else {
            const servesAfterFirst = totalPoints - 1;
            const serveGroup = Math.floor(servesAfterFirst / 2);
            const isStartingTeamServe = serveGroup % 2 === 0;
            servingTeam = isStartingTeamServe ? (startingTeam === 'a' ? 'b' : 'a') : startingTeam;
            serveNumber = (servesAfterFirst % 2) + 1;
        }
        
        return {
            team: servingTeam,
            serveNumber: serveNumber,
            isOvertime: false
        };
    }

    /**
     * Check if a set is in overtime mode
     * Overtime occurs when winning score is reached but 2-point margin is not met
     * OR when hardcap is reached by either team
     * @param {number} set - Set number to check (defaults to active set)
     * @returns {boolean} True if set is in overtime
     */
    isInOvertime(set = this.active_set) {
        const scoreA = this.getScore(set, 'a');
        const scoreB = this.getScore(set, 'b');
        
        // Check if hardcap is reached by either team
        if (scoreA >= this.gameSettings.hardcap || scoreB >= this.gameSettings.hardcap) {
            return true;
        }
        
        // Check if winning score is reached
        if (scoreA >= this.gameSettings.win_points || scoreB >= this.gameSettings.win_points) {
            // Check if 2-point margin is met
            const scoreDifference = Math.abs(scoreA - scoreB);
            return scoreDifference < this.gameSettings.min_win_margin;
        }
        
        return false;
    }

    /**
     * Check if a set is won by a team
     * Takes into account overtime rules (2-point margin required or hardcap reached)
     * @param {number} set - Set number to check (defaults to active set)
     * @returns {string|null} Team identifier ('a', 'b') or null if set not won
     */
    setWinner(set = this.active_set) {
        const scoreA = this.getScore(set, 'a');
        const scoreB = this.getScore(set, 'b');
        
        // Check if hardcap is reached by either team
        if (scoreA >= this.gameSettings.hardcap || scoreB >= this.gameSettings.hardcap) {
            return scoreA > scoreB ? 'a' : 'b';
        }
        
        // Check if winning score is reached
        if (scoreA >= this.gameSettings.win_points || scoreB >= this.gameSettings.win_points) {
            const scoreDifference = Math.abs(scoreA - scoreB);
            
            // Check if 2-point margin is met
            if (scoreDifference >= this.gameSettings.min_win_margin) {
                return scoreA > scoreB ? 'a' : 'b';
            }
        }
        
        return null;
    }

    /**
     * Get the starting player for a specific set
     * @param {number} set - Set number (1-7), defaults to active set
     * @returns {string|null} Player identifier ('a', 'b', 'c', 'd') or null if not set
     */
    getStartingPlayer(set = this.active_set) {
        const startingTeamData = this.$html_frame.find(`[fb-data="score.set_${set}.starting_team"]`).first();
        if (startingTeamData.length > 0) {
            const value = startingTeamData.is('input') ? startingTeamData.val() : startingTeamData.text();
            if (value && (value === 'a' || value === 'b' || value === 'c' || value === 'd')) {
                return value;
            }
        }
        return null;
    }

    /**
     * Get the team that has the starting serve for a specific set
     * @param {number} set - Set number (1-7), defaults to active set
     * @returns {string|null} Team identifier ('a' or 'b') or null if not set
     */
    getStartingTeam(set = this.active_set) {
        const startingPlayer = this.getStartingPlayer(set);
        if (startingPlayer) {
            // Map player values to team values
            return (startingPlayer === 'a' || startingPlayer === 'b') ? 'a' : 'b';
        }
        return null;
    }

    /**
     * Count total points in a specific set
     * @param {number} set - Set number (1-7), defaults to active set
     * @returns {number} Total number of points
     */
    getTotalPointsInSet(set = this.active_set) {
        const scoreA = this.getScore(set, 'a');
        const scoreB = this.getScore(set, 'b');
        return scoreA + scoreB;
    }

    updateIndicators() {
        this.updateServeIndicator();
    }

    updateServeIndicator() {
        const serveInfo = this.getServingTeam();
        const $serverIndicators = $('.serve_indicator');
        
        // Check if set is already won - if so, hide all serve indicators
        const setWinner = this.setWinner();
        if (setWinner) {
            $serverIndicators.removeClass('active serve_1 serve_2 single_serve overtime');
            $serverIndicators.hide();
            return;
        }
        
        // Show serve indicators if set is not won
        $serverIndicators.show();
        
        // Remove all active classes first
        $serverIndicators.removeClass('active serve_1 serve_2 single_serve overtime');
        
        if (serveInfo) {
            const { team, serveNumber, isOvertime } = serveInfo;
            const $teamIndicators = $serverIndicators.filter(`.team_${team}`);
            
            // Add active class and serve number class
            $teamIndicators.addClass('active');

            const totalPoints = this.getTotalPointsInSet();
            if (totalPoints === 0 || isOvertime) {
                $teamIndicators.addClass('single_serve');
            }
            
            if (serveNumber === 1) {
                $teamIndicators.addClass('serve_1');
            } else if (serveNumber === 2) {
                $teamIndicators.addClass('serve_2');
            }
        }
    }

    updateSettings() {
        // Update checkbox states
        $.each(Object.entries(this.settings), (_, [key, value]) => {
            const $settingsEntry = this.$settingsEntries.filter(`[fb-data*="${key}"]`);
            $settingsEntry.prop('checked', value === 1);
        });

        // Update toggle switch states
        $.each(Object.entries(this.settings), (_, [key, value]) => {
            const $toggleSwitch = $(`.toggle-switch input[fb-data*="${key}"]`).closest('.toggle-switch');
            $toggleSwitch.toggleClass('active', value === 1);
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

        $.each(this.user.channels, (i, channel) => {
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
        $.each(this.event_history.slice().reverse(), (i, event) => {
            if (event.type === 'reset') {
                startIndex = this.event_history.length - 1 - i;
                return false; // break the loop
            }
        });

        const slicedEventHistory = this.event_history.slice(startIndex + 1);
        return slicedEventHistory.filter(event => 
            event.type === 'score' && 
            event.set === set && 
            event.team && 
            typeof event.team === 'string' &&
            event.score !== undefined
        );
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

        $.each(slicedEventHistory, (i, event) => {
            if (event.type === 'score' && event.team && typeof event.team === 'string') {
                if (event.team.toLowerCase() === team.toLowerCase()) {
                    lastScore = Number(event.score);
                }
                teamPointsList.push(lastScore);
            }
        });

        return teamPointsList;
    }

    /**
     * Get the team that was serving at a specific point in the score history
     * @param {number} pointIndex - Index of the point (0-based)
     * @param {number} set - Set number (defaults to active set)
     * @returns {string|null} Team identifier ('a' or 'b') or null if not available
     */
    getServingTeamAtPoint(pointIndex, set = this.active_set) {
        const startingTeam = this.getStartingTeam(set);
        if (!startingTeam) return null;
        
        // Check if we're in overtime mode at this point
        const scoreA = this.getScore(set, 'a');
        const scoreB = this.getScore(set, 'b');
        const isOvertime = this.isInOvertime(set);
        
        if (isOvertime) {
            // Overtime rules: serve changes after every point
            return pointIndex % 2 === 0 ? startingTeam : (startingTeam === 'a' ? 'b' : 'a');
        }
        
        // Normal rules: first serve is single, then alternates every 2 points
        if (pointIndex === 0) {
            return startingTeam;
        } else {
            const servesAfterFirst = pointIndex - 1;
            const serveGroup = Math.floor(servesAfterFirst / 2);
            const isStartingTeamServe = serveGroup % 2 === 0;
            return isStartingTeamServe ? (startingTeam === 'a' ? 'b' : 'a') : startingTeam;
        }
    }

    /**
     * Update score history display with visual indicators
     * Shows score progression and active streaks for each team
     */
    updateScoreHistory() {
        $.each(this.$scoreHistoryContainer.find('.scores .team'), (i, container) => {
            const $container = $(container);
            const team = $container.attr('team');
            const scoresList = this.scoreHistoryToTeamPoints(this.getScoreHistory(), team);
            
            $container.empty();
            
            let streak = 0;
            $.each(scoresList, (i, score) => {
                const isActive = score > (i > 0 ? scoresList[i - 1] : 0);
                streak = isActive ? streak + 1 : 0;
                const status = isActive ? 'active' : '';
                
                // Calculate if this was a break point
                let breakAttribute = '';
                if (isActive) {
                    const servingTeam = this.getServingTeamAtPoint(i);
                    const isBreak = servingTeam && servingTeam !== team;
                    breakAttribute = isBreak ? ' break' : '';
                }
                
                const element = `<div class="score_item ${status}" streak="${streak}"${breakAttribute}>${score}</div>`;
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

