# OCPP ChargePoint  Simulator
A simple Charge Point simulator written in Javascript and based on OCPP protocol
(originally a fork and major rewrite from nenecmrf simulator, also borrowing some code from JavalsJavascript and svennorge forks).

## Installation
Just clone in a directory accessible from your webserver and point your browser to it.
Go to the setting tab and configure the URL of your OCPP server as well as your Charge Point Id

## Changes:
* Rewrite / Refactoring
* Bootstrap based UI;
* Big refactoring (still WIP)
* Status Notification / Send Meter Values now take parameters;
* Ids are now unique for each call
* Enhanced Logging (scrollable functionnal logs in the UI + OCPP trace in the JS Console )

## Licensing
Licensed under Apache License 2.0
