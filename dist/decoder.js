'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _rsdecoder = require('./rsdecoder.js');

var _rsdecoder2 = _interopRequireDefault(_rsdecoder);

var _gf = require('./gf256.js');

var _gf2 = _interopRequireDefault(_gf);

var _bmparser = require('./bmparser.js');

var _bmparser2 = _interopRequireDefault(_bmparser);

var _datablock = require('./datablock.js');

var _datablock2 = _interopRequireDefault(_datablock);

var _databr = require('./databr.js');

var _databr2 = _interopRequireDefault(_databr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Decoder = {}; /*
                    Ported to JavaScript by Lazar Laszlo 2011 
                    
                    lazarsoft@gmail.com, www.lazarsoft.info
                    
                  */

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

Decoder.rsDecoder = new _rsdecoder2.default(_gf2.default.QR_CODE_FIELD);

Decoder.correctErrors = function (codewordBytes, numDataCodewords) {
	var numCodewords = codewordBytes.length;
	// First read into an array of ints
	var codewordsInts = new Array(numCodewords);
	for (var i = 0; i < numCodewords; i++) {
		codewordsInts[i] = codewordBytes[i] & 0xFF;
	}
	var numECCodewords = codewordBytes.length - numDataCodewords;
	try {
		Decoder.rsDecoder.decode(codewordsInts, numECCodewords);
		//var corrector = new ReedSolomon(codewordsInts, numECCodewords);
		//corrector.correct();
	} catch (rse) {
		throw rse;
	}
	// Copy back into array of bytes -- only need to worry about the bytes that were data
	// We don't care about errors in the error-correction codewords
	for (var i = 0; i < numDataCodewords; i++) {
		codewordBytes[i] = codewordsInts[i];
	}
};

Decoder.decode = function (bits) {
	var parser = new _bmparser2.default(bits);
	var version = parser.readVersion();
	var ecLevel = parser.readFormatInformation().ErrorCorrectionLevel;

	// Read codewords
	var codewords = parser.readCodewords();

	// Separate into data blocks
	var dataBlocks = _datablock2.default.getDataBlocks(codewords, version, ecLevel);

	// Count total number of data bytes
	var totalBytes = 0;
	for (var i = 0; i < dataBlocks.length; i++) {
		totalBytes += dataBlocks[i].NumDataCodewords;
	}
	var resultBytes = new Array(totalBytes);
	var resultOffset = 0;

	// Error-correct and copy data blocks together into a stream of bytes
	for (var j = 0; j < dataBlocks.length; j++) {
		var dataBlock = dataBlocks[j];
		var codewordBytes = dataBlock.Codewords;
		var numDataCodewords = dataBlock.NumDataCodewords;
		Decoder.correctErrors(codewordBytes, numDataCodewords);
		for (var i = 0; i < numDataCodewords; i++) {
			resultBytes[resultOffset++] = codewordBytes[i];
		}
	}

	// Decode the contents of that stream of bytes
	var reader = new _databr2.default(resultBytes, version.VersionNumber, ecLevel.Bits);
	return reader;
	//return DecodedBitStreamParser.decode(resultBytes, version, ecLevel);
};

exports.default = Decoder;