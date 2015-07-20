export default class ServerConnection {
    constructor(url) {
        this.eventSource = new EventSource(url);
    }

    on(event, callback) {
        this.eventSource.addEventListener(event, (e) => {
            callback(JSON.parse(e.data));
        });
    }
}
