"use strict";
/*eslint-env es6*/
/*eslint-env browser*/
/*eslint prefer-const: "error"*/
/*eslint no-console: ["error", { allow: ["log","warn","error"] }] */
/*eslint no-unused-vars: ["error", {"args": "none"}]*/
/*global $ */

//
// CONST definitions
//

// Keys (stored in local storage)
const WSURL = 'WSURL';
const CPID  = 'CPID';
const TAGID = 'TAG';
const METER_VALUE  = 'METER_VALUE';
const CONN1_STATUS = 'CONN1_STATUS';

// Connector status
const CONN_AVAILABLE = 'Available';
const CONN_CHARGING  = 'Charging';

var _websocket = null;
var _hb = null;

// Log message to the JS Console and into the Log TextArea 
function logMsg(msg) {
    console.log(msg);
    var html_console = $('#console');
    html_console.append("&#10;" + msg);
    html_console.scrollTop(html_console.get(0).scrollHeight);
}

function formatDate(date) {
    var day = String(date.getDate()),
        monthIndex = String(date.getMonth() + 1),
        year = date.getFullYear(),
        h = date.getHours(),
        m = String(date.getMinutes()),
        s = String(date.getSeconds());
        
    if (day.length < 2) {
        day = ('0' + day.slice(-2));
    }
    if (monthIndex.length < 2) {
        monthIndex = ('0' + monthIndex.slice(-2));
    }
    if (h.length < 2) {
        h = ('0' + h.slice(-2));
    }
    if (m.length < 2) {
        m = ('0' + m.slice(-2));
    }
    if (s.length < 2) {
        s = ('0' + s.slice(-2));
    }
    return year + '-' + monthIndex + '-' + day + 'T' + h + ':' + m + ':' + s + 'Z';
}

