// import firebase config
import {get, ref, update} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";
import {db} from "./firebase_config.js";

import { User } from "./User.js";
import { Scoreboard } from "./Scoreboard.js";


export const themes = {
    'rg': {
        'html_structure': 'vertical_score',
        'css_path': 'css/style-v1.css'
    },
    'tops': {
        'html_structure': 'horizontal_score',
        'css_path': 'css/style-v2.css'
    },
    'full': {
        'html_structure': 'full',
        'css_path': 'css/style-v3.css'
    },
}

// initialize variables for global usage
var loggedInUser;
var scoreboard;
var $banner, $logoutButton;


// =========================================== Page Load ======================================= //


$(document).ready(async function () {
    $banner = $('.banner');
    $logoutButton = $('button#logout');

    // Kanalwahl aus URL-Parameter
    var urlParams = new URLSearchParams(window.location.search);
    var url_channel = urlParams.get('channel');
    var url_theme = urlParams.get('theme');
    var channel_selection = url_channel || 1;
    var theme_selection = url_theme;

    // Type of board
    if ($('html').attr('type') == 'output') {
        var type = 'output';
    } else {
        var type = 'input';
    }

    // Scoreboard sofort erstellen
    scoreboard = new Scoreboard(type, $('.scoreboard'), channel_selection, theme_selection);

    // Warten auf die Authentifizierung und den Benutzer setzen
    if (type == 'input') {
        await handleAuthentication(scoreboard);
    }

    // Toast-Nachricht schließen
    $('.banner_close_button').click(function () {
        $banner.fadeOut(100);
    });
});


// ========================================= Data Functions ===================================== //


export async function readData(channel) {
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


export async function writeData(newData) {
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


export function showToast(emoji, message, duration) {
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


export function rgb2hex(rgb) {
    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}


export function getColorBrightness(hexColor) {
    var r = parseInt(hexColor.substr(1, 2), 16);
    var g = parseInt(hexColor.substr(3, 2), 16);
    var b = parseInt(hexColor.substr(5, 2), 16);

    return (r * 299 + g * 587 + b * 114) / 1000;
}


// helper function the returns the paths and values to json objects
export function getPathsAndValues(obj, currentPath = '') {
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
