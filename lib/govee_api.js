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
                resolve(res)
            })
        })
    }

    control(device, cmd) {
        return new Promise(((resolve, reject) => {
            this.get().then(data => {
                fetch('https://developer-api.govee.com/v1/devices/control', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Govee-API-Key': this.apikey
                    },
                    body: JSON.stringify({
                        "device": data.data.devices.find(d => d.device === device).device,
                        "model": data.data.devices.find(d => d.device === device).model,
                        "cmd": cmd
                    })
                }).then(res => {
                    if (res.ok) {
                        resolve(res.status)
                    } else {
                        reject(`ERROR ${res.status}: ${res.statusText}`)
                    }
                })
            }).catch(reason => {
                reject(reason)
            })
        }).bind(this))
    }

    async state(device) {
        return new Promise((resolve, reject) => {
            this.get().then(data => {
                let model = data.data.devices.find(d => d.device === device).model

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
                    resolve(res.data)
                })
            }).catch(reason => {
                reject(reason)
            })
        })
    }
}

module.exports = govee