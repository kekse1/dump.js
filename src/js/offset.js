#!/usr/bin/env node

/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://kekse.biz/ https://github.com/kekse1/javascript/
 * v1.0.2
 *
 * With this script, you can calculate and convert between offsets and
 * lines with columns, or count them, etc. Without any parameter it'll
 * show you the whole countings, and with another parameter combination
 * you can even get to know how many columns a specific line has. ETC.
 *
 * Please start with `--help / -?` parameter.
 */

//
const DEFAULT_ANSI = true; // the default; also: `--no-ansi` or `-a`;

//
const HELP = `
	Syntax: $0 [ <file> ] <offset/line> [ <column> ]
		--help / -h
		--no-ansi / -a

The optional file path can be anywhere in your command line,
but if you define both integer parameters, their order counts.

By default the file path is set to '-', which means your stdin.

The '--no-ansi' or '-a' parameter will disable ANSI escape sequences,
so nothing's going to be printed with styles (mostly bold). Will also
(automatically) be disabled if the output stream is not a terminal.

Here are the allowed parameter constellations:

 * (a) = null
 * (b) = null
 *	.. shows how many offsets, columns and lines are counted in total.
 * (a) = int > 0
 * (b) = null
 *	.. as offset param, this will show you a line/column to it.
 * (a) = int > 0
 * (b) = int = 0
 *	.. displays how many columns your specific line has.
 * (a) = int > 0
 * (b) = int > 0
 * 	.. displays an offset to line/column comb.

The exit code is one of the following ones:

	0	OK; everything's fine.
	1	Invalid parameter: first parameter needs to be a positive Integer
	2	Invalid parameter: multiple file parameters are not possible
	3	Invalid parameter: you already set all possible paramters
	4	Offset parameter exceeds input file limit
	5	Line parameter exceeds input file limit
	6	Column parameter exceeds input file limit
	7	Input file is empty (only with at least one parameter)
	8	File doesn't exist (when trying to set parameter)
	9	Unable to open file
`;

//
const ESC = String.fromCharCode(27);

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

//
var ANSI = DEFAULT_ANSI;

var stream;
var file, a, b;

var offset = -1;
var column = 0;
var line = 1;

//
const out = (_string) => process.stdout.write(_string + os.EOL);
const err = (_string) => process.stderr.write(_string + os.EOL);
const bold = (_string, _type) => { if(!ANSI) return _string;
	const stream = (_type === 'out' ? process.stdout : process.stderr);
	if(!stream.isTTY) return _string; return `${ESC}[1m${_string}${ESC}[0m`; };

//
const onData = (_chunk) => {
	for(var i = 0; i < _chunk.length; ++i)
	{
		//
		++offset;

		if(_chunk[i] === 10)
		{
			if(_chunk[i + 1] === 13)
			{
				++offset;
				++i;
			}
			
			column = 0;
			++line;
		}
		else if(_chunk[i] === 13)
		{
			if(_chunk[i + 1] === 10)
			{
				++offset;
				++i;
			}
			
			column = 0;
			++line;
		}
		else
		{
			++column;
		}
		
		//
		if(a !== null)
		{
			// show line/column to specif offset (a)
			if(b === null)
			{
				if(offset === a)
				{
					return finish();
				}
			}
			// show columns for a line (a)
			else if(b === 0)
			{
				if(a === line)
				{
					for(++offset; offset < _chunk.length; ++offset, ++column)
					{
						if(_chunk[offset] === 10 || _chunk[offset] === 13)
						{
							break;
						}
					}

					return finish();
				}
			}
			// show offset for line & column
			else
			{
				if(a === line && b === column)
				{
					return finish();
				}
			}
		}
	}
};

//
const onEnd = (_chunk) => {
	if(_chunk && _chunk.length > 0) onData(_chunk);
	return finish(); };

const finish = () => {
	//
	var wasOpen; if(wasOpen = (stream !== process.stdin && !(stream.closed || stream.destroyed)))
	{
		stream.destroy();
	}
	
	//
	if(column === 0)
	{
		--line;
	}

	//
	printInfo();

	if(offset < 0)
	{
		out(' Length: ' + bold('0'));
		process.exit(a === null ? 0 : 7);
	}

	//
	if(a === null && b === null)
	{
		out(' Length: ' + bold((offset + 1).toString()));
		out('  Lines: ' + bold(line.toString()));
		process.exit(0);
	}

	//
	if(b === null)
	{
		if(a > offset)
		{
			err(`The ${bold('offset', 'err')} parameter exceeds limit (${offset}).`);
			process.exit(4);
		}
	}
	else if(a > line)
	{
		err(`The ${bold('line', 'err')} parameter exceeds limit (${line}).`);
		process.exit(5);
	}
	else if(b > column)
	{
		err(`The ${bold('column', 'err')} parameter exceeds limit (${column}).`);
		process.exit(6);
	}
	
	//
	out(' Offset: ' + bold(offset.toString()));
	out('   Line: ' + bold(line.toString()));
	out((b > 0 ? ' Column: ' : 'Columns: ') + bold(column.toString()));
	
	//
	process.exit();
};

const setupStream = (_file = file) => {
	if(_file === '-') { file = _file; stream = process.stdin; }
	else { try { file = fs.realpathSync(_file, { encoding: 'utf8' });
		stream = fs.createReadStream(_file, {
			encoding: null, autoClose: true, emitClose: true }); }
		catch(_err) { err(_err.message); process.exit(9); }}
	stream.on('data', onData); stream.once('end', onEnd); };

//
const printInfo = () => {
	if(file !== '-')
	{
		out('   Path: ' + bold(file));
		out('   File: ' + bold(path.basename(file)));
	}
};

//
const showHelp = (_exit = 0) => { out(HELP); process.exit(_exit); };
const checkArgumentVector = (_vector = process.argv, _start = 2) => {
	//
	const invalid = (_exit, _info = '') => {
		err('Invalid parameter(s)' + (_info ? ': ' + _info : '!'));
		err('Please call with `--help` or `-?` to get to know more.');
		return process.exit(_exit);
	};

	//
	var file = null, a = null, b = null;

	for(var i = _start; i < _vector.length; ++i)
	{
		if(_vector[i].length === 0)
		{
			continue;
		}
		else if(_vector[i] === '--')
		{
			break;
		}
		else if(_vector[i] === '--help' || _vector[i] === '-?')
		{
			return showHelp();
		}
		else if(_vector[i] === '--no-ansi' || _vector[i] === '-a')
		{
			ANSI = false;
		}
		else if(!isNaN(_vector[i]))
		{
			if(a === null)
			{
				a = Number(_vector[i]);
			}
			else if(b === null)
			{
				b = Number(_vector[i]);
			}
			else if(file === null)
			{
				if(fs.existsSync(_vector[i]))
				{
					file = _vector[i];
				}
				else
				{
					invalid(8, 'File doesn\'t exist');
				}
			}
			else
			{
				return invalid(3, 'All parameters are already defined');
			}
		}
		else if(file === null)
		{
			if(fs.existsSync(_vector[i]))
			{
				file = _vector[i];
			}
			else
			{
				invalid(8, 'File doesn\'t exist');
			}
		}
		else
		{
			return invalid('You can argue with multiple files');
		}
	}
	
	//
	if((a === null || a === 0) && b !== null)
	{
		return invalid(1, 'First number needs to be set and above zero');
	}
	else if(file === null || file === '/dev/stdin')
	{
		file = '-';
	}
	
	//
	return [ file, a, b ];
};

//
[ file, a, b ] = checkArgumentVector();
setupStream(file);

//
