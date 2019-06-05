"use strict";
/*global $ */

import ChargePoint from './ocpp_chargepoint.js';
import * as ocpp from './ocpp_constants.js'

//
// CONST definitions
//

// Keys (stored in local storage)
const WSURL = 'WSURL';
const CPID  = 'CPID';
const TAGID = 'TAG';

// the charge point
var _cp = new ChargePoint();


// Log message to the JS Console and into the Log TextArea 
function logMsg(msg) {
    console.log(msg);
    var html_console = $('#console');
    html_console.append("&#10;" + msg);
    html_console.scrollTop(html_console.get(0).scrollHeight);
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function setKey(key,value) {
    localStorage.setItem(key,value)
}

function keyDefaultValue(key) {
    var v=""
    switch(key) {
        case WSURL:
            v="ws://localhost:8080/steve/websocket/CentralSystemService/";
            break;
        case CPID:
            v='CP01';
            break;
        case TAGID:
            v='DEADBEEF';
            break;
    }
    return v
}

function getKey(key) {
    var v = localStorage.getItem(key);
    if (isEmpty(v)) {
        v = keyDefaultValue(key);
    }
    return v
}


function statusChangeCb(s,msg) {
    $('.indicator').hide();
    // Set only proper one
    switch(s){
        case ocpp.CP_DISCONNECTED:
            $('#badge_disconnected').show();
            $('#connect').show();
            $('#disconnect').hide();
            $('#send').hide();
            $('#start').hide();
            $('#stop').hide();
            $('#heartbeat').hide();
            $('#mv').hide();
            $('#status0').hide();
            $('#status1').hide();
            $('#data_transfer').hide();
            break;

        case ocpp.CP_CONNECTING:
            $('#badge_connecting').show();
            $('#connect').hide();
            $('#disconnect').show(); 
            break;

        case ocpp.CP_CONNECTED:
            $('#badge_connected').show();
            $('#connect').hide();
            $('#disconnect').show();
            $('#send').show();
            $('#start').show();
            $('#stop').show();
            $('#heartbeat').show();
            $('#mv').show();
            $('#status0').show();
            $('#status1').show();
            // RFU $('#data_transfer').show();
            break;

        case ocpp.CP_AUTHORIZED:
            $('#badge_available').show();
            break;

        case ocpp.CP_INTRANSACTION:
            $('#badge_transaction').show();
            break;

        case ocpp.CP_ERROR:
            $('#badge_error').show();
            if (!isEmpty(msg)) {
                logMsg(msg)
            }
            break;
        default:
            $('#badge_error').show();
            if (!isEmpty(msg)) {
                logMsg(msg)
            }
            else {
                logMsg("ERROR: Unknown status")
            }
    }
}

function availabilityChangeCb(c,s) {    
    var dom_id="#AVAILABILITY_CON"+c;
    $(dom_id).val(s);
    var dom_id="#STATUS_CON"+c;
    $(dom_id).val(_cp.connectorStatus(c));
}

//
// Entry point of the simulator
// (attach callbacks to each button and wait for user action)
//
$( document ).ready(function() {

    _cp.setLoggingCallback(logMsg);
    _cp.setStatusChangeCallback(statusChangeCb);
    _cp.setAvailabilityChangeCallback(availabilityChangeCb);
    _cp.setStatus(ocpp.CP_DISCONNECTED);

    // Init the setting form
    $('#WSURL').val(getKey(WSURL))
    $('#CPID').val(getKey(CPID))
    $('#TAG').val(getKey(TAGID))
    $("#metervalue").val(_cp.meterValue());
    availabilityChangeCb(0,_cp.availability(0));
    availabilityChangeCb(1,_cp.availability(1));

    // Define settings call back
    $('#cpparams').submit(function(e) {
        const formData = new FormData(e.target);
        for (var pair of formData.entries()) {
            setKey(pair[0],pair[1])
        }
    });

    $('#connect').click(function () {
        $('.indicator').hide();
        _cp.wsConnect(getKey(WSURL),getKey(CPID));
    });

    $('#disconnect').click(function () {
        _cp.wsDisconnect();
    });
    
    $('#send').click(function () {
        _cp.authorize($("#TAG").val());
    });

    $('#start').click(function () {
        _cp.setMeterValue($("#metervalue").val(),false);
        _cp.startTransaction($("#TAG").val());
    });

    $('#stop').click(function () {
        _cp.setMeterValue($("#metervalue").val(),false);
        _cp.stopTransaction($("#TAG").val());
    });

    $('#mv').click(function () {
        _cp.sendMeterValue();
    });

    $("#mvplus").click(function(){
        var meter = $("#metervalue").val();
        meter = parseInt(meter) + 10;
        $("#metervalue").val(meter); 
        _cp.setMeterValue(meter,false);
    });


    $('#heartbeat').click(function () {
        _cp.sendHeartbeat();
    });

    $('#CP0_STATUS').change(function () {
        _cp.setConnectorStatus(0,$("#STATUS_CON0").val(),false);
    });
    $('#CP1_STATUS').change(function () {
        _cp.setConnectorStatus(1,$("#STATUS_CON1").val(),false);
    });
    $('#status0').click(function () {
        _cp.setConnectorStatus(0,$("#STATUS_CON0").val(),true);
    });
    $('#status1').click(function () {
        _cp.setConnectorStatus(1,$("#STATUS_CON1").val(),true);
    });

    $('#data_transfer').click(function () {
        /*
        setLastAction("DataTransfer");
        var id=generateId();
        var DT = JSON.stringify([2,id, "DataTransfer", {
            "vendorId": "rus.avt.cp",
            "messageId": "GetChargeInstruction",
            "data": ""
        }]);
        wsSendData(DT);
        */
    });

    $('#connect').on('change', function () {
        /* if (_websocket) {
            _websocket.close(3001);
        }*/
    });
    
    logMsg("OCPP Simulator ready");
});