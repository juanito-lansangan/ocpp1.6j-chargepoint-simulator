<html lang="en">
    <head>
        <title>OCPP ChargePoint Simulator</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
        <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
        <style>
            body {
                padding-top: 5rem;
            }

            form-group {
                padding-top: 0.5rem;
            }
        </style>

    </head>

    <body>
        <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
            <a class="navbar-brand" href="#">OCPP ChargePoint Simulator</a>
        </nav>
        <main role="main" class="container">
            <ul class="nav nav-tabs">
                <li class="nav-item">
                    <a class="nav-link active" href="#tabcpsim" data-toggle="tab">ChargePoint</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#tabcon1" data-toggle="tab">Connector 1</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#tabcon2" data-toggle="tab">Connector 2</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#tabcpparams" data-toggle="tab">Settings</a>
                </li>
            </ul>

            <div class="tab-content">
                <div class="tab-pane mt-4" id="tabcpparams">
                    <form id="cpparams">
                        <div class="form-group">
                            <label for="WSURL">OCPP Server</label>
                            <input type="text" class="form-control" id="WSURL" name="WSURL" aria-describedby="urlHelp" placeholder="ws://localhost:8080/steve/websocket/CentralSystemService/">
                            <small id="urlHelp" class="form-text text-muted">The base URL of the OCPP Server (without the ChargePoint ID)</small>
                        </div>
                        <div class="form-group">
                            <label for="CPID">ChargePoint ID</label>
                            <input type="text" class="form-control" id="CPID" name="CPID" placeholder="CP001" style="max-width: 20ch">
                        </div>
                        <div class="form-group">
                            <label for="OCPP">OCPP Version</label>
                            <select id="OCPP" class="form-control" style="max-width: 20ch"><option value="">OCPP-1.6J</option></select>
                        </div>
                        <div class="form-group">
                            <label for="TAG">RFID Tag</label>
                            <input type="text" class="form-control" id="TAG" name="TAG" aria-describedby="TAGHelp" placeholder="DEADBEEF" style="max-width: 20ch">
                            <small id="TAGHelp" class="form-text text-muted">The ID of the simulated RFID tag</small>
                        </div>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </form>    
                </div>
                <div class="tab-pane mt-4" id="tabcon1">
                    <form id="con1">
                        <div class="form-group">
                            <label for="AVAILABILITY_CON1">Connector Availability:</label>
                            <select id="AVAILABILITY_CON1" class="form-control" style="max-width: 16ch; margin-right:1ch;">
                                <option selected value="Operative">Operative</option>
                                <option disabled value="Inoperative">Inoperative</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="STATUS_CON1">Connector Status:</label>
                            <div class="d-flex">
                                <select id="STATUS_CON1" class="form-control" style="max-width: 16ch; margin-right:1ch;">
                                    <option value="Available">Available</option>
                                    <option value="Preparing">Preparing</option>
                                    <option value="Charging">Charging</option>
                                    <option value="SuspendedEV">Suspended EV</option>
                                    <option value="SuspendedEVSE">Suspended EVSE</option>
                                    <option value="Finishing">Finishing</option>
                                    <option value="Reserved">Reserved</option>
                                    <option value="Unavailable">Unavailable</option>
                                    <option value="Faulted">Faulted</option>
                                </select>
                                <button id="status1" type="button" class="btn btn-primary">Status Notification</button>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="tab-pane mt-4" id="tabcon2">
                    <p>I am not yet available...</p>
                </div>
                <div class="tab-pane active" id="tabcpsim">
                    <div class="row mt-4">
                        <div class="col-sm-4">
                            <button id="connect" type="button" class="btn btn-primary btn-block">Connect</button>
                            <button id="disconnect" type="button" class="btn btn-secondary btn-block ">Disconnect</button>
                            <button id="send" type="button" class="btn btn-primary btn-block">Authorize</button>
                            <button id="start" type="button" class="btn btn-primary btn-block">Start Transaction</button>
                            <button id="stop" type="button" class="btn btn-primary btn-block">Stop Transaction</button>
                            <button id="heartbeat" type="button" class="btn btn-primary btn-block">Heartbeat</button>
                            <button id="data_transfer" type="button" class="btn btn-primary btn-block">Data Transfer</button>
                        </div>
                        <div class="col-sm-8 d-flex">                    
                            <div class="card w-100">
                                <div class="card-body">
                                    <p><label>Server Status:</label>
                                        <span id="badge_available" class="indicator badge badge-success">Authorized</span>
                                        <span id="badge_connected" class="indicator badge badge-warning">Connected</span>
                                        <span id="badge_connecting" class="indicator badge badge-secondary">Connecting</span>
                                        <span id="badge_disconnected" class="indicator badge badge-light">Disconnected</span>
                                        <span id="badge_error" class="indicator badge badge-danger">Error</span>
                                        <span id="badge_transaction" class="indicator badge badge-primary">In Transaction</span></p>  
                                    <div class="form-group">
                                        <label for="AVAILABILITY_CON0">Charge Point Availability:</label>
                                        <select id="AVAILABILITY_CON0" class="form-control" style="max-width: 16ch; margin-right:1ch;">
                                            <option selected value="Operative">Operative</option>
                                            <option disabled value="Inoperative">Inoperative</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="STATUS_CON0">Charge Point Status:</label>
                                        <div class="d-flex">
                                            <select id="STATUS_CON0" class="form-control" style="max-width: 16ch; margin-right:1ch;">
                                                <option value="Available">Available</option>
                                                <option value="Unavailable">Unavailable</option>
                                                <option value="Faulted">Faulted</option>
                                            </select>
                                            <button id="status0" type="button" class="btn btn-primary">Status Notification</button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="metervalue">Meter value: </label>
                                        <div class="d-flex">
                                            <input type="text" id="metervalue" type="text" name="mv" value="1" style="max-width: 12ch">
                                            <div class="input-group-btn">
                                                <button id="mvplus" class="btn btn-secondary"><span class="fa fa-plus"></span></button>
                                                <button id="mv" type="button" class="btn btn-primary" style="margin-left: 1ch">Send Meter Value</button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-4 mr-1 ml-1 d-flex">
                <div class="col-sm-12 pr-0 pl-0">
                    <form>
                        <div class="form-group">
                            <label for="console">Log: </label>
                            <textarea readonly class="form-control form-control-sm border-0 bg-light text-secondary" id="console" rows="10" name="console"></textarea>
                        </div>
                    </form>
                </div>
            </div>
        </main>
        <script type="module" src="./js/ocpp_constants.js"></script>
        <script type="module" src="./js/ocpp_chargepoint.js"></script>
        <script type="module" src="./js/main.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    </body>
</html>