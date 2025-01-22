/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_PARAM_SCHEME_JSON = '../../json/param/dump.json';
const DEFAULT_CONSOLE_WIDTH_MIN = 60;
const DEFAULT_REFRESH = 1000;
const DEFAULT_SILENT = true;
const DEFAULT_BASE = 1024;
const DEFAULT_PREC = 2;
const DEFAULT_FIXED = true;
const DEFAULT_THROW = true;

//
import Application from '../shared/app.js';
import Parameter from '../shared/param.js';
import Quant from '../shared/quant.js';
import Helper from './helper.js';
import path from 'node:path';
import fs from 'node:fs';

//
class Dump extends Quant
{
	constructor(_param = null, ... _args)
	{
		//
		super(null, ... _args);

		//
		if(!(this.param = _param))
		{
			throw new Error('No _param defined');
		}
		
		if(console.width > 0 && console.width < DEFAULT_CONSOLE_WIDTH_MIN)
		{
			console.error('Your terminal is too small.. My hope were ' + DEFAULT_CONSOLE_WIDTH_MIN + ' columns.');
			return process.exit(true);
		}
		
		//
		Application.registerExitHandler((... _a) => this.onExit(... _a));
		
		new Application(this, { silent: DEFAULT_SILENT,
			callback: (... _a) => this.onApplication(... _a),
			name: 'Dump', param: this.param,
			config: this.param.get('config') });
	}

	onExit(_name, _code, ... _args)
	{
		return this.destroy(_name, _code, ... _args);
	}
	
