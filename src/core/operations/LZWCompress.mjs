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

        // If there is leftover bits that still need to be written.
        if (this.__leftOver > 0) {
            // Since we shift left by 4 and right by 8 we can have 12 bit codes.
            const previousCode = (this.__leftOverBits << 4) + (code >> 8);
            this.result.push(previousCode);
            this.result.push(code);
            this.__leftOver = 0;
        } else {

            // Bit mask the bytes we are going to write.
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

        // Remove first element of input since it is the prefix.
        input = input.slice(1);

        this.result = [];

        // Initialise ASCII codes.
        this.dictionaryInit();

        for (let i = 0; i < input.length+1; i++) {

            character = input[i];

            // Check to see if the prefix is already in the dictionary.
            index = this.dictionaryLookup(prefix, character);

            if (index !== -1) {
                prefix = index;
            } else {
                this.writeBinary(prefix);

                if (nextCode < 4096) {

                    // As long as the code is less than the dictionarySize then add it.
                    this.dictionaryAdd(prefix, character);

                    nextCode++;
                }

                prefix = character;
            }

        }

        this.writeBinary(prefix);

        // If we have a leftover nibble.
        if (this.__leftOver > 0)
            this.result.push(this.__leftOverBits<<4);

        return new Uint8Array(this.result).buffer;

    }
}

export default LZWCompress;
