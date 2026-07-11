/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_PARAM_SCHEME_JSON = '../../json/param/dump.util.json';
const DEFAULT_SILENT = true;
const DEFAULT_ENCODING = 'latin1';//'utf8';
const DEFAULT_PRECISION = 2;

//
import Quant from '../shared/quant.js';
import Application from '../shared/app.js';
import Parameter from '../shared/param.js';
import GetOpt from '../shared/getopt.js';
import XML from '../shared/xml.js';
import Helper from './helper.js';
import path from 'node:path';
import fs from 'node:fs';

//
class Utility extends Quant
{
	constructor(_param = null, _util = null, ... _args)
	{
		//
		super(null, ... _args);
		
		//
		if(!(this.param = _param))
		{
			throw new Error('Missing _param argument');
		}
		
		if(!string(_util, false))
		{
			throw new Error('Missing _util argument');
		}

		if(!func(this[this.util = _util]))
		{
			console.error('The utility `' + _util + '` is not available.');
			process.exit(254);
		}

		//
		Application.registerExitHandler((... _a) => this.onExit(... _a));
		
		new Application(this, { silent: DEFAULT_SILENT,
			callback: (... _a) => this.onApplication(... _a),
			name: 'Dump/Utility', param: this.param,
			config: this.param.get('config') });
	}
	
	static get utilities()
	{
		return [ 'count', 'sum', 'rot13', 'print', 'xml', 'ansi', 'limits' ];
	}

	static help(_exit = null)
	{
		const utils = this.utilities; utils.unshift('help'.bold(true));
		console.log('These are the available utilties (just argue with one of them):' + EOL);
		for(const u of utils) console.log('\t' + u);
		console.eol();
		if(_exit === true) process.exit();
		else if(byte(_exit)) process.exit(_exit);
		return utils;
	}

	onExit(_name, _code, ... _args)
	{
		//
	}
	
	onApplication(_app, _info, _config, _object, _data)
	{
		//
		new Parameter((_check, _scheme, _instance) => {
			//
			if(!_check)
			{
				throw new Error('Invalid parameters');
			}
			
			//
			if(process.stdout.isTTY)
			{
				if(this.param.has('ansi'))
				{
					process.ansi = this.param.get('ansi');
				}
				else
				{
					process.ansi = this.getConfig('ansi');
				}
			}
			else
			{
				process.ansi = null;
			}

			//
			var file = null, stats = null;
			
			for(var i = 0; i < this.param.length; ++i)
			{
				if(string(this.param[i], false)) try
				{
					file = path.resolve(this.param[i]);
					stats = fs.statSync(file, {
						bigint: false, throwIfNoEntry: true });

					if(! (stats.isFile() || stats.isBlockDevice() || stats.isCharacterDevice()))
					{
						file = null;
						stats = null;
					}
					else
					{
						this.param.splice(i, 1);
						break;
					}
				}
				catch(_err)
				{
					file = null;
					stats = null;
					continue;
				}
			}
			
			if(!file)
			{
				console.error('Missing or invalid file path parameter.');
				process.exit(true);
			}
			else if(stats.size < 1)
			{
				if(!this.param.has('size'))
				{
					console.error('Unable to determine file size, so please argue with `--size`.');
					console.warn('But maybe this file is just empty..!');
					process.exit(true);
				}
				
				stats.size = this.param.get('size');
			}
			else
			{
				this.path = file;
				this.stats = stats;
			}

			//
			if(this.param.has('size'))
			{
				this.size = Math.min(
					this.param.get('size'),
					stats.size);
			}
			else
			{
				this.size = stats.size;
			}

			if(this.param.has('offset'))
			{
				this.offset = this.param.get('offset');
			}
			else
			{
				this.offset = 0;
			}
			
			if(this.offset < 0)
			{
				this.offset = (stats.size + this.offset);
			}

			if(this.size > (stats.size - this.offset))
			{
				this.size = (stats.size - this.offset);
			}

			//
			const prepareCallback = () => {
				this.stream = fs.createReadStream(file, {
					encoding: DEFAULT_ENCODING,
					autoClose: true,
					emitClose: true,
					start: this.offset,
					end: (this.offset + this.size - 1) });

				this.stream.on('data', (_c, ... _a) => this.onData(_c, ... _a));
				this.stream.on('end', (... _a) => this.onEnd(... _a));
				const _destroy = this.stream.destroy.bind(this.stream);
			
				this.stream.destroy = (... _a) => {
					_destroy(... _a);
					this.onEnd(... _a);
				};
			};

			//
			this.prepare(this.util, prepareCallback);
		}, path.join(this.param.get('script'),
			DEFAULT_PARAM_SCHEME_JSON), this.param);
	}
	