	//
	onApplication(_app, _info, _config, _object, _data)
	{
		new Parameter((_check, _scheme, _instance) => {
			//
			if(!_check)
			{
				throw new Error("TODO/DEBUG");
			}

			//
			var path = this.param.get('path');
			
			if(isRadix(this.param.get('radix')))
			{
				this.radix = this.param.get('radix');
			}
			else
			{
				this.radix = this.getConfig('radix');
			}
			
			if(!pathname(path)) for(var i = 0; i < this.param.length; ++i)
			{
				if(pathname(this.param[i]))
				{
					path = this.param.splice(i, 1)[0];
					break;
				}
			}

			if(process.STDIN)
			{
				this.path = '-';
			}
			else if(!pathname(this.path = path))
			{
				console.error('Missing file path parameter (and also no stdin input).');
				return process.exit(true);
			}
			else if(this.path === '/dev/stdin')
			{
				this.path = '-';
			}

			//
			this.radixDigits = Math.digits(this.radix, 256);

			if(int(this.param.get('refresh')) || bool(this.param.get('refresh')))
			{
				this.refresh = this.param.get('refresh');
			}
			else
			{
				this.refresh = this.getConfig('refresh');
			}

			if(this.refresh === true)
			{
				this.refresh = DEFAULT_REFRESH;
			}

			if(!int(this.refresh) || this.refresh < 1)
			{
				this.refresh = null;
			}

			//
			//TODO/check for validity!! ..
			//
			this.design = this.getConfig('design');
			
			//
			if(bool(this.param.get('ansi')))
			{
				process.ansi = console.ansi = this.param.get('ansi');
			}
			else
			{
				process.ansi = console.ansi = this.getConfig('ansi');
			}
			
			//
			if(!bool(this.head = this.param.get('head')) && !int(this.head))
			{
				this.head = this.getConfig('head');
			}
			
			if(!bool(this.tail = this.param.get('tail')) && !int(this.tail))
			{
				this.tail = this.getConfig('tail');
			}
			
			if(int(this.head) && this.head < 1)
			{
				console.error('The --head parameter needs to be positive');
				return process.exit(true);
			}
			
			if(int(this.tail) && this.tail < 1)
			{
				console.error('The --tail parameter needs to be positive');
				return process.exit(true);
			}
			
			if(this.head && this.tail)
			{
				console.error('You can\'t use both --head and --tail together!');
				return process.exit(true);
			}
			
			//
			if(!bool(this.locale = this.getConfig('locale')))
			{
				console.error('Invalid configuration[`locale`] (expecting a Boolean)');
			}

			//
			if(!bool(this.filter = this.param.get('filter')))
			{
				this.filter = this.getConfig('filter');
			}

			//
			if(!isRadix(this.replace = this.param.get('replace')) &&
					!bool(this.replace))
			{
				if(!isRadix(this.replace = this.getConfig('replace')) && !bool(this.replace))
				{
					this.replace = false;
				}
			}

			if(!int(this.heat = this.param.get('heat')))
			{
				if(!int(this.heat = this.param.get('heat')))
				{
					this.heat = null;
				}
			}

			if(this.heat < 2)
			{
				this.heat = null;
			}
			else if(this.heat > 256)
			{
				this.heat = 256;
			}

			if(this.heat !== null)
			{
				if(this.heat < 2)
				{
					this.heat = 0;
				}
				else if(this.heat > 256)
				{
					this.heat = 256;
				}
			}
			
			if(!string(this.color = this.param.get('color'), false) &&
					this.color !== null)
			{
				if(!array(this.color = this.getConfig('design.color'), false) && !string(this.color, false) && this.color !== null)
				{
					this.color = null;
				}
			}
			
			if(this.color !== null)
			{
				try
				{
					this.color = Dump.generateColorization(this.color, true);
				}
				catch(_err)
				{
					console.error('[--color] ' + _err.message);
					process.exit(true);
				}
			}
			
			//
			this.high = Helper.parseBytes(this.param.get('high'));
			
			if((this.only = Helper.parseBytes(this.param.get('only'))).size === 0)
			{
				this.only = null;
			}
			
			this.without = Helper.parseBytes(this.param.get('without'));

			//
			this.consoleHeightSub = this.getConfig('consoleHeightSub');

			//
			this.open();
			this.reset();

			//
			if(this.isStdIn)
			{
				if(this.refresh)
				{
					console.error('You can\'t --refresh with stdin data.');
					return process.exit(true);
				}
				
				if(this.tail)
				{
					throw new Error('TODO (--tail with stdin input)!');
				}
			}

			if(this.param.has('start'))
			{
				if(this.stats.size)
				{
					this.start = Math.getIndex.number(
						this.param.get('start'), this.stats.size);
				}
				else if(this.param.get('start') >= 0)
				{
					this.start = this.param.get('start');
				}
				else
				{
					console.error('Since your input file doesn\'t seem to have a specific size, you can\'t use negative --start.');
				}
			}
			else
			{
				this.start = 0;
			}

			if(this.param.has('stop'))
			{
				if(this.stats.size)
				{
					this.stop = Math.getIndex.number(
						this.param.get('stop'), this.stats.size);
				}
				else if(this.param.get('stop') >= 0)
				{
					this.stop = this.param.get('stop');
				}
				else
				{
					console.error('Since your input file doesn\'t seem to have a specific size, you can\'t use negative --stop.');
				}
			}
			else if(this.stats.size)
			{
				this.stop = (this.stats.size - 1);
			}
			else
			{
				this.stop = null;
			}
			
			if(this.stop !== null && this.start > this.stop)
			{
				console.error('Your --start can\'t be higher than --stop!');
				return process.exit(true);
			}

			//
			process.stdout.on('resize', () => this.onResize());

			//
			this.print();
		}, path.join(this.param.get('script'),
			DEFAULT_PARAM_SCHEME_JSON), this.param);
	}
	
	destroy(_name, _code, ... _args)
	{
		this.destroying = true;
		if(this.handle) fs.closeSync(this.handle);
		return super.destroy(... _args);
	}
	
	get isFile()
	{
		return (this.path !== '-');
	}

	get isStdIn()
	{
		return (this.path === '-');
	}

	//
	open()
	{
		if(this.isStdIn)
		{
			this.handle = 0;
		}
		else
		{
			this.handle = fs.openSync(this.path, 'r');
		}
		
		this.stats = fs.fstatSync(this.handle, { bigint: false });
		return true;
	}
	
	static write(_string)
	{
		return process.stdout.write(_string);
	}

	static replace(_byte, _radix = this.replace)
	{
		return Number.map(_byte, _radix);
	}
	
	static generateColorization(_color)
	{
		const checkArray = (_array) => {
			for(var i = 0; i < _array.length; ++i)
			{
				if(array(_array[i], true))
				{
					if(_array[i].length !== 3)
					{
						_array.splice(i--, 1);
					}
					else for(var j = 0; j < _array[i].length; ++j)
					{
						if(string(_array[i][j], true))
						{
							if(isNaN(_array[i][j] = Number(_array[i][j])))
							{
								_array.splice(i--, 1);
								break;
							}
						}

						if(!byte(_array[i][j]))
						{
							_array.splice(i--, 1);
							break;
						}
					}
				}
				else if(string(_array[i], true))
				{
					if(! (_array[i] = Helper.parseColors(_array[i])))
					{
						_array.splice(i--, 1);
					}
					else
					{
						_array[i] = _array[i][0];
					}
				}
			}
			
			if(_array.length === 0) return null;
			else if(_array.length > 256) _array.length = 256;
			return _array;
		};
		
		var result;
		
		if(array(_color, true))
		{
			result = checkArray(_color);
		}
		else if(string(_color, true))
		{
			if(result = Helper.parseColors(_color))
			{
				if(result.length > 256)
				{
					result.length = 256;
				}
			}
		}
		else
		{
			result = null;
		}
		
		return result;
	}

