/**
 * @author n1073645 [n1073645@gmail.com]
 * @copyright Crown Copyright 2020
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";

/**
 * LZW Decompress operation
 */
class LZWDecompress extends Operation {

    /**
     * LZWDecompress constructor
     */
    constructor() {
        super();

        this.name = "LZW Decompress";
        this.module = "Compression";
        this.description = "";
        this.infoURL = "";
        this.inputType = "ArrayBuffer";
        this.outputType = "ArrayBuffer";
        this.args = [];
        this.__leftOver = 0;
        this.__leftOverBits = 0;
        this.__dictionaryArray = [];
    }

    /**
     * Add an element to the dictionary in the corresponding code position.
     *
     * @param {number} prefix
     * @param {number} character
     * @param {number} value
     */
    dictionaryArrayAdd(prefix, character, value) {
        this.__dictionaryArray[value] = [prefix, character];
    }

    /**
     * Extract prefix for code.
     *
     * @param {number} value
     */
    dictionaryArrayPrefix(value) {
        return this.__dictionaryArray[value][0];
    }

    /**
     * Extract value for code.
     *
     * @param {number} value
     */
    dictionaryArrayCharacter(value) {
        return this.__dictionaryArray[value][1];
    }

    /**
     * reads a 12 bit code from the binary.
     *
     * @returns {number}
     */
    readBinary() {
        let code = this.input[0];

        if (!(this.input.length))
            return 0;

        this.input = this.input.slice(1);

        if (this.__leftOver > 0) {
            code = (this.__leftOverBits << 8) + code;
            this.__leftOver = 0;
        } else {
            const nextCode = this.input[0];
            this.input = this.input.slice(1);
            this.__leftOverBits = nextCode & 0xf;
            this.__leftOver = 1;
            code = (code << 4) + (nextCode >> 4);
        }

        return code;
    }

    /**
     * If a code is greater than 255 it points to a sequence, this function decodes that sequence.
     *
     * @param {number} code
     */
    decode(code) {
        let character = code, temp = code;

        if (code > 255) {
            character = this.dictionaryArrayCharacter(code);
            temp = this.decode(this.dictionaryArrayPrefix(code));
        }
        this.result.push(character);
        return temp;
    }

    /**
     * @param {ArrayBuffer} input
     * @param {Object[]} args
     * @returns {ArrayBuffer}
     */
    run(input, args) {
        this.input = new Uint8Array(input);


        this.result = [];
        let previousCode = this.readBinary(), currentCode, firstChar, nextCode = 256;

        if (!(previousCode))
            return null;

        this.result.push(previousCode);

        while ((currentCode = this.readBinary()) > 0) {

            if (currentCode >= nextCode)
                this.result.push(firstChar = this.decode(previousCode));
            else
                firstChar = this.decode(currentCode);

            if (nextCode < 4096)
                this.dictionaryArrayAdd(previousCode, firstChar, nextCode++);

            previousCode = currentCode;

        }

        return new Uint8Array(this.result).buffer;

    }

}

export default LZWDecompress;
