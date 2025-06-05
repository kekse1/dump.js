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
		return [ 'count', 'sum', 'rot13', 'print' ];
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
					stats = fs.statSync(file, { bigint: false, throwIfNoEntry: true });
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
					console.warn('But maybe this file is just empty..');
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
			this.prepare(this.util);

			//
			this.stream = fs.createReadStream(file, {
				encoding: DEFAULT_ENCODING,
				autoClose: true,
				emitClose: true,
				start: this.offset,
				end: (this.offset + this.size - 1) });

			//
			this.stream.on('data', (_c, ... _a) => this.onData(_c, ... _a));
			this.stream.on('end', (... _a) => this.onEnd(... _a));
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
		
		if(!filtered)
		{
			return false;
		}
		
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

		console.info(('Data ' + 'filtered'.bold(true)).debug(true) +
			': ' + counting + ' Bytes counted (' + total + ' in total; '.
				debug(true) + filtered + ' filtered out)'.debug(true));
		
		if(this.counting >= 1024 || this.length >= 1024 || this.filtered >= 1024)
		{
			console.debug('               ' + Math.size.styled(this.counting).
				info(true) + ' counted (' + Math.size.styled(this.length).
				error(true) + ' in total; '.debug(true) + Math.size.styled(
					this.filtered).warn(true) + ' filtered out)'.debug(true));
		}
		
		console.debug('            => ' + percent);
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
			++this.result[_chunk[i]];
			
			if(this.only)
			{
				if(!this.only.has(_chunk[i]))
				{
					++this.filteredBytes;
				}
				else
				{
					++this.counting;
				}
			}
			else if(this.without.has(_chunk[i]))
			{
				++this.filteredBytes;
			}
			else
			{
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
		this.length += _chunk.length;

		for(var i = 0; i < _chunk.length; ++i)
		{
			if(_chunk[i] === 9 || _chunk[i] === 10)
			{
				++this.controlBytes;
				process.stdout.write(
					String.fromCharCode(
						_chunk[i]));
			}
			else if(_chunk[i] >= 32 && _chunk[i] < 127)
			{
				++this.counting;
				process.stdout.write(
					String.fromCharCode(
						_chunk[i]));
			}
			else if(this.above && _chunk[i] > 127)
			{
				++this.counting;
				process.stdout.write(
					String.fromCharCode(
						_chunk[i]));
			}
			else
			{
				++this.filteredBytes;
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

		for(var i = 0; i < this.result.length; ++i)
		{
			if(!this.pairs)
			{
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

			for(var i = 0; i < this.result.length; ++i)
			{
				if(!this.empty && !this.result[i][3]) continue;
				else if(!this.result[i][4]) continue;
				key = this.result[i][1];
				value = this.result[i][2];
				process.stdout.write(key + '=' + value + this.sep);
			}
			
			return process.exit();
		}
		else if(this.list || !process.stdout.isTTY)
		{
			for(var i = 0; i < this.result.length; ++i)
			{
				if(!this.empty && !this.result[i][3]) continue;
				else if(!this.result[i][4]) continue;
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
			if(!this.result[i][3] && !process.ansi)
			{
				item = empty;
			}
			else if(!this.result[i][4])
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
				if(this.summary) this.checkFilter();
				break;
			case 'rot13':
				this.checkFilter();
				break;
			case 'sum':
				this.checkFilter();
				this.showSum();
				break;
			case 'print':
				if(!this.summary)
				{
					console.eol();
					break;
				}
				
				console.eol(2);
				this.checkFilter();
				this.showPrint();
				break;
			default:
				throw new Error('Invalid utility; unexpected!');
		}
		
		return process.exit();
	}
	
	prepare(_util = this.util)
	{
		this.length = 0;
		this.prepareUtil();
		
		switch(_util)
		{
			case 'count':
				this.result = new Array(256).fill(0);
				this.filteredBytes = 0;
				this.counting = 0;
				this.prepareCount();
				break;
			case 'sum':
				this.filteredBytes = 0;
				this.counting = 0;
				this.result = 0n;
				break;
			case 'rot13':
				this.filteredBytes = 0;
				this.prepareRot13();
				break;
			case 'print':
				this.filteredBytes = 0;
				this.controlBytes = 0;
				this.counting = 0;
				this.preparePrint();
				break;
			default:
				throw new Error('Invalid utility chosen');
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