	renderChar(_byte)
	{
		var fg, bg;
		var h;

		if(this.heat !== null)
		{
			h = (256 / (this.heat - 1));
			h = Math.max(0, Math._round((h * (_byte % this.heat)) - 1));
			bg = [ h, h, h ];
			h = (255 - h);
			fg = [ h, h, h ];
		}
		else
		{
			fg = bg = null;
		}
		
		if(this.only && !this.only.has(_byte))
		{
			return String.none() + ' ';
		}
		else if(this.without.has(_byte))
		{
			return String.none() + ' ';
		}

		var result;

		if(_byte === 0 || _byte === 255)
		{
			if(this.replace !== false)
			{
				result = Dump.replace(_byte, this.replace);
			}
			else if(isRadix(this.design.null.left.replace) ||
				this.design.null.left.replace === true)
			{
				result = Dump.replace(_byte, this.design.null.left.replace);
			}
			else if(string(this.design.null.left.replace, false))
			{
				result = this.design.null.left.replace[0];
			}
			else
			{
				result = ' ';
			}

			if(! (fg && bg))
			{
				fg = this.design.null.left.fg;
				bg = this.design.null.left.bg;
			}
		}
		else if(_byte < 32 || _byte === 127)
		{
			if(this.replace !== false)
			{
				result = Dump.replace(_byte, this.replace);
			}
			else if(isRadix(this.design.nonPrintable.left.replace) ||
				this.design.nonPrintable.left.replace === true)
			{
				result = Dump.replace(_byte,
					this.design.nonPrintable.left.replace);
			}
			else if(string(this.design.nonPrintable.left.replace, false))
			{
				result = this.design.nonPrintable.left.replace[0];
			}
			else
			{
				result = '-';
			}

			if(! (fg && bg))
			{
				fg = this.design.nonPrintable.left.fg;
				bg = this.design.nonPrintable.left.bg;
			}
		}
		else if(_byte > 127)
		{
			if(this.replace !== false)
			{
				result = Dump.replace(_byte, this.replace);
			}
			else if(isRadix(this.design.ansi.left.replace) ||
				this.design.ansi.left.replace === true)
			{
				result = Dump.replace(_byte,
					this.design.ansi.left.replace);
			}
			else if(string(this.design.ansi.left.replace, false))
			{
				result = this.design.ansi.left.replace[0];
			}
			else
			{
				result = '+';
			}

			if(! (fg && bg))
			{
				fg = this.design.ansi.left.fg;
				bg = this.design.ansi.left.bg;
			}
		}
		else
		{
			if(this.replace !== false)
			{
				result = Dump.replace(_byte, this.replace);
			}
			else if(isRadix(this.design.printable.left.replace) ||
				this.design.printable.left.replace === true)
			{
				result = Dump.replace(_byte,
					this.design.printable.left.replace);
			}
			else if(string(this.design.printable.left.replace, false))
			{
				result = this.design.printable.left.replace[0];
			}
			else
			{
				result = String.fromCharCode(_byte);
			}

			if(! (fg && bg))
			{
				fg = this.design.printable.left.fg;
				bg = this.design.printable.left.bg;
			}
		}

		if(this.high.has(_byte))
		{
			result = result.text.bold(true).
				fg(0, 0, 0, false).
				bg(255, 255, 255, false);
		}
		else
		{
			result = result.
				fg(... fg, false).
				bg(... bg, false);
		}

		return result;
	}
	
	//
	onResize()
	{
		this.clear();
		this.reset();
		this.print();
	}
	
	reset()
	{
		this.columns = this.calculateColumns();
		this.lines = this.calculateLines();
		this.bytes = this.calculateBytes();
	}

	clear()
	{
		this.linesPrint = 0;
		console.clear();
	}

