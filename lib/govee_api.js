const fetch = require('node-fetch')

class govee {
    constructor(apikey) {
        this.apikey = apikey;
    }

    get() {
        return new Promise((resolve, reject) => {
            fetch('https://developer-api.govee.com/v1/devices', {
                method: 'GET',
                headers: { 'Govee-API-Key': this.apikey },
            }).then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    reject(`ERROR ${res.status}: ${res.statusText}`)
                }
            }).then(res => {
                if (!res) return
                if (res.code == 200) {
                    resolve(res)
                } else {
                    reject(`ERROR ${res.code}: ${res.message}`)
                }
            })
        })
    }

    control(device, model, cmd) {
        return new Promise((resolve, reject) => {
            fetch('https://developer-api.govee.com/v1/devices/control', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Govee-API-Key': this.apikey
                },
                body: JSON.stringify({
                    "device": device,
                    "model": model,
                    "cmd": cmd
                })
            }).then(res => {
                if (res.ok) {
                    resolve(res.status)
                } else {
                    reject(`ERROR ${res.status}: ${res.statusText}`)
                }
            })
        })
    }

    async state(device, model) {
        return new Promise((resolve, reject) => {
            var url = "https://developer-api.govee.com/v1/devices/state"
            url = `${url}?device=${escape(device)}&model=${escape(model)}`

            fetch(url, {
                method: 'GET',
                headers: { 'Govee-API-Key': this.apikey },
            }).then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    reject(`ERROR ${res.status}: ${res.statusText}`)
                }
            }).then(res => {
                if (!res) return
                if (res.code == 200) {
                    resolve(res.data)
                } else {
                    reject(`ERROR ${res.code}: ${res.message}`)
                }
            })
        })
    }
}

module.exports = govee