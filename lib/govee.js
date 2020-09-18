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

            this.syncDevices()
        });
    }

    syncDevices() {
        this.govee.get().then(govee_data => {
            let accs = govee_data.data.devices.map(govee_device => {
                govee_device.uuid = UUIDGen.generate(govee_device.device)

                if (!this.accessories.find(accessory => accessory.UUID === govee_device.uuid)) {
                    this.log("New device found: " + govee_device.deviceName)

                    let acc = new Accessory(govee_device.deviceName, govee_device.uuid)
                    acc.getService(Service.AccessoryInformation)
                        .setCharacteristic(Characteristic.SerialNumber, govee_device.device)
                        .setCharacteristic(Characteristic.Manufacturer, "Govee")
                        .setCharacteristic(Characteristic.Model, govee_device.model)
                        .setCharacteristic(Characteristic.Identify, false);
                    acc.context = {
                        device: govee_device.device,
                        model: govee_device.model,
                    };

                    this.configureAccessory(acc)
                    return acc
                }
            }).filter(acc => acc);

            // add new devices
            if (accs.length > 0) {
                this.api.registerPlatformAccessories('homebridge-govee-led', 'Govee', accs)
            }
        })
    }

    configureAccessory(accessory) {
        let service = accessory.getService(Service.Lightbulb) || accessory.addService(Service.Lightbulb);
        service.getCharacteristic(Characteristic.On)
            .on("get", (callback) => {
                this.govee.state(accessory.context.device).then(dev_res => {
                    callback(null, dev_res.properties.find(prop => prop.powerState).powerState === 'on')
                })
            })
            .on("set", (value, callback) => {
                this.govee.control(accessory.context.device, {
                    name: 'turn',
                    value: value ? 'on' : 'off'
                }).then(dev_res => {
                    callback(null)
                })
            })
        service.getCharacteristic(Characteristic.Brightness)
            .on('set', (value, callback) => {
                this.govee.control(accessory.context.device, {
                    name: 'brightness',
                    value: value
                }).then(dev_res => {
                    callback(null)
                })
            })

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