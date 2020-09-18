const govee_api = require('./govee_api')

const supported_models = [
    "H6160", "H6163", "H6104",
    "H6109", "H6110", "H6117",
    "H6159", "H7021", "H7022",
    "H6086", "H6089", "H6182",
    "H6085", "H7014", "H5081",
    "H6188", "H6135", "H6137",
    "H6141", "H6142", "H6195",
    "H6196", "H7005", "H6083",
    "H6002", "H6003", "H6148"
]

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
                    let uuid = UUIDGen.generate(govee_device.device)

                    if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
                        this.log("New device found: " + govee_device.deviceName)

                        let acc = new Accessory(govee_device.deviceName, uuid)


                        this.configureAccessory(acc)
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