	sum(_chunk, ... _args)
	{
		this.counting += _chunk.length;
		this.length += _chunk.length;
		
		var byte; for(var i = 0; i < _chunk.length; ++i)
		{
			if(this.only)
			{
				if(this.only.has(_chunk[i]))
				{
					byte = _chunk[i];
				}
				else
				{
					byte = null;
				}
			}
			else if(this.without.has(_chunk[i]))
			{
				byte = null;
			}
			else
			{
				byte = _chunk[i];
			}
			
			if(byte !== null)
			{
				this.result += BigInt(byte);
			}
			else
			{
				--this.counting;
				++this.filteredBytes;
			}
		}
	}

	get filtered()
	{
		if(this.only || this.without.size > 0)
		{
			return this.filteredBytes;
		}
		
		return 0;
	}

	checkFilter()
	{
		var filtered = this.filteredBytes;
		var counting = this.counting;
		var total = this.length;
		var percent = Math.round(counting / total * 100,
			DEFAULT_PRECISION);

		/*if(!filtered)
		//if(!total)
		{
			return false;
		}*/
		
		if(this.radix !== 10)
		{
			filtered = filtered.toString(this.radix);
			counting = counting.toString(this.radix);
			total = total.toString(this.radix);
			percent = percent.toString(this.radix);
		}
		else if(this.locale)
		{
			filtered = filtered.toLocaleString();
			counting = counting.toLocaleString();
			total = total.toLocaleString();
			percent = percent.toLocaleString();
		}
		else
		{
			filtered = filtered.toString();
			counting = counting.toString();
			total = total.toString();
			percent = percent.toString();
		}
		
		if(process.ansi)
		{
			filtered = filtered.bold(true).warn(true);
			counting = counting.bold(true).info(true);
			total = total.bold(true).error(true);
			percent = percent.bold(true).info(true);
			percent += '%'.error(true);
		}
		else
		{
			percent += '%';
		}

		console.log();
		
		if(this.filteredBytes)
		{
			console.info(('Data ' + 'filtered'.bold(true)).debug(true) +
				': ' + counting + ' Bytes counted (' + total + ' in total; '.
					debug(true) + filtered + ' filtered out)'.debug(true));
		}
		else if(this.length)
		{
			console.info('Received ' + total + ' Bytes (' +
				('and ' + 'nothing'.bold(true) + ' was filtered)').
					debug(true) + '.');
		}
		else
		{
			console.error('No bytes received. So nothing\'s done..');
		}
		
		//if(this.counting >= 1024 || this.length >= 1024 || this.filtered >= 1024)
		if(this.counting >= 1024 || this.filtered >= 1024)
		{
			console.debug('               ' + Math.size.styled(this.counting).
				info(true) + ' counted (' + Math.size.styled(this.length).
				error(true) + ' in total; '.debug(true) + Math.size.styled(
					this.filtered).warn(true) + ' filtered out)'.debug(true));
		}
		
		if(this.filteredBytes)
		{
			console.debug('            => ' + percent);
		}
	}

	countLines(_char)
	{
		if(this.lines[EOL[0]] === 0)
		{
			this.lines[EOL[0]] = 1;

			if('rows' in this.lines)
			{
				this.lines.rows = 1;
			}
		}

		if(typeof _char === 'number')
		{
			_char = String.fromCodePoint(_char);
		}

		const ret = (_res) => {
			if(!_res && this.stream) setTimeout(() => {
				this.stream.destroy();
				this.stream = null;
			});
	
			return _res;
		};

		var newLine = false;
		var result = true;

		if(_char in this.lines)
		{
			newLine = true;
			++this.lines[_char];

			if(this.lineLimit !== null && this.lines[_char] > this.lineLimit)
			{
				result = false;
			}
		}

		if(this.column !== null && ++this.column >= this.width)
		{
			newLine = true;
		}

		if(newLine)
		{
			++this.lines.rows;
			this.column = 0;

			if(result && this.lineLimit !== null && this.lines.rows > this.lineLimit)
			{
				result = false;
			}
		}
		
		return ret(result);
	}