	//
	handleChunk(_buffer, _position, _fin)
	{
		//
		if(this.filter)
		{
			var isSame = true;
			
			if(_buffer.length < this.columns || this.columns === 0)
			{
				isSame = false;
			}
			else for(var i = 1; i < _buffer.length; ++i)
			{
				if(_buffer[i] !== _buffer[0])
				{
					isSame = false;
					break;
				}
			}
			
			if(isSame)
			{
				if(this.sameByte !== null && this.sameByte !== _buffer[0])
				{
					this.printSame();
				}
			
				this.sameBytes += _buffer.length;
				this.sameByte = _buffer[0];
				++this.sameLines;

				return this.linesPrint;
			}
			else if(this.sameByte !== null)
			{
				this.printSame();
			}
		}
		
		//
		var left = '';
		var right = '';

		//
		var i = 0, column; for(; i < _buffer.length; ++i)
		{
			//
			left += this.renderChar(_buffer[i]);

			//
			if(this.only && !this.only.has(_buffer[i]))
			{
				column = String.none() + ' '.repeat(this.radixDigits);
			}
			else if(this.without.has(_buffer[i]))
			{
				column = String.none() + ' '.repeat(this.radixDigits);
			}
			else
			{
				column = _buffer[i].toString(this.radix).padStart(this.radixDigits, this.design.right.pad);
				
				if(this.high.has(_buffer[i]))
				{
					column = column.bold(true).fg(255, 255, 255, false);
				}
				else if(this.color)
				{
					const h = Math._floor(256 / this.color.length);
					var fg;
					
					for(var j = 0; j < this.color.length; ++j)
					{
						if(_buffer[i] <= (h * (j + 1)))
						{
							fg = this.color[j];
							break;
						}
					}
					
					column = column.fg(... fg, false);
				}
				else if(_buffer[i] === 0 || _buffer[i] === 255)
				{
					column = column.fg(... this.design.null.right.fg, false);
				}
				else if(_buffer[i] > 127)
				{
					column = column.fg(... this.design.ansi.right.fg, false);
				}
				else if(_buffer[i] === 127 || _buffer[i] < 32)
				{
					column = column.fg(... this.design.nonPrintable.right.fg, false);
				}
				else
				{
					column = column.fg(... this.design.printable.right.fg, false);
				}
			}

			if(i > 0)
			{
				column = ' ' + column;
			}
			
			right += column;
		}
		
		var diff = (this.columns - i);
		
		if(diff > 0)
		{
			diff = this.design.empty.left.replace.repeat(diff);
			diff = diff.fg(... this.design.empty.left.fg, false).
				bg(... this.design.empty.left.bg, false);
			left += diff;
		}
		
		const line = (this.lineBegin + left + String.none() + ' ' + right + String.none());

		Dump.write(line + EOL); 
		return ++this.linesPrint;
	}
	
	get emptyLineBegin()
	{
		return ((' ').repeat(this.lineBegin.textLength));
	}

	get lineBegin()
	{
		return (' ' + (this.linesPrint % 256).toString(this.radix).padStart(this.radixDigits, '0') + ' ').faint(true);
	}

	printSame()
	{
		//
		if(!this.filter)
		{
			return false;
		}
		
		if(this.sameByte === null)
		{
			return this.linesPrint;
		}

		//
		var PREFIX = (this.sameByte === 0 ? ' EMPTY ' : ' SAME ');
		var BYTE = this.sameByte.toString(this.radix);
		if(process.ansi) BYTE = BYTE.bold(true);
		BYTE = ('\\' + BYTE).pad(this.radixDigits + 1, ' ', true);
		PREFIX += BYTE + ' ';
		if(process.ansi) PREFIX = PREFIX.inverse();
		if(this.sameByte !== 0) PREFIX = ' ' + PREFIX;
		
		const size = Math.size(this.sameBytes, DEFAULT_BASE, DEFAULT_PREC, DEFAULT_FIXED, process.ansi);

		if(this.radix !== 10)
		{
			this.sameLines = this.sameLines.toString(this.radix);
			this.sameBytes = this.sameBytes.toString(this.radix);
		}
		else if(this.locale)
		{
			this.sameLines = this.sameLines.toLocaleString();
			this.sameBytes = this.sameBytes.toLocaleString();
		}
		else
		{
			this.sameLines = this.sameLines.toString();
			this.sameBytes = this.sameBytes.toString();
		}

		if(process.ansi)
		{
			this.sameLines = this.sameLines.bold(true);
			this.sameBytes = this.sameBytes.bold(true);
		}

		Dump.write(this.emptyLineBegin + PREFIX + ' { lines: ' + this.sameLines + ', bytes: ' + this.sameBytes + ', size: ' + size + ' }' + EOL);

		//
		this.sameByte = null;
		this.sameLines = this.sameBytes = 0;
		return ++this.linesPrint;
	}

