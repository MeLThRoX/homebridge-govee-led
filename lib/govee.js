const govee_api = require('./govee_api')

class Govee {
    constructor(log, config, api) {
        if (!log || !api || !config) return;
        if (!config.apiKey) {
            log.error("Govee API Key missing.");
            return;
        }

        this.accessories = [];

        this.log = log;
        this.config = config;
        this.api = api;
        this.debug = this.config.debug || false;

        this.api.on("didFinishLaunching", () => {
            this.log("Plugin has finished initialising. Synching with Govee.");
            this.govee = new govee_api(this.config.apiKey);

            this.govee.get().then(govee_data => {
                let accs = govee_data.data.devices.map(govee_device => {
                    let uuid = api.hap.uuid.generate(govee_device.device)
                    if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
                        this.log("New device found: " + govee_device.deviceName)
                        let acc = new this.api.platformAccessory(govee_device.deviceName, uuid)
                        acc.context.device = govee_device.device

                        return acc
                    }
                });

                this.api.registerPlatformAccessories('homebridge-govee-led', 'Govee', accs)
            })

        });
    }

    configureAccessory(accessory) {
        this.accessories.push(accessory);
    }
}

module.exports = function (homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    return Govee;
};