	checkLines()
	{
		var str;

		if(this.reachedLineLimit !== null && this.reachedLineLimit < this.stats.size)
		{
			str = 'Output stopped because line limit ('.debug(true) +
				this.lineLimit.toLocaleString().bold(true).error(true) +
				') has been reached!'.debug(true) + EOL;
		}
		else
		{
			str = '';
		}

		if(this.lines['\n'])
		{
			if(this.lines['\n'] > 1)
			{
				--this.lines['\n'];
			}

			str += '   ['.debug(true) + '\\n'.error(true) +
				']'.debug(true) + ' ';
			str += this.lines['\n'].toLocaleString().
				bold(true).info(true) + EOL;
		}

		if(this.lines['\r'])
		{
			if(this.lines['\r'] > 1)
			{
				--this.lines['\r'];
			}

			str += '   ['.debug(true) + '\\r'.error(true) +
				']'.debug(true) + ' ';
			str += this.lines['\r'].toLocaleString().
				bold(true).info(true) + EOL;
		}

		if(this.lines['rows'])
		{
			if(this.lines.rows > 1)
			{
				--this.lines.rows;
			}

			str += ' ['.debug(true) + 'rows'.error(true) + ']'.debug(true) + ' ';
			str += this.lines['rows'].toLocaleString().
				bold(true).info(true) + EOL;
		}

		if(str.length > 0)
		{
			console.log(str);
		}

		return str;
	}
	
	showSum()
	{
		var counting = this.counting;
		var sum = this.result;
		
		if(this.radix !== 10)
		{
			counting = counting.toString(this.radix);
			sum = sum.toString(this.radix);
		}
		else if(this.locale)
		{
			counting = counting.toLocaleString();
			sum = sum.toLocaleString();
		}
		else
		{
			counting = counting.toString();
			sum = sum.toString();
		}
		
		if(process.ansi)
		{
			counting = counting.bold(true).info(true);
			sum = sum.bold(true).underline(true).error(true);
		}

		console.info('Summed'.bold(true) + ' up ' + counting + ' bytes: ' + sum);
	}
	
	rot13(_chunk, ... _args)
	{
		if(this.reachedLineLimit !== null)
		{
			return;
		}

		this.length += _chunk.length;
		
		var byte; for(var i = 0; i < _chunk.length; ++i)
		{
			if(this.only)
			{
				if(this.only.has(_chunk[i]))
				{
					byte = _chunk[i];
				}
				else
				{
					byte = null;
				}
			}
			else if(this.without.has(_chunk[i]))
			{
				byte = null;
			}
			else
			{
				byte = _chunk[i];
			}

			if(this.filter && (_chunk[i] < 32 || _chunk[i] === 127))
			{
				byte = null;
			}
			
			if(byte !== null)
			{
				if(!this.countLines(_chunk[i]))
				{
					this.reachedLineLimit = (this.length - _chunk.length + i);
					break;
				}

				process.stdout.write(
					String.fromCharCode(
						byte + this.move));
			}
			else
			{
				++this.filteredBytes;
			}
		}
	}
	
	count(_chunk, ... _args)
	{
		this.length += _chunk.length;
		
		for(var i = 0; i < _chunk.length; ++i)
		{
			if(this.only)
			{
				if(this.only.has(_chunk[i]))
				{
					++this.result[_chunk[i]];
					++this.counting;
				}
				else
				{
					++this.filteredBytes;
				}
			}
			else if(this.without.has(_chunk[i]))
			{
				++this.filteredBytes;
			}
			else
			{
				++this.result[_chunk[i]];
				++this.counting;
			}
		}
	}
	
	showPrint()
	{
		if(this.controlBytes > 0)
		{
			console.info('Input had ' +
				this.controlBytes.toLocaleString().
					bold(true).warn(true) +
				' ' + 'allowed'.underline(true) +
				' control bytes.');
		}
	}
	
	print(_chunk, ... _args)
	{
		if(this.reachedLineLimit !== null)
		{
			return;
		}

		this.length += _chunk.length;

		const count = (_byte, _i) => {
			if(!this.countLines(_byte))
			{
				this.reachedLineLimit = (this.length - _chunk.length + _i);
				return false;
			}

			process.stdout.write(String.fromCodePoint(_byte));
			return true;
		};


		for(var i = 0; i < _chunk.length; ++i)
		{
			if(_chunk[i] === 9 || _chunk[i] === 10)
			{
				++this.controlBytes;

				if(!count(_chunk[i], i))
				{
					break;
				}
			}
			else if(_chunk[i] >= 32 && _chunk[i] < 127)
			{
				++this.counting;

				if(!count(_chunk[i], i))
				{
					break;
				}
			}
			else if(this.above && _chunk[i] > 127)
			{
				++this.counting;

				if(!count(_chunk[i], i))
				{
					break;
				}
			}
			else
			{
				++this.filteredBytes;
			}
		}
	}

