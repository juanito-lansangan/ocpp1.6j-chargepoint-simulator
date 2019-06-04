/*eslint prefer-const: "error"*/
/* exported ocpp */
/*eslint no-console: ["error", { allow: ["log","warn","error"] }] */
/*eslint no-unused-vars: ["error", {"args": "none"}]*/
/*global $ */
"use strict";
import * as ocpp from './ocpp_constants.js'

//
//
// Utility functions
//
//
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

//
// Store a key value in session storage
// @param key The key name
// @param value The key value
//
function setSessionKey(key,value) {
    sessionStorage.setItem(key,value)
}

//
// Get a key value from session storage
// @param key The key name
// @return The key value
//
function getSessionKey(key,default_value="") {
    var v = sessionStorage.getItem(key);
    if (!v) {
        v=default_value;
    }
    return v
}

//
//
// OCPPChargePoint class
//
//
export default class ChargePoint {
    
    //
    // Constructor
    // @param a callback function that will receive debug logging information
    //
    constructor() {
        this._websocket      = null;
        this._heartbeat      = null;
        this._statusChangeCb = null;
        this._loggingCb      = null;
    } 

    //
    // module init method
    //
    setStatusChangeCallback(cb) {
        this._statusChangeCb = cb;
    }
    
    //
    // module init method
    //
    setLoggingCallback(cb) {
        this._loggingCb = cb;
    }
    
    //
    // output a log to the logging callback if any
    //
    logMsg(msg) {
        if (this._loggingCb) {
            msg = '[OCPP] '+msg;
            this._loggingCb(msg);
        }
    }

    //
    // Set the internal status of the CP and call the status update callbalck if any
    // @param s The new status value
    // @param msg Optional message (for information purpose)
    //
    setStatus(s,msg="") {
        setSessionKey(ocpp.KEY_CP_STATUS,s);
        if (this._statusChangeCb) {
            this._statusChangeCb(s,msg);
        }
    }
    
    //
    // Handle a command coming from the OCPP server
    //
    handleCallRequest(id,request,payload) {
        switch (request) {
            case "Reset":
                //Reset type can be SOFT, HARD
                var rstType=payload.type;
                this.logMsg("Reset Request: type="+rstType);
                var resetS = JSON.stringify([3,id,{"status": "Accepted"}]);
                this.wsSendData(resetS);
                this.wsDisconnect();
                break;

            case "RemoteStartTransaction":
                console.log("RemoteStartTransaction");
                //Need to get idTag, connectorId (map - ddata[3])
                var remStrt = JSON.stringify([3,id,{"status": "Accepted"}]);
                var tagId = payload.idTag;
                this.wsSendData(remStrt);
                this.startTransaction(tagId,$("#metervalue").val());
                break;

            case "RemoteStopTransaction":
                //TransactionID
                var remStp = JSON.stringify([3,id,{"status": "Accepted"}]);
                var stop_id = payload.transactionId;
                this.wsSendData(remStp);
                this.stopTransactionWithId(stop_id,$("#TAG").val(),$("#metervalue").val());
                break;

            case "UnlockConnector": /////////ERROR!!!!!!!!
                //connectorId
                var UC = JSON.stringify([3,id, {"status": "Accepted"}]);
                this.wsSendData(UC);
                // connector_locked = false;
                // $('.indicator').hide();
                //$('#yellow').show();
                //logMsg("Connector status changed to: "+connector_locked);
                break;

            default:
                var error = JSON.stringify([4,id]);
                this.wsSendData(error);
                break;
        }
    }

    //
    // Handle the response from the OCPP server to a command 
    // @param payload The payload part of the OCPP message
    //
    handleCallResult(payload) {
        var la = this.getLastAction();
        if (la == "BootNotification") {
            if (payload.status == 'Accepted') {
                this.logMsg("Connection accepted");
                var hb_interval = payload.interval;
                this.setHeartbeat(hb_interval);
                this.setStatus(ocpp.CP_CONNECTED);
            }
            else {
                this.logMsg("Connection refused by server");
                this.wsDisconnect();
            }
        }
        else if (la == "Authorize") {
            if (payload.idTagInfo.status == 'Invalid') {
                this.logMsg('Authorization failed');
            }
            else {
                this.logMsg('Authorization OK');
                this.setStatus(ocpp.CP_AUTHORIZED);
            } 
        }
        else if (la == "startTransaction") {
            var array = $.map(payload, function(value,index) {
                return [value];
            });
            var transactionId = (array[0]);
            setSessionKey('TransactionId',transactionId);
            this.setStatus(ocpp.CP_INTRANSACTION,'TransactionId: '+transactionId)
            this.logMsg("Transaction id is "+transactionId);
        }
    }

