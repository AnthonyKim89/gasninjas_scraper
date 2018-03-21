var path = require('path');
var _ = require('lodash');

var common = {
  debug: false,
  env: process.env.NODE_ENV || 'development',
  login_credentials: {
    username: "",
    password: ""
  },
  login_selectors: {
    username: "#fld",
    password: "input[type='password']",
    button: "#b1002",
    msg_ok: "#m1"
  },
  menu_selectors: {
    radio: "input[type='radio']",
    radio_export: "#b3092"
  },
  export_selectors: {
    input_selected: "#fld",
    input_date_from: "#f5",
    input_date_to: "#f6",
    input_data_type: "#b13",
    input_send_to: "#f14",
    btn_submit: "#b1002"
  },
  export_values: {
    data_type: "CSV Delimited",
  }
};

module.exports = _.merge(
  common, require(path.normalize(__dirname + '/environment/' + common.env + '.js')) || {}
);