	static get xmlEscaping()
	{
		return [
			[ '&', '&amp;' ],
			[ '"', '&quot;' ],
			[ '\'', '&#39;' ],
			[ '<', '&lt;' ],
			[ '>', '&gt;' ]
		];
	}

	xmlEscape(_chunk)
	{
		if(this.all)
		{
			const seq = ('&#' + (this.hex ? 'x' : ''));
			const rdx = (this.hex ? 16 : 10);
			var data;

			for(var i = 0; i < _chunk.length; ++i)
			{
				if(!this.countLines(_chunk[i]))
				{
					this.reachedLineLimit = (this.length - _chunk.length + i);
					return false;
				}

				data = (seq + _chunk[i].toString(rdx) + ';');
				this.added += data.length;
				--this.removed;
				process.stdout.write(data);
			}

			return;
		}

		const escaping = this.constructor.xmlEscaping;
		const from = [], to = [];

		for(const item of escaping)
		{
			from.push(item[0]);
			to.push(item[1]);
		}

		var char, idx, diff;
		for(var i = 0; i < _chunk.length; ++i)
		{
			if(!this.countLines(_chunk[i]))
			{
				this.reachedLineLimit = (this.length - _chunk.length + i);
				return false;
			}

			if(_chunk[i] >= 34 && _chunk[i] <= 62)
			{
				if((idx = from.indexOf(char = String.fromCodePoint(
					_chunk[i]))) === -1)
				{
					process.stdout.write(char);
				}
				else
				{
					--this.removed;
					this.added += (char = to[idx]).length;
					process.stdout.write(char);
				}
			}
			else
			{
				process.stdout.write(
					String.fromCodePoint(
						_chunk[i]));
			}
		}
	}
	
	xmlUnEscape(_chunk)
	{
		var origLen;

		if(this.all)
		{
			for(var i = 0; i < _chunk.length; ++i)
			{
				if(!this.countLines(_chunk[i]))
				{
					this.reachedLineLimit = (this.length - _chunk.length + i);
					return false;
				}

				if(this.entity)
				{
					if(_chunk[i] === 59)
					{
						origLen = (this.entity.length + 1);
						this.entity = this._xml.renderEntity(
							this.entity + ';');
						this.added += this.entity.length;
						this.removed += origLen;
						process.stdout.write(this.entity);
						this.entity = '';
					}
					else
					{
						this.entity += String.fromCodePoint(
							_chunk[i]);
					}
				}
				else if(_chunk[i] === 38)
				{
					this.entity = '&';
				}
				else
				{
					process.stdout.write(
						String.fromCodePoint(
							_chunk[i]));
				}
			}

			return;
		}

		const escaping = this.constructor.xmlEscaping;
		const from = [], to = [];

		for(const item of escaping)
		{
			from.push(item[1]);
			to.push(item[0]);
		}

		loop: for(var i = 0; i < _chunk.length; ++i)
		{
			if(!this.countLines(_chunk[i]))
			{
				this.reachedLineLimit = (this.length - _chunk.length + i);
				return false;
			}

			if(_chunk[i] === 38)
			{
				for(var j = 0; j < from.length; ++j) if(_chunk.at(i, from[j]))
				{
					process.stdout.write(to[j]);
					this.added += to[j].length;
					this.removed += from[j].length;
					i += from[j].length - 1;
					continue loop;
				}

				process.stdout.write(String.fromCharCode(
					_chunk[i]));
			}
			else
			{
				process.stdout.write(String.fromCodePoint(
					_chunk[i]));
			}
		}
	}

	ansi(_chunk)
	{
		this.length += _chunk.length;
		
		loop: for(var i = 0; i < _chunk.length; ++i)
		{
			if(!this.countLines(_chunk[i]))
			{
				this.reachedLineLimit = (this.length - _chunk.length + i);
				return false;
			}

			if(this.openState)
			{
				switch(this.openState)
				{
					case 1:
						if(_chunk[i] >= 48 && _chunk[i] <= 63)
						{
							//
						}
						else if(_chunk[i] >= 32 && _chunk[i] <= 47)
						{
							this.openState = 2;
						}
						else
						{
							this.openState = 0;
						}
						break;
					case 2:
						if(_chunk[i] >= 32 && _chunk[i] <= 47)
						{
							//
						}
						else if(_chunk[i] >= 64 && _chunk[i] <= 126)
						{
							this.openState = 0;
						}
						else
						{
							this.openState = 0;
						}
						break;
				}

				++this.filteredBytes;

				if(!this.openState)
				{
					++this.sequences;
				}
			}
			else if(_chunk[i] === 27 && _chunk[i + 1] === 91)
			{
				this.filteredBytes += 2;
				this.openState = 1;
				++i;
			}
			else
			{
				++this.counting;
				process.stdout.write(String.fromCharCode(
					_chunk[i]));
			}
		}
	}