    //
    // Handle an error response from the OCPP server
    // @param errCode The error code
    // @param errMsg  The clear text description of the error
    //
    handleCallError(errCode,errMsg) {
        this.setStatus(ocpp.CP_ERROR,'ErrorCode: '+errCode+' ('+errMsg+')');
    }

    //
    // Send an Authorize call to the OCPP Server
    // @param tagId the id of the RFID tag to authorize
    //
    authorize(tagId){
        this.setLastAction("Authorize");
        this.logMsg("Requesting authorization for tag " + tagId);
        var id=generateId();
        var Auth = JSON.stringify([2,id,"Authorize", {
            "idTag": tagId
        }]);
        this.wsSendData(Auth);
    }

    //
    // Send a StartTransaction call to the OCPP Server
    // @param tagId the id of the RFID tag currently authorized on the CP
    // @param meterValue the current value of the CP meter
    //
    startTransaction(tagId,meterValue=0,connectorId=1,reservationId=0){
        this.setLastAction("startTransaction");
        this.setStatus(ocpp.CP_INTRANSACTION);
        this.logMsg("Starting Transaction for tag "+tagId+" (meter value="+meterValue+")");
        var id=generateId();
        var strtT = JSON.stringify([2,id,"StartTransaction", {
            "connectorId": connectorId,
            "idTag": tagId,
            "timestamp": formatDate(new Date()),
            "meterStart": meterValue,
            "reservationId": reservationId
        }]);
        this.wsSendData(strtT);
        this.setConnectorStatus(connectorId,ocpp.CONN_CHARGING);
    }

    //
    // Send a StopTransaction call to the OCPP Server
    // @param tagId the id of the RFID tag currently authorized on the CP
    // @param meterValue the current value of the CP meter
    //
    stopTransaction(tagId,meterValue=0){
        var transactionId=getSessionKey("TransactionId");
        this.stopTransactionWithId(transactionId,tagId,meterValue);
    }
    
    //
    // Send a StopTransaction call to the OCPP Server
    // @param transactionId the id of the transaction to stop
    // @param tagId the id of the RFID tag currently authorized on the CP
    // @param meterValue the current value of the CP meter
    //
    stopTransactionWithId(transactionId,tagId,meterValue=0){
        this.setLastAction("stopTransaction");
        this.setStatus(ocpp.CP_AUTHORIZED);
        this.logMsg("Stopping Transaction with id "+transactionId+" (meterValue="+meterValue+")");
        var id=generateId();
        var stpT = JSON.stringify([2, id, "StopTransaction",{
            "transactionId": transactionId,
            "idTag": tagId,
            "timestamp": formatDate(new Date()),
            "meterStop": meterValue
        }]);
        this.wsSendData(stpT);
        this.setConnectorStatus(1,ocpp.CONN_AVAILABLE);
    }
    
