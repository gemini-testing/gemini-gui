'use strict';

var chai = require('chai');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
chai.use(require('dirty-chai'));

global.expect = chai.expect;
global.sinon = require('sinon');
