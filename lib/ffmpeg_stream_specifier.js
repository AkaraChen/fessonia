/**
 * @fileOverview lib/ffmpeg_stream_specifier.js - Defines and exports the FFmpegStreamSpecifier class
 *
 * @private
 */

const { inspect } = require('util')

/**
 * Class representing an FFmpeg stream specifier
 * @private
 */
class FFmpegStreamSpecifier {
  /**
   * Create an FFmpegStreamSpecifier object
   * @param {FFmpegInput|FilterChain} entity - the entity on which the stream specifier is applied
   * @param {string|number} specifier - the stream specifier string or stream index
   *
   * @property {FFmpegInput|FilterChain} entity - the entity on which the stream specifier is applied
   * @property {string} specifier - the stream specifier string
   * @property {string} entityType - the entity's type (either 'FFmpegInput' or 'FilterChain')
   *
   * @private
   */
  constructor (entity, specifier) {
    this.type = 'FFmpegStreamSpecifier'
    this.entity = entity;
    this.specifier = specifier.toString();
    this.entityType = entity.type
    if (this.entityType === undefined) {
      throw new Error(`Invalid entity type for entity ${inspect(entity)}: must be either FFmpegInput or FilterChain`);
    }
    try {
      this.toString();
    } catch (err) {
      throw new Error(`Invalid specifier ${inspect(specifier)} for entity ${inspect(entity)}: ${err.message}`);
    }
  }

  /**
   * Generate string representation of the stream specifier
   * @returns {string} the stream specifier representation
   */
  toString () {
    if (this.entityType === 'FFmpegInput') {
      return `${this.entity.inputLabel}:${this.specifier}`;
    }
    if (this.entityType === 'FilterChain') {
      return `[${this.entity.getOutputPad(this.specifier)}]`;
    }
    return this.specifier;
  }
}

module.exports = FFmpegStreamSpecifier;
