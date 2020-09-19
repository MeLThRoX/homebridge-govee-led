const govee_api = require('./govee_api')
const convert = require('color-convert')

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

                if (!this.accessories.find(accessory => accessory.UUID === govee_device.uuid) && supported_models.includes(govee_device.model)) {
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

            accs = this.accessories.map(accessory => {
                if (!govee_data.data.devices.find(govee_device => UUIDGen.generate(govee_device.device))) {
                    this.log("Removing old device: " + accessory.context.device)
                    return accessory
                }
            }).filter(acc => acc);

            // remove old devices
            if (accs.length > 0) {
                this.api.unregisterPlatformAccessories('homebridge-govee-led', 'Govee', accs)
            }
        })
    }

    configureAccessory(accessory) {
        let service = accessory.getService(Service.Lightbulb) || accessory.addService(Service.Lightbulb);
        service.getCharacteristic(Characteristic.On)
            .on("get", (callback) => { // get device powerState
                this.govee.state(...accessory.context).then(dev_res => {
                    callback(null, dev_res.properties.find(prop => prop.powerState).powerState === 'on')
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
                })
            })
            .on("set", (value, callback) => { // set device powerState
                this.govee.control(...accessory.context, {
                    name: 'turn',
                    value: value ? 'on' : 'off'
                }).then(dev_res => {
                    callback(null)
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
                })
            })
        service.getCharacteristic(Characteristic.Brightness)
            .on("get", (callback) => { // get device brightness
                this.govee.state(...accessory.context).then(dev_res => {
                    let brightness = Math.round(dev_res.properties.find(prop => prop.brightness).brightness / 254 * 100)
                    callback(null, brightness)
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
                })
            })
            .on('set', (value, callback) => { // set device brightness
                this.govee.control(...accessory.context, {
                    name: 'brightness',
                    value: value
                }).then(dev_res => {
                    callback(null)
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
                })
            })
        service.getCharacteristic(Characteristic.Hue)
            .on('get', (callback) => { // get device hue
                this.govee.state(...accessory.context).then(dev_res => {
                    let hsv = convert.rgb.hsv(['r', 'g', 'b'].map(key => dev_res.properties.find(prop => prop.color).color[key]))
                    callback(null, hsv[0])
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
                })
            })
            .on('set', (value, callback) => { // get device hue
                let saturation = service.getCharacteristic(Characteristic.Saturation).value
                let brightness = service.getCharacteristic(Characteristic.Brightness).value
                let rgb = convert.hsv.rgb(value, saturation, brightness)

                this.govee.control(...accessory.context, {
                    name: 'color',
                    value: { r: rgb[0], g: rgb[1], b: rgb[2] }
                }).then(dev_res => {
                    callback(null)
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
                })
            })
        service.getCharacteristic(Characteristic.Saturation)
            .on('get', (callback) => { // get device saturation
                this.govee.state(...accessory.context).then(dev_res => {
                    let hsv = convert.rgb.hsv(['r', 'g', 'b'].map(key => dev_res.properties.find(prop => prop.color).color[key]))
                    callback(null, hsv[1])
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
                })
            })
            .on('set', (value, callback) => { // set device saturation
                let hue = service.getCharacteristic(Characteristic.Hue).value
                let brightness = service.getCharacteristic(Characteristic.Brightness).value
                let rgb = convert.hsv.rgb(hue, value, brightness)

                this.govee.control(...accessory.context, {
                    name: 'color',
                    value: { r: rgb[0], g: rgb[1], b: rgb[2] }
                }).then(dev_res => {
                    callback(null)
                }).catch(reason => {
                    if (this.debug) this.log.error(reason)
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