	ansiSummary()
	{
		if(this.sequences > 0)
		{
			console.info('Found and removed ' + this.sequences.toLocaleString().
				bold(true).debug(true) + (' ANSI ' + 'CSI'.bold(true) +
				' Escape Sequences ').warn(true) + '!');
		}
		else
		{
			console.info('No'.error(true) + (' ANSI ' + 'CSI'.bold(true) +
				'Escape Sequences ').warn(true) + 'found!');
		}
	}
	
	showLimits()
	{
		if(!this.length)
		{
			return;
		}
		
		if(this.radix !== 10)
		{
			this.min = this.min.toString(this.radix);
			this.max = this.max.toString(this.radix);
		}
		else if(this.locale)
		{
			this.min = this.min.toLocaleString();
			this.max = this.max.toLocaleString();
		}
		else
		{
			this.min = this.min.toString();
			this.max = this.max.toString();
		}
		
		console.info('Byte '.faint(true) + 'minimum'.underline(true) +
			': '.debug(true) + this.min.bold(true));
		console.error('Byte '.faint(true) + 'maximum'.underline(true) +
			': '.debug(true) + this.max.bold(true));
	}

	limits(_chunk)
	{
		this.length += _chunk.length;
		
		for(var i = 0; i < _chunk.length; ++i)
		{
			if(this.min === null || _chunk[i] < this.min)
			{
				this.min = _chunk[i];
			}
			
			if(this.max === null || _chunk[i] > this.max)
			{
				this.max = _chunk[i];
			}
		}
	}

	xml(_chunk)
	{
		this.length += _chunk.length;

		if(this.mode)
		{
			switch(this.mode)
			{
				case 'escape':
					return this.xmlEscape(_chunk);
				case 'unescape':
					return this.xmlUnEscape(_chunk);
			}
		}
		
		var origLen; for(var i = 0; i < _chunk.length; ++i)
		{
			if(!this.countLines(_chunk[i]))
			{
				this.reachedLineLimit = (this.length - _chunk.length + i);
				return false;
			}

			if(this.openState)
			{
				if(_chunk[i] === 62)
				{
					this.openState = false;
				}

				++this.filteredBytes;
			}
			else if(_chunk[i] === 60)
			{
				this.openState = true;
				++this.filteredBytes;
				++this.tags;
			}
			else if(this.entity)
			{
				if(_chunk[i] === 59)
				{
					origLen = (this.entity.length + 1);
					this.entity = this._xml.renderEntity(
						this.entity + ';');
					++this.entities;
					this.counting += this.entity.length;
					process.stdout.write(this.entity);
					this.filteredBytes += (origLen -
						this.entity.length);
					this.entity = '';
				}
				else
				{
					this.entity += String.fromCodePoint(
						_chunk[i]);
				}
			}
			else if(_chunk[i] === 38)
			{
				this.entity = '&';
			}
			else
			{
				process.stdout.write(String.
					fromCodePoint(
						_chunk[i]));
				++this.counting;
			}
		}
	}

	xmlSummary()
	{
		if(!this.mode)
		{
			if(this.tags > 0)
			{
				console.info('Found ' + this.tags.toLocaleString().
					bold(true).debug(true) + ' tags (which were removed).');
			}

			if(this.entities > 0)
			{
				console.info('Converted ' + this.entities.toLocaleString().
					bold(true).debug(true) + ' entities, in total.');
			}
		}
		else
		{
			if(this.removed > 0)
			{
				console.info('Removed ' + this.removed.toLocaleString().
					bold(true).debug(true) + ' Bytes: ' +
					Math.size.styled(this.removed).error(true));
			}

			if(this.added > 0)
			{
				console.info('Added ' + this.added.toLocaleString().
					bold(true).debug(true) + ' Bytes: ' +
					Math.size.styled(this.added).error(true));
			}
		}
	}
	
