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
            }).then(res => res.json()).then(res => {
                if (res.code === 200) {
                    resolve(res)
                } else {
                    reject(res.code)
                }
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
                    if (res.status === 200) {
                        resolve(res.status)
                    } else {
                        reject(res.status)
                    }
                })
            })
        }).bind(this))
    }

    async state(device) {
        let ret
        let model = (await this.get()).data.devices.find(d => d.device === device).model

        var url = "https://developer-api.govee.com/v1/devices/state"
        url = `${url}?device=${escape(device)}&model=${escape(model)}`

        await fetch(url, {
            method: 'GET',
            headers: { 'Govee-API-Key': this.apikey },
        }).then(res => res.json()).then(res => {
            ret = res.data
        })

        return ret
    }
}

module.exports = govee