    //
    // Send a BootNotification call to the OCPP Server
    //
    bootNotification(){
        this.logMsg('Sending BootNotification');
        this.setLastAction("BootNotification");
        var id=generateId();
        var bn_req = JSON.stringify([2, id, "BootNotification", {
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
        this.wsSendData(bn_req);
    }

    
    //
    // Update status of given connector
    // @param connectorId MUST be 1 for now
    // @param new status for connector
    //
    setConnectorStatus(connectorId,newStatus)
    {
        setSessionKey(ocpp.KEY_CONN1_STATUS,newStatus);
        $('.CP1_STATUS').val(newStatus).change();
    }
    

    // @todo: Shitty code to remove asap => real transaction support
    setLastAction(action) {
        setSessionKey("LastAction",action);
    }
    // @todo: Shitty code to remove asap
    getLastAction(){
        return getSessionKey("LastAction");
    }
    
    //
    // Setup heartbeat sending at the appropriate period
    // (clearing any previous setup)
    // @param period The heartbeat period in seconds
    //
    setHeartbeat(period){
        this.logMsg("Setting heartbeat period to "+period+"s");
        if (this._heartbeat) {
            clearInterval(this._heartbeat);
        }
        this._heartbeat = setInterval(this.sendHeartbeat,period*1000);
    }

    //
    // Send a heartbeat to the OCPP Server
    //
    sendHeartbeat() {
        this.setLastAction("Heartbeat");
        var id=generateId();
        var HB = JSON.stringify([2,id,"Heartbeat", {}]);
        this.logMsg('Heartbeat');
        this.wsSendData(HB);
    }
    
    //
    // Send data to the server (will be also logged in console)
    // @data the data to send 
    //
    wsSendData(data) {
        console.log("SEND: "+data);
        if (this._websocket) {
            this._websocket.send(data);
        }
        else {
            this.setStatus(ocpp.CP_ERROR,'No connection to OCPP server')
        }
    }
    
    //
    // @return the internal state of the CP
    //
    status() {
        return getSessionKey(ocpp.KEY_CP_STATUS);
    }
    
    //
    // Open the websocket and set internal state accordingly
    // @param wsurl The URL of the OCPP server
    // @param cpid  The charge point identifief (as defined in OCPP server)
    //
    wsConnect(wsurl,cpid) {
        if (this._websocket) {
            this.setStatus(ocpp.CP_ERROR,'Socket already opened. Closing it. Retry later');
            this._websocket.close(3001);
        } 
        else {

            this._websocket = new WebSocket(wsurl + "" + cpid, ["ocpp1.6", "ocpp1.5"]);
            var self = this

            //
            // OnOpen Callback
            //
            this._websocket.onopen = function(authorizationData) {
                self.setStatus(ocpp.CP_CONNECTING);
                self.bootNotification();
            }

            //
            // OnError Callback
            //                  
            this._websocket.onerror = function(evt) {
                switch(self._websocket.readyState) {
                    case 1: // OPEN
                        self.setStatus(ocpp.CP_ERROR,'ws normal error: ' + evt.type)
                        break;
                    case 3: // CLOSED
                        self.setStatus(ocpp.CP_ERROR,'connection cannot be opened: ' + evt.type)
                        break;
                    default:
                        self.setStatus(ocpp.CP_ERROR,'websocket error: ' + evt.type)
                        break;
                }

            }

            //
            // OnMessage Callback
            // Decode the type of message and pass it to the appropriate handler
            // 
            this._websocket.onmessage = function(msg) {
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
                        self.handleCallRequest(id,request,payload);
                        break;
                    case 3: // CALLRESULT 
                        self.handleCallResult(ddata[2]);
                        break;
                    case 4: // CALLERROR
                        self.handleCallError(ddata[2],ddata[3]);
                        break;
                }
            }

            //
            // OnClose Callback
            //   
            this._websocket.onclose = function(evt) {
                if (evt.code == 3001) {
                    self.setStatus(ocpp.CP_DISCONNECTED);
                    self.logMsg('Connection closed');
                    self._websocket = null;
                } else {
                    self.setStatus(ocpp.CP_ERROR,'Connection error: ' + evt.code);
                    self.logMsg('Connection error: ' + evt.code);
                    self._websocket = null;
                }
            }
        }
    }

    //
    // Close the websocket and set internal state accordingly
    //
    wsDisconnect() {
        if (this._websocket) {
            this._websocket.close(3001);
        }
        this.setStatus(ocpp.CP_DISCONNECTED);
    }
    
    //
    // Return the meter value
    //
    meterValue() {
        return (getSessionKey(ocpp.KEY_METER_VALUE,"0"));
    }
    
    //
    // Set the meter value (and optionnally update the OCPP server with it)
    // @param v the new meter value
    // @param updateServer if set to true, update the server with the new meter value
    //
    setMeterValue(v,updateServer=false) {
        setSessionKey(ocpp.KEY_METER_VALUE,v);
        if (updateServer) {
            this.sendMeterValue();
        }
    }
    
    //
    // update the server with the internal meter value
    //
    sendMeterValue() {
        var mvreq={};
        this.setLastAction("MeterValues");
        var meter=getSessionKey(ocpp.KEY_METER_VALUE);
        var id=generateId();
        var ssid = getSessionKey('TransactionId')
        mvreq = JSON.stringify([2, id, "MeterValues", {"connectorId": 1, "transactionId": ssid, "meterValue": [{"timestamp": formatDate(new Date()), "sampledValue": [{"value": meter}]}]}]);
        this.logMsg("Send Meter Values: "+meter+" (connector1)")
        this.wsSendData(mvreq);
    }
    
    sendConnectorStatus(c,st) {
        this.setLastAction("StatusNotification");
        var id=generateId();
        var sn_req = JSON.stringify([2, id, "StatusNotification", {
            "connectorId": c,
            "status": st,
            "errorCode": "NoError",
            "info": "",
            "timestamp": formatDate(new Date()),
            "vendorId": "",
            "vendorErrorCode": ""
        }]);
        this.logMsg("Sending StatusNotification for connector "+c+": "+st);
        this.wsSendData(sn_req);
    }

}
