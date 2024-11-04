// import firebase config
import {
    get,
    ref,
    update
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";

import {
    db,
} from "../js/firebase_config.js";


// =========================================== Models ======================================= //

class User {
    constructor(username, password, channels = []) {
        this.username = username;
        this.password = password;
        this.isAuthenticated = true; // Benutzer ist angemeldet
        this.channels = channels;
        this.init();
    }

    init() {
        localStorage.setItem('currentUser', JSON.stringify(this)); // Speichern des Benutzers in localStorage
    }

    logout() {
        this.isAuthenticated = false;
        localStorage.clear();
        console.log(`${this.username} is now logged out.`);
        location.reload();
    }
}


class Scoreboard {
    // Konstruktor
    constructor(type = 'admin', $html_frame = $('#scoreboard'), channel, user = null) {
        this.type = type;
        this.user = user;
        // Frontend elements
        this.$html_frame = $html_frame;
        this.$channelInput = $('#channel');
        this.$scoreChangeButtons = $('.button[team][change]');
        this.$setChangeButtons = $('.set_controls_container .button');
        this.$scoreboardInputs = this.$html_frame.find($('input:not([type=submit]), textarea'));
        this.$setCounter = $('#Set_Count');
        this.$resetScoresButton = $('#reset_scores');
        this.$sets = $('.set');
        this.$setScoreCounterA = $('#a_sets_won');
        this.$setScoreCounterB = $('#b_sets_won');
        this.$activeScoreCounterA = $('#A_Score_Active');
        this.$activeScoreCounterB = $('#B_Score_Active');
        this.$teamScoreSwitch = $('#Show_Team_Score');
        this.$colorSwitch = $('#Show_Color');
        this.$playerNamesSwitch = $('#Show_Players');
        this.$logoutButton = $('#logout');
        // Stored variables
        this.channel = channel;
        this.show_player_names = 1;
        this.show_color = 1;
        this.show_team_score = 1;
        this.active_set = 1;
        this.data_interval;
        this.update_interval;
        // Init function
        this.init();
    }

    init() {
        console.log(this.type);
        this.initEventListeners();
        
        this.insertLiveData();

        this.update_interval = setInterval(() => {
            this.updateUI();
        }, 300);

        if (this.type == 'admin') {
            this.data_interval = setInterval(() => {
                this.insertLiveData();
            }, 600);
        } else {
            this.data_interval = setInterval(() => {
                this.insertLiveData();
            }, 300);
        }
    }

    updateUI() {
        this.updateSets();
        this.updateSetScore();
        this.updateTeamScore();
        this.updateActiveScore();
        this.updateColorIndicator();
        this.updatePlayerNames();
    }


    initEventListeners() {
        // Channel input dropdown listener
        this.$channelInput.change((event) => {
            this.channel = $(event.target).val();
            this.updateUI();
        });

        // upload local data as any input values changes
        this.$scoreboardInputs.on('input', (event) => {
            this.uploadData([event.target]);
        });

        // interaction for the score buttons
        this.$scoreChangeButtons.click((event) => {
            var $scoreButton = $(event.target);
            var $active_set_elem = $('.set.active'); // check which set is active - which determines which score will be changed
            var team = $scoreButton.attr('team'); // set the team based on the attribute on the button
            var change = Number($scoreButton.attr('change')); // set the change amount based on the attribute on the button

            var $score_elem = $active_set_elem.find(`.score[fb-data*="team_${team}"]`)

            var score_now = Number($($score_elem).val()); // check score right now
            if (score_now + change >= 0) {
                $score_elem.val(score_now + change); // update to new score
                this.uploadData([$score_elem]); // upload the new score
            }
        });

        // interaction for the set buttons
        this.$setChangeButtons.click((event) => {
            var $setButton = $(event.target);
            var change = Number($setButton.attr('change'));

            var set_now = Number(this.$setCounter.val()); // check set right now
            if (set_now + change > 0 && set_now + change <= 7) {
                this.active_set = set_now + change;
                this.updateSets();
                this.uploadData([this.$setCounter]); // upload the new set
            }
        });

        this.$teamScoreSwitch.click((event) => {
            this.show_team_score = this.$teamScoreSwitch.prop("checked") == true ? 1 : 0;
            this.updateTeamScore();
            this.uploadData($(event.target));
        });

        this.$playerNamesSwitch.click((event) => {
            this.show_player_names = this.$playerNamesSwitch.prop("checked") == true ? 1 : 0;
            this.updatePlayerNames();
            this.uploadData($(event.target));
        });

        this.$colorSwitch.click((event) => {
            this.show_color = this.$colorSwitch.prop("checked") == true ? 1 : 0;
            this.updateColorIndicator();
            this.uploadData($(event.target));
        });

        // function for the reset scores button
        this.$resetScoresButton.click((event) => {
            $.each($('[fb-data*="score"]'), function (i, elem) {
                $(elem).val(0);
            });

            this.$setCounter.val(1); // reset the set count

            this.uploadData();
        });

        // logout button
        this.$logoutButton.click(function () {
            localStorage.clear();
            location.reload();
        })
    }

    async insertLiveData() {
        console.log("inserting live data for channel ", this.channel);

        // receive data from firebase
        var data = await readData(this.channel);
        var pathsAndValues = getPathsAndValues(data);

        let self = this;
        // go through values and insert them
        $.each(pathsAndValues, function (path, value) {
            var $elem = $('[fb-data="' + path + '"]'); // Element mit passendem fb-data Attribut finden

            if (path.includes('admin_settings')) {
                self.insertAdminSetting(path, value);
            } else if (path.includes('team') && path.includes('color')) {
                self.insertColor($elem, path, value);
            } else if (path.includes('active_set')) {
                self.active_set = value;
            } else {
                if ($elem.is('input')) {
                    $elem.val(value);
                } else {
                    $elem.text(value);
                }
            }
            
        });
    }

    async insertAdminSetting(path, value) {
        if (path.includes('show_color')) {
            this.show_color = value;
        } else if (path.includes('show_group_score')) {
            this.show_team_score = value;
        } else if (path.includes('show_player_names')) {
            this.show_player_names = value;
        }
    }

    async insertColor($elem, path, value) {
        var color = value;
        var brightness = getColorBrightness(rgb2hex(value));

        if (brightness <= 23) { // clip at dark values to prevent complete black
            color = '#222222';
        }

        if (path.includes('team_a')) {
            var team = 'a';
        } else if (path.includes('team_b')) {
            var team = 'b';
        }

        if ($elem.is('input')) {
            $elem.val(value);
        } else {
            $('html').css("--" + team.toUpperCase() + "_Color", color) // Add color to css variable

            var $team_elems = $(`[fb-data*="team_${team}"]`); // All elements from this team

            if (brightness >= 230) {
                $elem.addClass('light');
                $team_elems.addClass('light');
            } else if (brightness >= 150) {
                $elem.removeClass('light');
                $team_elems.addClass('light');
            } else {
                $elem.removeClass('light');
                $team_elems.removeClass('light');
            }
        }
    }

    async uploadData(elemList) {
        // check if selected channel is allowed
        if (this.user && this.channel && this.channel in this.user.channels) {
            // upload all if there are no specific elements
            if (typeof elemList == 'undefined') {
                elemList = $("*[fb-data]");
            }

            // upload all data to firebase
            self = this;
            const newData = {};
            $.each($(elemList), function (i, elem) {
                let value;
        
                // Überprüfen, ob das Element eine Checkbox ist
                if ($(elem).is(":checkbox")) {
                    value = $(elem).is(":checked") ? 1 : 0; // Wert auf 1 oder 0 setzen
                } else {
                    value = $(elem).val(); // Wert des Elements abrufen
                }
        
                // Wenn der Wert nicht leer ist, weiter verarbeiten
                if (value !== "") {
                    // Erstelle einen Pfad basierend auf dem fb-data Attribut
                    let fbDataAttr = $(elem).attr("fb-data");
                    if (fbDataAttr) {
                        // Ersetze die Punkte im fb-data Attribut mit einem Schrägstrich
                        let dbSelector = fbDataAttr.replace(/\./g, '/');
                        // Erstelle den vollständigen Pfad für Firebase
                        let path_to_variable = `/match-${self.channel}/${dbSelector}`;
        
                        // Überprüfen, ob der Wert in einen Integer umgewandelt werden kann
                        if (path_to_variable.includes('score') || path_to_variable.includes('active_set')) {
                            try {
                                value = parseInt(value);
                            } catch (error) {
                                console.error(value, " can't be converted to integer");
                            }
                        }
        
                        // Füge den Pfad und den Wert zum newData Objekt hinzu
                        newData[path_to_variable] = value;
                    }
                }
            });

            writeData(newData);

        } else if (channel) {
            showToast("❌", "You're not authenticated for this channel")
        }
    }

    getPlayedSets() {
        let playedSets = [];
        let self = this;
    
        $.each(self.$sets, function (i, set) {
            if (i + 1 < self.active_set) {
                playedSets.push(set);
            }
        });
    
        return playedSets;
    }

    getScoreElem(set, team) {
        return $(this.$sets[set - 1]).find(`[fb-data*="score"][fb-data*="team_${team}"]`);
    }

    getScoreElemDetails($score_elem) {
        const fbDataAttr = $score_elem.attr('fb-data');
        
        if (!fbDataAttr) {
            return null; // Rückgabe, falls das Attribut nicht vorhanden ist
        }
        
        // Prüfe, welches Team im Attribut enthalten ist
        const team = fbDataAttr.includes('team_a') ? 'a' : (fbDataAttr.includes('team_b') ? 'b' : null);
        
        // Extrahiere die Set-Nummer mit einem regulären Ausdruck
        const setMatch = fbDataAttr.match(/set_(\d+)/);
        const set = setMatch ? setMatch[1] : null;
    
        // Gebe Team und Set-Nummer als Objekt zurück
        return {
            team: team,
            set: set
        };
    }

    getScore(set, team) {
        var $score_elem = this.getScoreElem(set, team);
        var score = Number($score_elem.text());
        return score;
    }

    getWinner(set) {
        var score_a = this.getScore(set, 'a');
        var score_b = this.getScore(set, 'b');
        if (score_a > score_b) {
            return 'a';
        } else if (score_b > score_a) {
            return 'b';
        } else {
            return null;
        }
    }

    getSetScore(team) {
        var set_score = 0;
        let self = this;

        $.each((self.getPlayedSets()), function (i, set) {
            if (self.getWinner(i+1) == team) {
                set_score += 1;
            }
            
        });

        return set_score
    }

    updateSets() {
        this.$setCounter.val(this.active_set);
        this.updateSetsVisibility();
        this.updateSetWinners();
    }

    updateSetsVisibility() {
        let self = this;
        $.each(self.$sets, function (i, set) {
            var $set = $(set);
            $set.hide();
            $set.removeClass('active');
            if (i + 1 <= self.active_set) {
                $set.show();
                if (i + 1 == self.active_set) {
                    $set.addClass('active');
                }
            }
        });
    }

    updateSetWinners() {
        let self = this;
        var $score_elems = $(self.$html_frame).find(`[fb-data*="score"]`);
        
        $.each($score_elems, function (i, elem) {
            var $score_elem = $(elem);
            var se_details = self.getScoreElemDetails($score_elem);
            if (se_details.set != self.active_set) {
                if (se_details.team == self.getWinner(se_details.set)) {
                    $score_elem.removeClass('loser');
                    $score_elem.addClass('winner');
                } else {
                    $score_elem.removeClass('winner');
                    $score_elem.addClass('loser');
                }
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

    updateTeamScore() {
        if (this.show_team_score == 1) {
            $('.group_score').show();
            $('.group-indicator').show();
            this.$teamScoreSwitch.prop("checked", true);
        } else {
            $('.group_score').hide();
            $('.group-indicator').hide();
            this.$teamScoreSwitch.prop("checked", false);
        }
    }

    updateColorIndicator() {
        if (this.show_color == 1) {
            $('.color-indicator').show();
            this.$colorSwitch.prop("checked", true);
        } else if (this.show_color == 0) {
            $('.color-indicator').hide();
            this.$colorSwitch.prop("checked", false);
        }
    }

    updatePlayerNames() {
        if (this.show_player_names == 1) {
            $('body').attr('players', 'show');
            $('.players').show();
            this.$playerNamesSwitch.prop("checked", true);
        } else if (this.show_player_names == 0) {
            $('body').attr('players', 'hidden');
            $('.players').hide();
            this.$playerNamesSwitch.prop("checked", false);
        }
    }

    updateAvailableChannels() {
        let self = this;
        self.$channelInput.empty();
    
        if (self.user) {
            let channelExists = false;
    
            $.each(self.user.channels, function (i, c) {
                self.$channelInput.append($('<option></option>').val(c).html(c));
                if (c === self.channel) {
                    channelExists = true;
                }
            });
    
            if (channelExists) {
                self.$channelInput.val(self.channel);
            } else {
                self.channel = self.user.channels[0];
                self.$channelInput.val(self.channel);
                setTimeout(() => {
                    showToast("❌", `Due to authentification the channel got changed to "${self.user.channels[0]}".`, 2000); 
                }, 2200);
            }
        }
    }
}



// =========================================== Page Load ======================================= //


// initialize variables for global usage
var loggedInUser;
var scoreboard;
var $banner, $logoutButton;


$(document).ready(async function () {
    $banner = $('.banner');
    $logoutButton = $('button#logout');

    // Kanalwahl aus URL-Parameter
    var urlParams = new URLSearchParams(window.location.search);
    var url_channel = urlParams.get('channel');
    var channel_selection = url_channel || 1;

    // Type of board
    if (window.location.href.includes("board")) {
        var type = 'board';
    } else {
        var type = 'admin';
    }

    // Scoreboard sofort erstellen
    scoreboard = new Scoreboard(type, $('#scoreboard'), channel_selection);

    // Warten auf die Authentifizierung und den Benutzer setzen
    if (type == 'admin') {
        await handleAuthentication(scoreboard);
    }

    // Toast-Nachricht schließen
    $('.banner_close_button').click(function () {
        $banner.fadeOut(100);
    });
});



// =========================================== Old Functions ======================================= //


// function initialize() {

//     // read URL params for channel selection
//     var $channel_input = $("#channel");
//     var urlParams = new URLSearchParams(window.location.search);
//     var url_id = urlParams.get('channel');

//     // change channel on first load
//     console.log(url_id);
//     page_channel = url_id || auth_channels[0];
//     console.log(page_channel);
//     console.log(auth_channels);
//     if (!auth_channels.includes(page_channel)) {
//         page_channel = auth_channels[0];
//         console.log(page_channel);
//         showToast("🎚️", `The selected channel is not available for your account - you got redirecte to channel ${page_channel}`)
//     }
//     // set authenticated channels in selector
//     $channel_input.empty();
//     $.each(auth_channels, function (i, c) {
//         $channel_input.append($('<option></option>').val(c).html(c));
//     })
//     // set select in admin page to active channel
//     if (page_type == "admin") {
//         $channel_input.val(page_channel);
//     }

//     // insert live data on first load to get up to date
//     insert_live_data(page_type);

//     // auto reload for live data input
//     if (page_type == "board") {
//         setInterval(function () {
//             reload();
//         }, 250); // request every 1/4 seconds
//     } else if (page_type == "admin") {
//         setInterval(function () {
//             update_set_visibilities_and_counter();
//             update_team_counter_visibility();
//             update_color_indicator_visibility();
//             update_player_names_visibility();
//         }, 250); // request every 1/4 seconds
//     }

//     // Channel input dropdown listener
//     $channel_input.change(function () {
//         page_channel = $(this).val();
//         // showToast("🎚️", `Channel successfully changed to ${page_channel} - data is loaded`, 1500)
//         reload();
//     });

//     // upload local data as any input values changes
//     $('input:not([type=submit]), textarea').on('input', function () {
//         write_data([this]);
//     });

//     // interaction for the score buttons
//     $('.controls .button').click(function () {
//         var $button = $(this);
//         var active_set_elem = $(
//             '.set.active'); // check which set is active - which determines which score will be changed
//         var change = Number($button.attr(
//             'change')); // set the change amount based on the attribute on the button

//         var team;
//         // check for which team the button is
//         if ($button.hasClass('team_a')) {
//             team = 0;
//         } else {
//             team = 1;
//         }

//         var score_elem = active_set_elem.find('.score')[team] // find correct score element based on team
//         var score_now = Number($(score_elem).val()); // check score right now
//         if (score_now + change >= 0) {
//             $(score_elem).val(score_now + change); // update to new score
//             write_data([score_elem]); // upload the new score
//         }
//     });

//     // interaction for the set buttons
//     $('.set_controls_container .button').click(function () {
//         var $button = $(this);
//         var $set_counter = $('#Set_Count');
//         var change = Number($button.attr('change'));

//         var set_now = Number($set_counter.val()); // check set right now
//         if (set_now + change > 0 && set_now + change <= 7) {
//             $set_counter.val(set_now + change); // update to new set
//             write_data([$set_counter]); // upload the new set
//         }
//     });

//     // function for the reset scores button
//     $('#reset_scores').click(function () {
//         // reset all score values
//         $.each($("*[id]"), function (i, elem) {
//             var id = $(elem).attr("id");
//             if (id.toLowerCase().includes('score') && !id.toLowerCase().includes(
//                     'show') && !id.toLowerCase().includes('team')) {
//                 $(elem).val(0);
//             }
//         });

//         // reset the set count
//         $('#Set_Count').val(1);

//         // upload the reset changes
//         write_data();
//     });

//     // logout button
//     $('#logout').click(function () {
//         localStorage.clear();
//         location.reload();
//     })
// }


// async function handleAuthentication() {
//     // console.log("active session: " + active_session());

//     $('.wrapper').hide();
//     $('.settings-container').hide();

//     await login_old(active_session()[0], active_session()[1], true);

//     // console.log(authenticated);

//     if (authenticated == 0) {
//         // prepare select
//         var $select = $('select#account');
//         $select.append($('<option></option>').val("").html("-- Please select --"));
//         // insert users from db
//         var users = await getUsers();
//         // get users from db
//         $.each((users), function (name, data) {
//             var username = data["display_name"];
//             $select.append($('<option></option>').val(name).html(username));
//         });
//         // show prepared auth
//         $('#auth').show();

//         $('form#login').on('submit', function (e) {
//             e.preventDefault();
//             var username = $('#auth #account').val();
//             var password = $('#auth #password').val();
//             login_old(username, password);
//         });
//     }
// }


// async function login_old(username, password, mute) {
//     // get users from db
//     var users = await getUsers();
//     // console.log(users, username);
//     // try login
//     if (username == null || username == "") {
//         if (!mute) {
//             showToast("🧍‍♂️", "You have to select a user")
//         }
//     } else {
//         var db_password = users[username]["password"];
//         if (password == db_password) {
//             $('#auth').hide();
//             $('.wrapper').show();
//             $('.settings-container').show();
//             authenticated = 1;
//             auth_channels = users[username]["channels"].split(',');
//             $logoutButton.html(`${users[username]["display_name"]} - Logout`);

//             initialize();

//             if (!mute) {
//                 showToast("✅", `Successfully logged in - you're account got the channels ${auth_channels} - you got redirected to channel ${page_channel}`)
//             }
//             localStorage.setItem('username', username);
//             localStorage.setItem('password', password);
//         } else {
//             showToast("❌", "The entered password is wrong");
//         }
//     }
// }


// function active_session() {
//     var username = localStorage.getItem("username");
//     var password = localStorage.getItem("password");
//     return [username, password]
// }


// function channel_authenticated() {
//     if (auth_channels.includes(page_channel)) {
//         return true
//     } else {
//         showToast("❌", "You're not authenticated for this channel")
//         return false
//     }
// }


// {
//     "active_set": 1,
//     "admin_settings.show_color": 1,
//     "admin_settings.show_group_score": 0,
//     "admin_settings.show_player_names": 1,
//     "format": "BO3 to 21 no HC",
//     "phase": "Scoreboard delayed",
//     "score.set_1.team_a_score": 1,
//     "score.set_1.team_b_score": 0,
//     "score.set_2.team_a_score": 0,
//     "score.set_2.team_b_score": 0,
//     "score.set_3.team_a_score": 0,
//     "score.set_3.team_b_score": 0,
//     "score.set_4.team_a_score": 0,
//     "score.set_4.team_b_score": 0,
//     "score.set_5.team_a_score": 0,
//     "score.set_5.team_b_score": 0,
//     "score.set_6.team_a_score": 0,
//     "score.set_6.team_b_score": 0,
//     "score.set_7.team_a_score": 0,
//     "score.set_7.team_b_score": 0,
//     "score.squad_score.team_a_score": 2,
//     "score.squad_score.team_b_score": 1,
//     "teams_info.team_a.color": "#008080",
//     "teams_info.team_a.name": "Eisenträger/Siemer",
//     "teams_info.team_a.player_1_name": "Levi V",
//     "teams_info.team_a.player_2_name": "Yosha V",
//     "teams_info.team_a.player_names": "Lukas Eisenträger & Paul Siemer",
//     "teams_info.team_b.color": "#85fada",
//     "teams_info.team_b.name": "Zwaffle everyone",
//     "teams_info.team_b.player_1_name": "Fabian C",
//     "teams_info.team_b.player_2_name": "Josha L",
//     "teams_info.team_b.player_names": "L. Vandale & R. Florinda",
//     "tournament_name": "STS CHAMPIONSHIP 2024 - ROUND OF 16"
// }

// function that inserts the data from the database in the html
// async function insert_live_data_old() {
    // console.log("inserting live data for channel ", activeScoreboard.channel);

    // // receive data from firebase
    // var data = await readData();
    // var pathsAndValues = getPathsAndValues(data);
    // console.log(pathsAndValues)

    // $.each((pathsAndValues), function (keys, value) {

    //     // convert cssSelector to string
    //     var cssSelector;
    //     if (keys.includes(',')) {
    //         var keysList = keys.split(',');
    //         cssSelector = keysList.map(key => `[fb-data="${key}"]`).join(' ');
    //     } else {
    //         cssSelector = `[fb-data="${keys}"]`;
    //     }

    //     // get according element in html
    //     var $elem = $(cssSelector);

    //     // get for which team the value is for
    //     var team;
    //     if (cssSelector.includes('team_a')) {
    //         team = "a";
    //     } else {
    //         team = "b";
    //     }

    //     if (cssSelector.includes('active_set')) {
    //         active_set = value;
    //         $elem.val(active_set);
    //     } else if (cssSelector.includes('show_color')) {
    //         show_color = value;
    //     } else if (cssSelector.includes('show_group_score')) {
    //         show_team_score = value;
    //     } else if (cssSelector.includes('show_player_names')) {
    //         show_player_names = value;
    //     } else {
    //         if (type == "board") {
    //             if (cssSelector.includes('color')) {
    //                 var $team_div = $elem.closest(".team");
    //                 var brightness = getColorBrightness(rgb2hex(value));

    //                 if (brightness <= 23) {
    //                     value = "#222222";
    //                 }
    //                 $('html').css("--" + team.toUpperCase() + "_Color", value)
    //                 // add "light" class if color is light to preserve readabiltiy

    //                 if (brightness >= 230) {
    //                     $elem.addClass('light');
    //                     $team_div.addClass('light');
    //                 } else if (brightness >= 150) {
    //                     $elem.removeClass('light');
    //                     $team_div.addClass('light');
    //                 } else {
    //                     $elem.removeClass('light');
    //                     $team_div.removeClass('light');
    //                 }
    //             } else if (cssSelector.includes(`set_${active_set}`)) {
    //                 $elem.text(value);
    //                 if (cssSelector.includes('team_a')) {
    //                     $('#A_Score_Active').text(value);
    //                 } else if (cssSelector.includes('team_b')) {
    //                     $('#B_Score_Active').text(value);
    //                 }
    //             } else {
    //                 $elem.text(value);
    //             }
    //         } else if (type == "admin") {
    //             $elem.val(value);
    //         }

    //     }

    // });
// }

// ======= End ====== //

// ========================================= Data Functions ===================================== //


async function readData(channel) {
    var matchRef = ref(db, `match-${channel}`);
    var matchData = await get(matchRef);
    var matchDataObject = matchData.val(); // Assuming your data is an object
    return matchDataObject;
}


async function getUsers() {
    var usersData = await get(ref(db, 'users'));
    var usersDataObject = usersData.val(); // Assuming your data is an object
    return usersDataObject;
}


async function writeData(newData) {
    update(ref(db), newData)
        .then(function () {
            console.log("User data updated successfully.");
        })
        .catch(function (error) {
            console.error("Error updating user data:", error);
        });
}


// ========================================= Global Functions ===================================== //


async function handleAuthentication(scoreboard) {
    return new Promise(async (resolve) => {
        var storedUser = localStorage.getItem('currentUser');

        if (storedUser) {
            // Prüfen, ob ein Benutzer im LocalStorage gespeichert ist
            var userData = JSON.parse(storedUser);
            loggedInUser = await login(userData.username, userData.password || "");

            if (loggedInUser) {
                console.log(loggedInUser)
                // Benutzer erfolgreich authentifiziert, dem Scoreboard zuweisen
                scoreboard.user = loggedInUser;
                scoreboard.updateAvailableChannels();
                resolve(loggedInUser);
            }
        }

        // Falls kein Benutzer im LocalStorage vorhanden oder Login fehlschlägt
        if (!loggedInUser) {
            $('#auth').show();

            // Login-Formular für Benutzeranmeldung
            $('form#login').on('submit', async function (e) {
                e.preventDefault();
                var username = $('#auth #username').val();
                var password = $('#auth #password').val();
                
                loggedInUser = await login(username, password);

                if (loggedInUser) {
                    $('#auth').hide();
                    // Benutzer setzen und Scoreboard aktualisieren
                    scoreboard.user = loggedInUser;
                    scoreboard.updateAvailableChannels();
                    resolve(loggedInUser);
                }
            });
        }
    });
}


async function signUp(username, email, password) {
    const users = await getUsers();
    if (users && users[username]) {
        showToast("❌", "Username already exists");
        return null;
    }

    try {
        await set(ref(db, `users/${username}`), {
            email: email,
            password: password // Speichern des Passworts (nicht gehasht)
        });
        console.log(`User ${username} registered with email ${email}.`);
        return new User(username, email);
    } catch (error) {
        console.error("Error during registration:", error);
        showToast("⚠️", "Registration failed: " + error.message);
        throw error;
    }
}


async function login(username, inputPassword) {
    const users = await getUsers();

    if (users && users[username]) {
        const user = users[username];
        if (inputPassword === user.password) {
            console.log(`${username} is now logged in.`);
            var auth_channels = users[username]["channels"].split(',');
            loggedInUser = new User(username, user.password, auth_channels);
            $('#auth').hide();
            $logoutButton.html(`${users[username]["display_name"]} - Logout`);           
            showToast("✅", `Successfully logged in as ${users[username]["display_name"]}`, 2000);
        } else {
            showToast("❌", "The entered credentials are wrong, please try it again");
            return null;
        }
    } else {
        // Benutzer existiert nicht, Benutzer zur Registrierung auffordern
        showToast("🆕", `User not found. You first have to register`);
        return null;
    }

    return loggedInUser || null
}


function showToast(emoji, message, duration) {
    try {
        // set the animation-duration of the cooldown ring to the show duration so that it shows how long the banner will stay
        var showDuration = duration || 5000;
        $banner.find('.icon').html(emoji);
        $banner.find('.progress-ring_circle').css('animation-duration', `${showDuration / 1000}s`);
        $banner.find('p').html(message);
        $banner.fadeIn(100);
        // fade out banner after the set show duration it not already closed manually
        setTimeout(function () {
            $banner.fadeOut(100);
        }, showDuration);
    } catch (error) {
        console.log("Banner shown: " + message);
    }
}


// ========================================= Helper Functions ===================================== //

function isNumeric(value) {
    return /^-?\d+$/.test(value);
}


function rgb2hex(rgb) {
    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}


function getColorBrightness(hexColor) {
    var r = parseInt(hexColor.substr(1, 2), 16);
    var g = parseInt(hexColor.substr(3, 2), 16);
    var b = parseInt(hexColor.substr(5, 2), 16);

    return (r * 299 + g * 587 + b * 114) / 1000;
}


// helper function the returns the paths and values to json objects
function getPathsAndValues(obj, currentPath = '') {
    const result = {};

    for (const key in obj) {
        const value = obj[key];
        // Erstelle den aktuellen Pfad ohne führenden Punkt
        const path = currentPath ? `${currentPath}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Rekursive Funktion aufrufen, um tiefere Objekte zu durchlaufen
            Object.assign(result, getPathsAndValues(value, path));
        } else {
            // Speichere den gesamten Pfad mit dem Wert
            result[path] = value;
        }
    }

    return result;
}