	//
	//TODO/TEST this more, pls.!1
	//
	calculateColumns()
	{
		/*var columns = 0;
		var length = this.lineBegin.textLength;

		while((length + columns + 3 + this.radixDigits) <= (console.width || 80))
		{
			length += ((255).toString(this.radix) + ' ').length;
			++columns;
		}

		return columns;*/

		return Math._floor(
			((console.width || 80) - this.lineBegin.textLength) /
				(this.radixDigits + 2));
	}

	calculateLines()
	{
		if(this.stats)
		{
			return Math._ceil(this.stats.size / this.columns);
		}
		
		return null;
	}
	
	calculateBytes()
	{
		if(!this.stats.size)
		{
			return 0;
		}
		
		if(int(this.head))
		{
			return Math._floor(this.columns * this.head);
		}
		
		if(int(this.tail))
		{
			return Math._floor(this.columns * this.tail);
		}
		
		if(this.head || this.tail)
		{
			return Math._floor(this.columns * (console.height - this.consoleHeightSub));
		}
		
		return this.stats.size;
	}

	//
	print()
	{
		//
		if(this.linesPrint)
			Dump.write(
				String.up(this.linesPrint) +
					String.clearAfter());
		this.linesPrint = 0;
		
		if(this.filter)
		{
			this.sameByte = null;
			this.sameLines = 0;
			this.sameBytes = 0;
		}

		//
		const checkLimits = () => {
			if(this.head || this.tail)
			{
				if(this.head === true || this.tail === true)
				{
					if(this.linesPrint >= (console.height - this.consoleHeightSub))
					{
						return true;
					}
				}
				else if(int(this.head))
				{
					if(this.linesPrint >= this.head)
					{
						return true;
					}
				}
				else if(int(this.tail))
				{
					if(this.linesPrint >= this.tail)
					{
						return true;
					}
				}
			}
			
			return false;
		};
		
		//
		var start = this.start;
		var fin = false;
		var total = 0;
		var buffer;
		var diff;

		//
		if(this.isStdIn)
		{
			process.stdin.setEncoding('latin1');//(null) won't work here?
			process.stdin.on('data', (_chunk) => {
				for(var i = start; i < _chunk.length; i += this.columns)
				{
					buffer = Uint8Array.create(_chunk.substr(i, this.columns));
					total += buffer.length;

					if(this.stop !== null)
					{
						diff = (this.stop - this.start - total + 1);

						if(diff < 0)
						{
							buffer = buffer.slice(0, diff);
							fin = true;
						}
					}
					else if(buffer.length < this.columns)
					{
						fin = true;
					}

					if(buffer.length > 0)
					{
						this.handleChunk(buffer, i, fin);
					}
					
					if(fin || (fin = checkLimits()))
					{
						return process.exit(0);
					}
				}
			});
			
			process.stdin.once('end', () => {
				if(this.filter && this.sameByte !== null)
					this.printSame();
				process.exit(0);
			});
		}
		else
		{
			//
			if(this.tail && this.stop !== null && this.bytes)
			{
				diff = (this.stop - this.start - this.bytes);
				if(diff > 0) start += diff;
			}

			buffer = new Uint8Array(this.columns);
			var position = start;
			var read;

			//
			do
			{
				read = fs.readSync(this.handle, buffer, 0, buffer.length, position);

				if(read === 0)
				{
					fin = true;
					break;
				}
				else if(read < this.columns)
				{
					buffer = buffer.slice(0, read);
					fin = true;
				}

				position += read;
				total += read;

				if(this.stop !== null)
				{
					diff = (position - this.stop - 1);

					if(diff >= 0)
					{
						if(diff > 0)
						{
							buffer = buffer.slice(0, -diff);
						}

						fin = true;
					}
				}

				if(buffer.length > 0)
				{
					this.handleChunk(buffer, position, fin);
				}
				
				if(fin || (fin = checkLimits()))
				{
					if(this.filter && this.sameByte !== null)
						this.printSame();
					break;
				}
			}
			while(!fin);
		}

		//
		if(this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
		if(this.refresh) this.timeout = setTimeout(
			() => { this.timeout = null; this.print() },
				this.refresh);
	}
}

export default Dump;

//

