const chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  sinon = require('sinon'),
  events = require('events'),
  stream = require('stream'),
  childProcess = require('child_process'),
  testHelpers = require('./helpers');

chai.use(chaiAsPromised);

const FFmpegCommand = require('../lib/ffmpeg_command');
const FFmpegInput = require('../lib/ffmpeg_input');
const FFmpegOutput = require('../lib/ffmpeg_output');
const FilterNode = require('../lib/filter_node');
const FilterChain = require('../lib/filter_chain');
const FFmpegError = require('../lib/ffmpeg_error');
const config = require('../lib/util/config')();

describe('FFmpegCommand', function () {
  it('creates an FFmpegCommand object', function () {
    const fc = new FFmpegCommand();
    expect(fc).to.be.instanceof(FFmpegCommand);
  });
  it('sets the options property on the object', function () {
    expect(new FFmpegCommand().options).to.eql(new Map());
    expect(new FFmpegCommand(new Map()).options).to.eql(new Map());
    expect(new FFmpegCommand({}).options).to.eql(new Map());
  });
  describe('addInput', function () {
    it('allows adding inputs on and retrieving inputs from the object', function () {
      const fc = new FFmpegCommand();
      const fi = new FFmpegInput('/some/file.mov', {});
      fc.addInput(fi);
      expect(fc.inputs()).to.contain(fi);
    });
    it('sets the labels on inputs as they are added', function () {
      const fc = new FFmpegCommand();
      expect(fc.inputs().length).to.eql(0);
      const fi1 = new FFmpegInput('/some/file1.mov', {});
      fc.addInput(fi1);
      expect(fc.inputs().length).to.eql(1);
      expect(fi1.inputLabel).to.eql('0');
      const fi2 = new FFmpegInput('/some/file2.mov', {});
      fc.addInput(fi2);
      expect(fc.inputs().length).to.eql(2);
      expect(fi2.inputLabel).to.eql('1');
    });
  });
  describe('addOutput', function () {
    it('allows adding outputs on and retrieving outputs from the object', function () {
      const fc = new FFmpegCommand();
      const fo = new FFmpegOutput('/some/file.mov', {});
      fc.addOutput(fo);
      expect(fc.outputs()).to.contain(fo);
    });
  });
  describe('addFilterChain', function () {
    it('allows adding filter chains to the command filter graph', function () {
      const cmd = new FFmpegCommand();
      const fc = new FilterChain([new FilterNode('scale', [640,-1])]);
      cmd.addFilterChain(fc);
      expect(cmd.filterGraph.toString()).to.eql(fc.toString());
    });
  })
  it('generates the correct command object', function () {
    const fc = new FFmpegCommand(new Map([['y'],]));
    const fi = new FFmpegInput('/some/file.mov', new Map([
      ['threads', '8'],
      ['itsoffset', '0'],
      ['ss', '6234.0182917']
    ]));
    const fo = new FFmpegOutput('/dev/null', new Map([
      ['c:v', 'libx264'],
      ['preset:v', 'slow'],
      ['profile:v', 'high'],
      ['pix_fmt', 'yuv420p'],
      ['coder', '1'],
      ['g', '48'],
      ['b:v', '3850k'],
      ['flags', '+bitexact'],
      ['sws_flags', '+accurate_rnd+bitexact'],
      ['fflags', '+bitexact'],
      ['maxrate', '4000k'],
      ['bufsize', '2850k'],
      ['an'],
      ['f', 'mp4'],
      ['aspect', '16:9'],
      ['pass', '1'],
    ]));
    fc.addInput(fi);
    fc.addOutput(fo);
    const fcCmd = fc.toCommand();
    const expected = {
      command: config.ffmpeg_bin,
      seqs: [
        fi.toCommandArray(),
        fo.toCommandArray(),
        fi.toCommandArray().concat(fo.toCommandArray()),
        [
          '-y',
          '-threads', '8',
          '-itsoffset', '0',
          '-ss', '6234.0182917',
          '-i', '/some/file.mov',
          '-c:v', 'libx264',
          '-preset:v', 'slow',
          '-profile:v', 'high',
          '-pix_fmt', 'yuv420p',
          '-coder', '1',
          '-g', '48',
          '-b:v', '3850k',
          '-flags', '+bitexact',
          '-sws_flags', '+accurate_rnd+bitexact',
          '-fflags', '+bitexact',
          '-maxrate', '4000k',
          '-bufsize', '2850k',
          '-an',
          '-f', 'mp4',
          '-aspect', '16:9',
          '-pass', '1',
          '/dev/null',
        ]
      ]
    };
    expect(fcCmd.command).to.eql(expected.command);
    testHelpers.expectSequences(fcCmd.args, expected.seqs);
  });
  it('generates the correct command string', function () {
    const fc = new FFmpegCommand(new Map([['y'],]));
    const fi = new FFmpegInput('/some/file.mov', new Map([
      ['threads', '8'],
      ['itsoffset', '0'],
      ['ss', '6234.0182917']
    ]));
    const fo = new FFmpegOutput('/dev/null', new Map([
      ['c:v', 'libx264'],
      ['preset:v', 'slow'],
      ['profile:v', 'high'],
      ['pix_fmt', 'yuv420p'],
      ['coder', '1'],
      ['g', '48'],
      ['b:v', '3850k'],
      ['flags', '+bitexact'],
      ['sws_flags', '+accurate_rnd+bitexact'],
      ['fflags', '+bitexact'],
      ['maxrate', '4000k'],
      ['bufsize', '2850k'],
      ['an'],
      ['f', 'mp4'],
      ['aspect', '16:9'],
      ['pass', '1'],
    ]));
    fc.addInput(fi);
    fc.addOutput(fo);
    const expected = `${config.ffmpeg_bin} -y -threads "8" -itsoffset "0" -ss "6234.0182917" -i "/some/file.mov" -c:v "libx264" -preset:v "slow" -profile:v "high" -pix_fmt "yuv420p" -coder "1" -g "48" -b:v "3850k" -flags "+bitexact" -sws_flags "+accurate_rnd+bitexact" -fflags "+bitexact" -maxrate "4000k" -bufsize "2850k" -an -f "mp4" -aspect "16:9" -pass "1" "/dev/null"`;
    expect(fc.toString()).to.eql(expected);
  });
  it('generates the correct command string when IO mappings are present', function () {
    const cmd = new FFmpegCommand(new Map([['y'],]));
    const scaleFilter = new FilterNode('scale', [1920, 1080]);
    const nodes = [
      new FilterNode('life', {
        size: '320x240',
        mold: 10,
        rate: 23.976,
        ratio: 0.5,
        death_color: '#C83232',
        life_color: '#00ff00',
        stitch: 0
      }),
      scaleFilter
    ];
    let scaledLife = new FilterChain(nodes);
    let lifeInput = new FFmpegInput(scaledLife, new Map([
      ['re', null],
      ['r', 23.976],
      ['f', 'lavfi']
    ]));
    let sineFilter = new FilterNode('sine', {
      frequency: 620,
      beep_factor: 4,
      duration: 9999999999,
      sample_rate: 48000
    });
    let sineInput = new FFmpegInput(sineFilter, new Map([
      ['re', null],
      ['r', 23.976],
      ['f', 'lavfi']
    ]));
    cmd.addInput(lifeInput);
    cmd.addInput(sineInput);
    let output = new FFmpegOutput('gen.mov', new Map([
      ['c:v', 'prores'],
      ['c:a', 'pcm_s24le'],
      ['aspect', '16:9']
    ]));
    output.addStreams([
      lifeInput.streamSpecifier(0),
      sineInput.streamSpecifier(0),
      sineInput.streamSpecifier(0)
    ]);
    cmd.addOutput(output, mappings = [[lifeInput, 0], [sineInput, 0], [sineInput, 0]]);
    const expected = `${config.ffmpeg_bin} -y -re -r "23.976" -f "lavfi" -i "life=size=320x240:mold=10:rate=23.976:ratio=0.5:death_color=#C83232:life_color=#00ff00:stitch=0,scale=1920:1080" -re -r "23.976" -f "lavfi" -i "sine=frequency=620:beep_factor=4:duration=9999999999:sample_rate=48000" -c:v "prores" -c:a "pcm_s24le" -aspect "16:9" -map "0:0" -map "1:0" -map "1:0" "gen.mov"`;
    expect(cmd.toString()).to.eql(expected);
  });

});