	showCount()
	{
		for(var i = 0; i < this.result.length; ++i)
		{
			this.result[i] = [
				i,
				i,
				this.result[i],
				(this.result[i] > 0),
				null,
				false
			];

			if(this.only && !this.only.has(i))
			{
				this.result[i][4] = false;
			}
			else if(this.without.has(i))
			{
				this.result[i][4] = false;
			}
			else
			{
				this.result[i][4] = true;
			}
		}

		if(bool(this.sort))
		{
			this.result.sort(2, !this.sort);
		}
		
		var maxKey = 0, maxValue = 0;
		
		for(var i = 0; i < this.result.length; ++i)
		{
			if(!this.result[i][4])
			{
				continue;
			}
			
			if(this.printable && this.result[i][1] >= 32 && this.result[i][1] < 127)
			{
				this.result[i][1] = '`'.defaultFG(true) +
					String.fromCharCode(this.result[i][1]).error(true) +
					'`'.defaultFG(true);
				this.result[i][5] = true;
			}
			
			if(this.radix !== 10)
			{
				if(!this.result[i][5])
					this.result[i][1] = this.result[i][1].toString(this.radix);
				this.result[i][2] = this.result[i][2].toString(this.radix);
			}
			else if(this.locale && !this.pairs)
			{
				if(!this.result[i][5])
					this.result[i][1] = this.result[i][1].toLocaleString();
				this.result[i][2] = this.result[i][2].toLocaleString();
			}
			else
			{
				if(!this.result[i][5])
					this.result[i][1] = this.result[i][1].toString();
				this.result[i][2] = this.result[i][2].toString();
			}
			
			if(this.result[i][1].length > maxKey)
			{
				maxKey = this.result[i][1].textLength;
			}
			
			if(this.result[i][2].length > maxValue)
			{
				maxValue = this.result[i][2].length;
			}
		}

		if(!this.pairs) for(var i = 0; i < this.result.length; ++i)
		{
			if(!this.result[i][4])
			{
				continue;
			}
			
			if(! (maxKey === 3 && this.result[i][5]))
			{
				this.result[i][1] = this.result[i][1].pad(maxKey, ' ', true);
			}

			this.result[i][2] = this.result[i][2].padStart(maxValue, ' ');

			if(process.ansi)
			{
				if(this.high.has(this.result[i][0]))
				{
					this.result[i][1] = this.result[i][1].bold(true).fg(255, 255, 255, true);
					this.result[i][1] = this.result[i][1].inverse(true);
					this.result[i][2] = this.result[i][2].fg(255, 255, 255, true).bold(true);
				}
				else
				{
					this.result[i][1] = this.result[i][1].debug(true);//.bold(true);
					this.result[i][2] = this.result[i][2].info(true);
				}
			}
		}
		
		var open = '[';
		var close = ']';
		
		if(process.ansi && !this.pairs)
		{
			open = open.faint(true).defaultFG(true);
			close = close.faint(true).defaultFG(true);
		}

		var key, value;

		if(this.pairs)
		{
			String.TAB = 0;

			if(this.compact && this.onlySize === 1)
			{
				process.stdout.write(this.result[this.onlyByte][2] + EOL);
			}
			else for(var i = 0; i < this.result.length; ++i)
			{
				if(!this.empty && !this.result[i][3]) continue;
				if(!this.result[i][4]) continue;

				if(this.compact && this.onlySize === 1)
				{
					process.stdout.write(value + EOL);
					break;
				}
				
				value = this.result[i][2];
				
				if(this.compact)
				{
					process.stdout.write(value + this.sep);
				}
				else
				{
					key = this.result[i][1];
					process.stdout.write(key + '=' + value + this.sep);
				}
			}
			
			return process.exit();
		}
		else if(this.list || !process.stdout.isTTY)
		{
			for(var i = 0; i < this.result.length; ++i)
			{
				if(!this.empty && !this.result[i][3]) continue;
				if(!this.result[i][4]) continue;
				key = open + this.result[i][1] + close;
				value = this.result[i][2];
				process.stdout.write(key + ' ' + value + this.sep);
			}
			
			return process.exit();
		}
		
		const max = (maxKey + maxValue + 3);
		var empty = ' '.repeat(max);
		const width = process.stdout.columns;
		var item, w = 0, l;
		const lines = [''];

		for(var i = 0, j = 0; i < this.result.length; ++i)
		{
			if(!this.result[i][4])
			{
				if(this.compact)
				{
					continue;
				}
				else
				{
					item = empty;
				}
			}
			else if(!this.result[i][3] && !process.ansi)
			{
				item = empty;
			}
			else
			{
				key = open + this.result[i][1] + close;
				value = this.result[i][2];
				item = key + ' ' + value;

				if(process.ansi && !this.result[i][3] && !this.empty)
					item = item.text.fg(88, 88, 88, true);
			}

			if((w += (l = item.textLength)) >= (width - 2))
			{
				lines[++j] = '';
				w = l;
			}

			w += this.spaces;
			item += this.space;
			lines[j] += item;
		}

		process.stdout.write(lines.join(EOL) + EOL);
	}
	
