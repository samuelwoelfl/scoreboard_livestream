export class User {
    constructor(username, password, channels = []) {
        this.username = username;
        this.password = password;
        this.isAuthenticated = true; // Benutzer ist angemeldet
        this.channels = channels.map(Number);
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
