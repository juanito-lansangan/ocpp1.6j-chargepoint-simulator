"use strict";

//
// CONST definitions
//

// Keys (stored in local or session storage)
export const KEY_CP_STATUS    = 'cp_status';
export const KEY_METER_VALUE  = 'meter_value';
export const KEY_CONN_STATUS  = 'conn_status';
export const KEY_CONN0_STATUS  = 'conn_status0';
export const KEY_CONN1_STATUS  = 'conn_status1';
export const KEY_CONN2_STATUS  = 'conn_status2';
    
// Charge Point Status
export const CP_ERROR         = 'error';
export const CP_DISCONNECTED  = 'disconnected';
export const CP_CONNECTING    = 'connecting';
export const CP_CONNECTED     = 'connected';
export const CP_AUTHORIZED    = 'authorized';
export const CP_INTRANSACTION = 'in_transaction';

// Connector status
export const CONN_AVAILABLE = 'Available';
export const CONN_CHARGING  = 'Charging';