	finish(_util = this.util)
	{
		console.silent = false;
		
		switch(_util)
		{
			case 'count':
				this.showCount();

				if(this.summary)
				{
					this.checkFilter();
				}
				break;
			case 'rot13':
				console.eol();
				
				if(!this.summary)
				{
					break;
				}

				console.eol();
				this.checkFilter();
				this.checkLines();
				break;
			case 'sum':
				this.checkFilter();
				this.showSum();
				break;
			case 'print':
				console.eol();

				if(!this.summary)
				{
					break;
				}
				
				console.eol();
				this.checkFilter();
				this.checkLines();
				this.showPrint();
				break;
			case 'xml':
				console.eol();

				if(this.summary)
				{
					if(!this.mode)
					{
						this.checkFilter();
					}

					this.xmlSummary();
				}
				break;
			case 'ansi':
				console.eol();

				if(this.summary)
				{
					this.checkFilter();
					this.ansiSummary();
				}
				break;
			case 'limits':
				this.showLimits();
				console.eol();
				this.checkFilter();
				break;
			default:
				throw new Error('Invalid utility; unexpected error!');
		}
		
		return process.exit();
	}
	
	prepare(_util = this.util, _callback)
	{
		this.length = 0;
		this.counting = 0;
		this.filteredBytes = 0;
		
		this.prepareUtil();
		
		var handledCallback = false;
		
		switch(_util)
		{
			case 'count':
				this.result = new Array(256).fill(0);
				this.prepareCount();
				break;
			case 'sum':
				this.result = 0n;
				break;
			case 'rot13':
				this.prepareRot13();
				break;
			case 'print':
				this.controlBytes = 0;
				this.preparePrint();
				break;
			case 'xml':
				this.prepareXML(_callback);
				handledCallback = true;
				break;
			case 'ansi':
				this.prepareANSI();
				break;
			case 'limits':
				this.prepareLimits();
				break;
			default:
				throw new Error('Invalid utility chosen');
		}
		
		if(!handledCallback)
		{
			setImmediate(_callback);
		}
	}
	
	preparePrint()
	{
		if(this.param.has('above'))
		{
			this.above = this.param.get('above');
		}
		else
		{
			this.above = this.getConfig('above');
		}

		this.tryLineLimitInit();
	}

	tryLineLimitInit()
	{
		if(this.param.has('lines'))
		{
			this.lineLimit = this.param.get('lines');
		}
		else
		{
			this.lineLimit = this.getConfig('lines');
		}

		if(this.lineLimit !== null && this.lineLimit < 1)
		{
			this.lineLimit = null;
		}

		this.lines = { '\n': 0, '\r': 0 };
		
		if((this.width = console.width) < 1)
		{
			this.width = 0;
			this.column = null;
		}
		else
		{
			this.lines.rows = 0;
			this.column = 0;
		}

		this.reachedLineLimit = null;
	}

	prepareANSI()
	{
		this.openState = false;
		this.sequences = 0;
		this.tryLineLimitInit();
	}

	prepareXML(_callback)
	{
		//
		if(this.param.has('mode'))
		{
			switch(this.mode = this.param.get('mode').toLowerCase())
			{
				case 'escape':
				case 'unescape':
					break;
				default:
					console.error('Invalid ' + '--mode'.warn(true).
						quote() + ' [ '.debug(true) +
						'escape'.info(true).quote() + ', ' +
						'unescape'.info(true).quote() + ' ]'.
						debug(true));
					return process.exit(true);
			}

			this.removed = 0;
			this.added = 0;

			if(this.param.has('all'))
			{
				this.all = this.param.get('all');
			}
			else
			{
				this.all = this.getConfig('all');
			}

			if(this.param.has('hex'))
			{
				this.hex = this.param.get('hex');
			}
			else
			{
				this.hex = this.getConfig('hex');
			}
		}
		else
		{
			this.mode = '';
			this.entities = 0;
		}

		this.openState = false;
		this.entity = '';
		this.tags = 0;

		this.tryLineLimitInit();

		//
		this._xml = new XML(true);

		this._xml.once('error', (_p) => {
			console.error('Unable to load ' + 'entities.json'.
				warn(true).quote() + '!');
			process.exit(true);
		});

		this._xml.once('ready', (_p) => {
			this._xml.removeAllListeners();
			setImmediate(() => _callback());
		});
	}
	
