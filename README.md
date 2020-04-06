![Logo](admin/foldingathome.png)

# ioBroker.foldingathome

[![NPM version](http://img.shields.io/npm/v/iobroker.foldingathome.svg)](https://www.npmjs.com/package/iobroker.foldingathome)
[![Downloads](https://img.shields.io/npm/dm/iobroker.foldingathome.svg)](https://www.npmjs.com/package/iobroker.foldingathome)
![Number of Installations (latest)](http://iobroker.live/badges/foldingathome-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/foldingathome-stable.svg)
[![Dependency Status](https://img.shields.io/david/JgamerXD/iobroker.foldingathome.svg)](https://david-dm.org/JgamerXD/iobroker.foldingathome)
[![Known Vulnerabilities](https://snyk.io/test/github/JgamerXD/ioBroker.foldingathome/badge.svg)](https://snyk.io/test/github/JgamerXD/ioBroker.foldingathome)

[![NPM](https://nodei.co/npm/iobroker.foldingathome.png?downloads=true)](https://nodei.co/npm/iobroker.foldingathome/)

**Tests:**: [![Travis-CI](http://img.shields.io/travis/JgamerXD/ioBroker.foldingathome/master.svg)](https://travis-ci.org/JgamerXD/ioBroker.foldingathome)

## foldingathome adapter for ioBroker

Get information about [Folding@home](https://foldingathome.org/) clients.

This adapter utilizes the [3rd party foldingathomeClient API](https://github.com/FoldingAtHome/fah-control/wiki/3rd-party-FAHClient-API) to get information about Folding@home clients.

### Setup

#### Folding@home client

These settings can be accessed through `Advanced Control -> Configure -> Remote Access`.

-   set password and port for remote accessing Folding@home
-   add your ioBrokers ip address to the "Allow" ip address restriction list

#### Adapter

Configure hostname, port and password of the Folding@home instance. An empty password disables authentication, leave the field empty if you do not have a password set in Folding@home or you have added your ioBrokers ip address to the "Allow" passwordless ip address restriction list.

## Todo

-   [ ] remove old slots
    -   [x] while connected
    -   [ ] on reconnect
-   [x] Multiple connections
-   [ ] ability to set options
-   [ ] implement tests

## Changelog

### 0.0.3

-   (JgamerXD) improved state roles and data types
-   (JgamerXD) implemented combined ppd
-   (JgamerXD) moved state writing functions to own file

### 0.0.2

-   (JgamerXD) handle login errors
-   (JgamerXD) allow multiple connections
-   (JgamerXD) improved state structure

### 0.0.1

-   (JgamerXD) update changelog
-   (JgamerXD) basic functionality working
-   (JgamerXD) initial release

## License

MIT License

Copyright (c) 2020 JgamerXD <jgamerlp@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
