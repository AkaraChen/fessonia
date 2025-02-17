import { EventEmitter } from 'events';
import { ChildProcessWithoutNullStreams } from 'child_process';
import FFmpegInput = require('./ffmpeg_input');
import FFmpegOutput = require('./ffmpeg_output');
import FilterChain = require('./filter_chain');
import FilterGraph = require('./filter_graph');

export = FFmpegCommand;

/** Class representing an FFmpeg command (`ffmpeg ...`) */
declare class FFmpegCommand extends EventEmitter {
    filterGraph: FilterGraph;

    constructor(options?: FFmpegCommand.Options);

    /** Add a filter chain to the FFmpegCommand object's filter graph */
    addFilterChain(filterChain: FilterChain): void
    addInput(input: FFmpegInput): void;
    addOutput(output: FFmpegOutput): void;

    /** Get inputs on the FFmpegCommand object */
    inputs(): FFmpegInput[];
    /** Get the currently buffered log data from the ffmpeg run */
    logData(): string[];
    /** Get most recent log lines from the ffmpeg run */
    logLines(n: number): string[];
     /** Get outputs on the FFmpegCommand object */
    outputs(): FFmpegOutput[];
    /** Generate the command representation of the command */
    toCommand(): { command: string, args: string[] };
    toString(): string;
}

declare namespace FFmpegCommand {
    /** The global options for the command. */
    export type Options = Map<string, any> | { [key: string]: any };
}
