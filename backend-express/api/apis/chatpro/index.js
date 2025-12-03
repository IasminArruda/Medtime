"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'chatpro/unknown (api/6.1.3)');
    }
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };

    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };

    SDK.prototype.status = function (metadata) {
        return this.core.fetch('/{instance_id}/api/v1/status', 'get', metadata);
    };

    SDK.prototype.generate_qrcode = function (metadata) {
        return this.core.fetch('/{instance_id}/api/v1/generate_qrcode', 'get', metadata);
    };

    SDK.prototype.reload = function (metadata) {
        return this.core.fetch('/{instance_id}/api/v1/reload', 'get', metadata);
    };

    SDK.prototype.remove_session = function (metadata) {
        return this.core.fetch('/{instance_id}/api/v1/remove_session', 'get', metadata);
    };

    SDK.prototype.get_profile = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/get_profile', 'post', body, metadata);
    };

    SDK.prototype.contacts = function (metadata) {
        return this.core.fetch('/{instance_id}/api/v1/contacts', 'get', metadata);
    };

    SDK.prototype.create_group = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/create_group', 'post', body, metadata);
    };

    SDK.prototype.leave_group = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/leave_group', 'post', body, metadata);
    };

    SDK.prototype.chats = function (metadata) {
        return this.core.fetch('/{instance_id}/api/v1/chats', 'get', metadata);
    };

    SDK.prototype.send_message = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/send_message', 'post', body, metadata);
    };

    SDK.prototype.send_message_file_from_url = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/send_message_file_from_url', 'post', body, metadata);
    };

    SDK.prototype.send_location = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/send_location', 'post', body, metadata);
    };

    SDK.prototype.send_vcard = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/send_vcard', 'post', body, metadata);
    };

    SDK.prototype.send_forward_message = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/send_forward_message', 'post', body, metadata);
    };

    SDK.prototype.delete_message = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/delete_message', 'post', body, metadata);
    };
    SDK.prototype.get_message_byid = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/get_message_byid', 'post', body, metadata);
    };

    SDK.prototype.send_button_message = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/send_button_message', 'post', body, metadata);
    };

    SDK.prototype.send_list_message = function (body, metadata) {
        return this.core.fetch('/{instance_id}/api/v1/send_list_message', 'post', body, metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