function generateId() {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var id = "";
    for (var i = 0; i < 36; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function setKey(key,value) {
    localStorage.setItem(key,value)
}

function setSessionKey(key,value) {
    sessionStorage.setItem(key,value)
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
        case METER_VALUE:
            v='0';
            break;
        case 'CON1_STATUS':
            v=CONN_AVAILABLE;
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

function setLastAction(action) {
    setKey("LastAction",action);
}

function getLastAction(){
    return getKey("LastAction");
}

function setStatus(s,msg) {
    setSessionKey("STATUS",s);
    // Reset all indicators
    $('.indicator').hide();
    // Set only proper one
    switch(s){
        case 'Disconnected':
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

        case 'Connecting':
            $('#badge_connecting').show();
            $('#connect').hide();
            $('#disconnect').show(); 
            break;

        case 'Connected':
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
            $('#data_transfer').show();
            break;

        case 'Available':
            $('#badge_available').show();
            break;

        case 'InTransaction':
            $('#badge_transaction').show();
            break;

        case 'Error':
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

//
// Update status of given connector
// @param connectorId MUST be 1 for now
// @param new status for connector
//
function setConnectorStatus(connectorId,newStatus)
{
    setKey(CONN1_STATUS,newStatus);
    $('.CP1_STATUS').val(newStatus).change();
}

function wsConnect() {
    if (_websocket) {
        setStatus('Error','Socket already opened. Closing it .Retry later');
        _websocket.close(3001);
    } 
    else {
        var wsurl = getKey(WSURL);
        var CP = getKey(CPID);

        _websocket = new WebSocket(wsurl + "" + CP, ["ocpp1.6", "ocpp1.5"]);

        //
        // OnOpen Callback
        //
        _websocket.onopen = function(authorizationData) {
            setLastAction("BootNotification");
            BootNotification();
        }

        //
        // OnError Callback
        //                  
        _websocket.onerror = function(evt) {
            switch(_websocket.readyState) {
                case 1: // OPEN
                    setStatus('Error','ws normal error: ' + evt.type)
                    break;
                case 3: // CLOSED
                    setStatus('Error','connection cannot be opened: ' + evt.type)
                    break;
                default:
                    setStatus('Error','websocket error: ' + evt.type)
                    break;
            }

        }

        //
        // OnMessage Callback
        // Decode the type of message and pass it to the appropriate handler
        // 
        _websocket.onmessage = function(msg) {
            console.log("RECEIVE: "+msg.data);
            var ddata = (JSON.parse(msg.data));

            // Decrypt Message Type
            var msgType=ddata[0];
            switch(msgType) {
                case 2: // CALL 
                    var id=ddata[1];
                    var request=ddata[2];
                    var payload=null;
                    if (ddata.length > 3) {
                        payload = ddata[3];
                    }
                    handleCallRequest(id,request,payload);
                    break;
                case 3: // CALLRESULT 
                    handleCallResult(ddata[2]);
                    break;
                case 4: // CALLERROR
                    handleCallError(ddata[2],ddata[3]);
                    break;
            }
        }

        //
        // OnClose Callback
        //   
        _websocket.onclose = function(evt) {
            if (evt.code == 3001) {
                setStatus('Disconnected')
                logMsg('Connection closed');
                _websocket = null;
            } else {
                setStatus('Error','Connection error: ' + evt.code)
                logMsg('Connection error: ' + evt.code);
                _websocket = null;
            }
        }
    }
}

//
// Close the websocket and set internal state accordingly
//
function wsDisconnect() {
    if (_websocket) {
        _websocket.close(3001);
    }
    setStatus('Disconnected');
}

//
// Send data to the server (will be also logged in console)
// @data the data to send 
//
function wsSendData(data) {
    console.log("SEND: "+data);
    if (_websocket) {
        _websocket.send(data);
    }
    else {
        setStatus('Error','No connection to OCPP server')
    }
}

//
// Handle a command coming from the OCPP server
//
function handleCallRequest(id,request,payload) {
    switch (request) {
        case "Reset":
            //Reset type can be SOFT, HARD
            var rstType=payload.type;
            logMsg("Reset Request: type="+rstType);
            var resetS = JSON.stringify([3,id,{"status": "Accepted"}]);
            wsSendData(resetS);
            wsDisconnect();
            break;

        case "RemoteStartTransaction":
            console.log("RemoteStartTransaction");
            //Need to get idTag, connectorId (map - ddata[3])
            var remStrt = JSON.stringify([3,id,{"status": "Accepted"}]);
            var tagId = payload.idTag;
            wsSendData(remStrt);
            cmdStartTransaction(tagId,$("#metervalue").val());
            break;

        case "RemoteStopTransaction":
            //TransactionID
            var remStp = JSON.stringify([3,id,{"status": "Accepted"}]);
            var stop_id = payload.transactionId;
            wsSendData(remStp);
            cmdStopTransaction(stop_id,$("#TAG").val(),$("#metervalue").val());
            break;

        case "UnlockConnector": /////////ERROR!!!!!!!!
            //connectorId
            var UC = JSON.stringify([3,id, {"status": "Accepted"}]);
            wsSendData(UC);
            // connector_locked = false;
            // $('.indicator').hide();
            //$('#yellow').show();
            //logMsg("Connector status changed to: "+connector_locked);
            break;

        default:
            var error = JSON.stringify([4,id]);
            wsSendData(error);
            break;
    }
}

//
// Handle the response from the OCPP server to a command 
// @param payload The payload part of the OCPP message
//
function handleCallResult(payload) {
    var la = getLastAction();
    if (la == "BootNotification") {
        if (payload.status == 'Accepted') {
            logMsg("Connection accepted");
            var hb_interval = payload.interval;
            setKey("Heartbeat",hb_interval);
            startHeartBeat(hb_interval);
            setStatus("Connected");
        }
        else {
            logMsg("Connection refused by server");
            wsDisconnect();
        }
    }
    else if (la == "Authorize") {
        if (payload.idTagInfo.status == 'Invalid') {
            logMsg("Authorization Failed");
        }
        else {
            logMsg("Authorization Success");
            setStatus('Available');
        } 
    }
    else if (la == "startTransaction") {
        var array = $.map(payload, function(value,index) {
            return [value];
        });
        var transactionId = (array[0]);
        setKey('TransactionId',transactionId);
        setStatus('InTransaction','TransactionId: '+transactionId)
        logMsg("Transaction id is "+transactionId);
    }
}

//
// Handle an error response from the OCPP server
// @param errCode The error code
// @param errMsg  The clear text description of the error
//
function handleCallError(errCode,errMsg) {
    setStatus('Error','ErrorCode: '+errCode+' ('+errMsg+')');
}

//
// Send an Authorize call to the OCPP Server
// @param tagId the id of the RFID tag to authorize
//
function cmdAuthorize(tagId){
    setLastAction("Authorize");
    var id=generateId();
    var Auth = JSON.stringify([2,id,"Authorize", {
        "idTag": tagId
    }]);
    wsSendData(Auth);
}

//
// Send a StartTransaction call to the OCPP Server
// @param tagId the id of the RFID tag currently authorized on the CP
// @param meterValue the current value of the CP meter
//
function cmdStartTransaction(tagId,meterValue=0,connectorId=1,reservationId=0){
    setLastAction("startTransaction");
    setStatus("InTransaction");
    logMsg("Starting Transaction for tag "+tagId+" (meter value="+meterValue+")");
    var id=generateId();
    var strtT = JSON.stringify([2,id,"StartTransaction", {
        "connectorId": connectorId,
        "idTag": tagId,
        "timestamp": formatDate(new Date()),
        "meterStart": meterValue,
        "reservationId": reservationId
    }]);
    wsSendData(strtT);
    setConnectorStatus(connectorId,CONN_CHARGING);
}

//
// Send a StopTransaction call to the OCPP Server
// @param transactionId the id of the transaction to stop
// @param tagId the id of the RFID tag currently authorized on the CP
// @param meterValue the current value of the CP meter
//
function cmdStopTransaction(transactionId,tagId,meterValue){
    setLastAction("stopTransaction");
    setStatus("Available");
    logMsg("Stopping Transaction "+transactionId+"(meterValue="+meterValue+")");
    var id=generateId();
    var stpT = JSON.stringify([2, id, "StopTransaction",{
        "transactionId": transactionId,
        "idTag": tagId,
        "timestamp": formatDate(new Date()),
        "meterStop": meterValue
    }]);
    wsSendData(stpT);
    setConnectorStatus(1,CONN_AVAILABLE);
}

//
// Send a BootNotification call to the OCPP Server
//
function BootNotification(){
    var id=generateId();
    var BN = JSON.stringify([2, id, "BootNotification", {
        "chargePointVendor": "Elmo",
        "chargePointModel": "Elmo-Virtual1",
        "chargePointSerialNumber": "elm.001.13.1",
        "chargeBoxSerialNumber": "elm.001.13.1.01",
        "firmwareVersion": "0.9.87",
        "iccid": "",
        "imsi": "",
        "meterType": "ELM NQC-ACDC",
        "meterSerialNumber": "elm.001.13.1.01"
    }]);
    setStatus('Connecting');
    logMsg('BootNotification');
    wsSendData(BN);
}

//
// Setup heartbeat sending at the appropriate period
// (clearing any previous setup)
// @param period The heartbeat period in seconds
//
function startHeartBeat(period){
    logMsg("Setting heartbeat period to "+period+"s");
    if (_hb) {
        console.log("Clearing Heartbeat")
        clearInterval(_hb);
    }
    _hb=setInterval(cmdHeartbeat,period*1000);
}

//
// Send a heartbeat to the OCPP Server
//
function cmdHeartbeat() {
    setLastAction("Heartbeat");
    var id=generateId();
    var HB = JSON.stringify([2,id,"Heartbeat", {}]);
    logMsg('Heartbeat');
    wsSendData(HB);
}


//
// Entry point of the simulator
// (attach callbacks to each button and wait for user action)
//
$( document ).ready(function() {
    logMsg("OCPP Simulator ready");

    // Init the setting form
    $('#WSURL').val(getKey(WSURL))
    $('#CPID').val(getKey(CPID))
    $('#TAG').val(getKey(TAGID))
    $("#metervalue").val(getKey(METER_VALUE));
    setStatus('Disconnected');

    // Define settings call back
    $('#cpparams').submit(function(e) {
        const formData = new FormData(e.target);
        for (var pair of formData.entries()) {
            setKey(pair[0],pair[1])
        }
    });

    $('#connect').click(function () {
        $('.indicator').hide();
        wsConnect();
    });

    $('#disconnect').click(function () {
        wsDisconnect();
    });
    $('#send').click(function () {
        cmdAuthorize($("#TAG").val());
    });

    $('#start').click(function () {
        cmdStartTransaction($("#TAG").val(),$("#metervalue").val());
    });

    $('#stop').click(function () {
        cmdStopTransaction(getKey('TransactionId'),$("#TAG").val(),$("#metervalue").val());
    });

    $('#mv').click(function () {
        setLastAction("MeterValues");
        var meter = $("#metervalue").val();
        setKey(METER_VALUE,meter);
        var id=generateId();
        var ssid = getKey('TransactionId')
        var MV = JSON.stringify([2, id, "MeterValues", {"connectorId": 1, "transactionId": ssid, "meterValue": [{"timestamp": formatDate(new Date()), "sampledValue": [{"value": meter}]}]}]);
        logMsg("Send Meter Values: "+meter+" (connector1)")
        wsSendData(MV);
    });

    $("#mvplus").click(function(){
        var meter = $("#metervalue").val();
        meter = parseInt(meter) + 10;
        $("#metervalue").val(meter);        
    });


    $('#heartbeat').click(function () {
        cmdHeartbeat();
    });

    $('#status0').click(function () {
        setLastAction("StatusNotification");
        var id=generateId();
        var st=$("#CP0_STATUS").val();
        var SN = JSON.stringify([2, id, "StatusNotification", {
            "connectorId": 0,
            "status": st,
            "errorCode": "NoError",
            "info": "",
            "timestamp": formatDate(new Date()),
            "vendorId": "",
            "vendorErrorCode": ""
        }]);
        logMsg("Status Notification: connector0 = "+st);
        wsSendData(SN);
    });
    $('#status1').click(function () {
        setLastAction("StatusNotification");
        var id=generateId();
        var st=$("#CP1_STATUS").val();
        var SN = JSON.stringify([2, id, "StatusNotification", {
            "connectorId": 1,
            "status": st,
            "errorCode": "NoError",
            "info": "",
            "timestamp": formatDate(new Date()),
            "vendorId": "",
            "vendorErrorCode": ""
        }]);
        logMsg("Status Notification: connector1 = "+st);
        wsSendData(SN);
    });

    $('#data_transfer').click(function () {
        setLastAction("DataTransfer");
        var id=generateId();
        var DT = JSON.stringify([2,id, "DataTransfer", {
            "vendorId": "rus.avt.cp",
            "messageId": "GetChargeInstruction",
            "data": ""
        }]);
        wsSendData(DT);
    });

    $('#connect').on('change', function () {
        if (_websocket) {
            _websocket.close(3001);
        }
    });
});