	prepareRot13()
	{
		this.args = GetOpt(true, false, true, true, process.argv, 2);

		var found = false;
		this.move = 13;

		for(var i = 0; i < this.args.length; ++i)
		{
			if(int(this.args[i]))
			{
				this.move = ((this.args[i] % 256) || 0);
				found = true;
				break;
			}
		}

		if(!this.args.get('silent'))
		{
			if(found)
			{
				console.warn('Found move parameter: ' +
					this.move.toString().error(true).bold(true));
			}
			else
			{
				console.warn('No move parameter found, so we guess you want the ' +
					'13'.error(true).bold(true));
			}
			
			if(process.stdout.isTTY)
			{
				process.stderr.write('\n');
			}
		}

		if(this.param.has('filter'))
		{
			this.filter = this.param.get('filter');
		}
		else
		{
			this.filter = this.getConfig('filter');
		}
		
		this.tryLineLimitInit();
	}
	
	prepareUtil()
	{
		//
		if(this.param.has('radix'))
		{
			this.radix = this.param.get('radix');
		}
		else
		{
			this.radix = this.getConfig('radix');
		}
		
		if(this.radix === 10)
		{
			if(this.param.has('locale'))
			{
				this.locale = this.param.get('locale');
			}
			else
			{
				this.locale = this.getConfig('locale');
			}
		}
		else
		{
			this.locale = null;
		}

		if((this.only = Helper.parseBytes(this.param.get('only'))).size === 0)
		{
			this.only = null;
			this.onlySize = 256;
			this.onlyByte = null;
		}
		else if((this.onlySize = this.only.size) === 1)
		{
			this.onlyByte = this.only.values().next().value;
		}
		else
		{
			this.onlyByte = null;
		}

		this.without = Helper.parseBytes(this.param.get('without'));
		
		//
		if(this.param.has('summary'))
		{
			this.summary = this.param.get('summary');
		}
		else
		{
			this.summary = this.getConfig('summary');
		}
		
		//
		if(this.param.has('compact'))
		{
			this.compact = this.param.get('compact');
		}
		else
		{
			this.compact = this.getConfig('compact');
		}
	}
	
	prepareCount()
	{
		//
		if(bool(this.param.get('sort')) || this.param.get('sort') === null)
		{
			this.sort = this.param.get('sort');
		}
		else
		{
			this.sort = this.getConfig('sort');
		}

		//
		if(this.param.has('pairs'))
		{
			this.pairs = this.param.get('pairs');
		}
		else
		{
			this.pairs = this.getConfig('pairs');
		}
		
		if(this.param.has('list'))
		{
			this.list = this.param.get('list');
		}
		else
		{
			this.list = this.getConfig('list');
		}
		
		if(this.pairs)
		{
			this.list = null;
		}
		else if(this.list)
		{
			this.pairs = null;
		}
		
		if(string(this.param.get('sep'), false))
		{
			this.sep = this.param.get('sep');
		}
		else
		{
			this.sep = this.getConfig('sep');
		}

		if(int(this.param.get('spaces')) && this.param.get('spaces') >= 0)
		{
			this.spaces = this.param.get('spaces');
		}
		else
		{
			this.spaces = this.getConfig('spaces');
		}

		this.space = ' '.repeat(this.spaces);

		if(!bool(this.empty = this.param.get('empty')))
		{
			this.empty = this.getConfig('empty');
		}

		//
		this.high = Helper.parseBytes(this.param.get('high'));

		//
		if(!bool(this.printable = this.param.get('printable')))
		{
			this.printable = this.getConfig('printable');
		}
	}
	
	prepareLimits()
	{
		this.min = null;
		this.max = null;
	}
	
	onData(_chunk, ... _args)
	{
		if(!_chunk)
		{
			return this.onEnd(... _args);
		}

		if(typeof _chunk === 'string')
		{
			_chunk = Uint8Array.create(_chunk);
		}

		return this[this.util](_chunk, ... _args);
	}
	
	onEnd(... _args)
	{
		this.stream = null;
		return this.finish(this.util);
	}
}

export default Utility;

//

