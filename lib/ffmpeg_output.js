/**
 * @fileOverview lib/ffmpeg_output.js - Defines and exports the FFmpegOutput class
 */

const config = require('./util/config')();
const logger = config.logger;
const util = require('util');
const { createCommandString } = require('./util/command_string_creator')
const FFmpegStreamSpecifier = require('./ffmpeg_stream_specifier')
const FFmpegOption = require('./ffmpeg_option')

/** Class representing an FFmpeg output file */
class FFmpegOutput {
  /**
   * Create an output for an FFmpeg command
   * @param {string} url - the location of the output file
   * @param {Object} options - the options for the output
   * @property {Array<FFmpegStreamSpecifier>} streams - specifiers for the media streams mapped into this output
   */
  constructor (url, options = new Map()) {
    this.type = 'FFmpegOutput'
    if (!url) {
      throw new Error('Invalid arguments: url parameter is required');
    }
    this.url = url;
    this.options = FFmpegOutput.validateOptions(options);
    this.streams = [];
  }

  /**
   * Generate the command array segment for this FFmpeg output
   * @returns {Array} the command array segment
   */
  toCommandArray () {
    // Note: FFmpeg options on outputs prepend the output filename
    let cmd = [];
    this.options.forEach((o) => {
      cmd = cmd.concat(o.toCommandArray());
    });
    this.streams.forEach((s) => {
      cmd = cmd.concat(['-map', `${s.toString()}`]);
    });
    cmd.push(`${this.url}`);
    return cmd;
  }

  /**
   * Generate the command string segment for this FFmpeg output
   * @returns {string} the command string segment
   */
  toCommandString () {
    return createCommandString(undefined, this.toCommandArray());
  }

  /**
   * Generate a developer-friendly string representing for this FFmpeg output
   * @returns {string} the string representation
   */
  toString () {
    return `FFmpegOutput(url: "${this.url}", options: ${util.inspect(this.options)})`;
  }

  /**
   * Add media streams to the output
   * @param {Array<FFmpegStreamSpecifier>} streamSpecifiers - specifiers for the streams to map into this output (in order)
   * @returns {void}
   * @throws {Error}
   */
  addStreams (streamSpecifiers) {
    this.streams = this.streams.concat(this.validateStreams(streamSpecifiers));
  }

  /**
   * Add a single media stream to the output
   * @param {FFmpegStreamSpecifier} streamSpecifier - specifier for the stream map into this output
   * @returns {void}
   * @throws {Error}
   */
  addStream (streamSpecifier) {
    this.addStreams([streamSpecifier]);
  }

  /**
   * Validate an array of inputs to the filter chain
   * @param {Array<FFmpegStreamSpecifier>} streamSpecifiers - specifiers for the streams to validate
   * @returns {Array<FFmpegStreamSpecifier>} - the validated stream specifiers
   * @throws {Error}
   */
  validateStreams (streamSpecifiers) {
    if (!Array.isArray(streamSpecifiers)) {
      throw new Error('Invalid argument: streamSpecifiers must be an Array of FFmpegStreamSpecifier objects');
    }
    if (streamSpecifiers.some((i) => (!i instanceof FFmpegStreamSpecifier))) {
      throw new Error('Invalid inputs specified: all streamSpecifiers in Array must be FFmpegStreamSpecifier objects');
    }
    return streamSpecifiers;
  }

  /**
   *
   * @param {Object} options - the options to be added to the output
   * @returns {void}
   */
  addOptions (options) {
    const optObjects = FFmpegOutput.validateOptions(options);
    this.options = this.options.concat(optObjects);
  }

  /**
   * Validate the options passed into the constructor
   * @param {Object} options - the options for the output
   * @returns {Array<FFmpegOption>} array of validated FFmpegOption objects
   */
  static validateOptions (options) {
    logger.debug(`Validating options: ${JSON.stringify(options)}`);
    let opts = options;
    if (!(opts instanceof Map)) {
      opts = new Map(Object.entries(options));
    }
    const optObjects = Array.from(opts)
      .map(([name, arg]) => new FFmpegOption(name, arg));
    return (optObjects);
  }
}

module.exports = FFmpegOutput;
