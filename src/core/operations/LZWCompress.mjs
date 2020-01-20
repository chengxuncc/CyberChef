/**
 * @author n1073645 [n1073645@gmail.com]
 * @copyright Crown Copyright 2020
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";

/**
 * LZW Compress operation
 */
class LZWCompress extends Operation {

    /**
     * LZWCompress constructor
     */
    constructor() {
        super();

        this.name = "LZW Compress";
        this.module = "Compression";
        this.description = "";
        this.infoURL = "";
        this.inputType = "ArrayBuffer";
        this.outputType = "ArrayBuffer";
        this.args = [];
        this.__leftOver = 0;
        this.__leftOverBits = 0;
    }

    /**
     * Initialises the dictionary with the ASCII range.
     *
     */
    dictionaryInit() {
        this.dictionary = [];
        for (let i = 0; i < 256; i++)
            this.dictionary.push([-1, i]);
    }

    /**
     * Looks up the code-position in the dictionary.
     *
     * @param {number} prefix
     * @param {number} character
     */
    dictionaryLookup(prefix, character) {
        for (let i = 0; i < this.dictionary.length; i++) {
            if (this.dictionary[i][0] === prefix && this.dictionary[i][1] === character)
                return i;
        }
        return -1;
    }

    /**
     * Adds an entry with a code to the dictionary.
     *
     * @param {number} prefix
     * @param {number} character
     */
    dictionaryAdd(prefix, character) {
        this.dictionary.push([prefix, character]);
    }

    /**
     * Writes a 12 bit code without wasting space.
     *
     * @param {number} code
     */
    writeBinary(code) {
        if (this.__leftOver > 0) {
            const previousCode = (this.__leftOverBits << 4) + (code >> 8);
            this.result.push(previousCode);
            this.result.push(code);
            this.__leftOver = 0;
        } else {
            this.__leftOverBits = code & 0xf;
            this.__leftOver = 1;
            this.result.push(code>>4);
        }
    }

    /**
     * @param {ArrayBuffer} input
     * @param {Object[]} args
     * @returns {ArrayBuffer}
     */
    run(input, args) {

        input = new Uint8Array(input);

        let prefix = input[0], character, index, nextCode = 256;

        input = input.slice(1);

        this.result = [];

        this.dictionaryInit();

        for (let i = 0; i < input.length+1; i++) {

            character = input[i];

            index = this.dictionaryLookup(prefix, character);

            if (index !== -1) {
                prefix = index;
            } else {
                this.writeBinary(prefix);

                if (nextCode < 4096) {

                    this.dictionaryAdd(prefix, character);

                    nextCode++;
                }

                prefix = character;
            }

        }

        this.writeBinary(prefix);

        if (this.__leftOver > 0)
            this.result.push(this.__leftOverBits<<4);

        return new Uint8Array(this.result).buffer;

    }
}

export default LZWCompress;
