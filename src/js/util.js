/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_PARAM_SCHEME_JSON = '../../json/param/dump.util.json';
const DEFAULT_SILENT = true;

//
import Quant from '../shared/quant.js';
import Application from '../shared/app.js';
import Parameter from '../shared/param.js';
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
		else if(!string(_util, false))
		{
			throw new Error('Missing _util argument');
		}
		else if(!func(this[this.util = _util]))
		{
			console.error('The utility `' + _util + '` is not available.');
			process.exit(254);
		}

		//
		Application.registerExitHandler((... _a) => this.onExit(... _a));
		
		new Application(this, { silent: DEFAULT_SILENT,
			callback: (... _a) => this.onApplication(... _a),
			name: 'Dump/Utility', param: this.param, config: this.param.config });
	}
	
	static get utilities()
	{
		return [ 'count' ];
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
				if('ansi' in this.param)
				{
					process.ansi = this.param.ansi;
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
				if(! ('size' in this.param))
				{
					console.error('Unable to determine file size, so please argue with `--size`.');
					console.warn('But maybe this file is just empty..');
					process.exit(true);
				}
				
				stats.size = this.param.size;
			}
			else
			{
				this.path = file;
				this.stats = stats;
			}

			//
			if('size' in this.param)
			{
				this.size = Math.min(this.param.size, stats.size);
			}
			else
			{
				this.size = stats.size;
			}

			if('offset' in this.param)
			{
				this.offset = this.param.offset;
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
			if('radix' in this.param)
			{
				this.radix = this.param.radix;
			}
			else
			{
				this.radix = this.getConfig('radix');
			}
			
			if(this.radix === 10)
			{
				if('locale' in this.param)
				{
					this.locale = this.param.locale;
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
			
			//
			if(bool(this.param.order) || this.param.order === null)
			{
				this.order = this.param.order;
			}
			else
			{
				this.order = this.getConfig('order');
			}

			//
			if('pairs' in this.param)
			{
				this.pairs = this.param.pairs;
			}
			else
			{
				this.pairs = this.getConfig('pairs');
			}
			
			if('list' in this.param)
			{
				this.list = this.param.list;
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
			
			if(string(this.param.sep, false))
			{
				this.sep = this.param.sep;
			}
			else
			{
				this.sep = this.getConfig('sep');
			}

			if(int(this.param.spaces) && this.param.spaces >= 0)
			{
				this.spaces = this.param.spaces;
			}
			else
			{
				this.spaces = this.getConfig('spaces');
			}

			this.space = ' '.repeat(this.spaces);

			if(!bool(this.empty = this.param.empty))
			{
				this.empty = this.getConfig('empty');
			}

			//
			this.high = Helper.parseBytes(this.param.high);

			if((this.only = Helper.parseBytes(this.param.only)).size === 0)
			{
				this.only = null;
			}

			this.without = Helper.parseBytes(this.param.without);

			//
			this.prepare(this.util);

			//
			this.stream = fs.createReadStream(file, {
				encoding: null,
				autoClose: true,
				emitClose: true,
				start: this.offset,
				end: (this.offset + this.size - 1) });

			//
			this.stream.on('data', (_c, ... _a) => this.onData(_c, ... _a));
			this.stream.on('end', (... _a) => this.onEnd(... _a));
		}, path.join(this.param.script, DEFAULT_PARAM_SCHEME_JSON), this.param);
	}

	count(_chunk)
	{
		for(var i = 0; i < _chunk.length; ++i)
		{
			++this.counting[_chunk[i]];
		}
	}
	
	showCount()
	{
		for(var i = 0; i < this.counting.length; ++i)
		{
			this.counting[i] = [
				i,
				i,
				this.counting[i],
				(this.counting[i] > 0),
				null
			];

			if(this.only && !this.only.has(i))
			{
				this.counting[i][4] = false;
			}
			else if(this.without.has(i))
			{
				this.counting[i][4] = false;
			}
			else
			{
				this.counting[i][4] = true;
			}
		}
		
		if(bool(this.order))
		{
			this.counting.sort(2, !this.order);
		}
		
		var maxKey = 0, maxValue = 0;
		
		for(var i = 0; i < this.counting.length; ++i)
		{
			if(this.radix !== 10)
			{
				this.counting[i][1] = this.counting[i][1].toString(this.radix);
				this.counting[i][2] = this.counting[i][2].toString(this.radix);
			}
			else if(this.locale && !this.pairs)
			{
				this.counting[i][1] = this.counting[i][1].toLocaleString();
				this.counting[i][2] = this.counting[i][2].toLocaleString();
			}
			else
			{
				this.counting[i][1] = this.counting[i][1].toString();
				this.counting[i][2] = this.counting[i][2].toString();
			}
			
			if(this.counting[i][1].length > maxKey)
			{
				maxKey = this.counting[i][1].length;
			}
			
			if(this.counting[i][2].length > maxValue)
			{
				maxValue = this.counting[i][2].length;
			}
		}

		for(var i = 0; i < this.counting.length; ++i)
		{
			if(!this.pairs)
			{
				this.counting[i][1] = this.counting[i][1].padStart(maxKey, ' ');
				this.counting[i][2] = this.counting[i][2].padStart(maxValue, ' ');

				if(process.ansi)
				{
					if(this.high.has(this.counting[i][0]))
					{
						this.counting[i][1] = this.counting[i][1].bold(true).fg(255, 255, 255, true);
						this.counting[i][2] = this.counting[i][2].fg(255, 255, 255, true);
					}
					else
					{
						this.counting[i][1] = this.counting[i][1].debug(true).bold(true);
						this.counting[i][2] = this.counting[i][2].info(true);
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
			for(var i = 0; i < this.counting.length; ++i)
			{
				if(!this.empty && !this.counting[i][3]) continue;
				else if(!this.counting[i][4]) continue;
				key = this.counting[i][1];
				value = this.counting[i][2];
				process.stdout.write(key + '=' + value + this.sep);
			}
			
			return process.exit();
		}
		else if(this.list || !process.stdout.isTTY)
		{
			for(var i = 0; i < this.counting.length; ++i)
			{
				if(!this.empty && !this.counting[i][3]) continue;
				else if(!this.counting[i][4]) continue;
				key = open + this.counting[i][1] + close;
				value = this.counting[i][2];
				process.stdout.write(key + ' ' + value + this.sep);
			}
			
			return process.exit();
		}
		
		const max = (maxKey + maxValue + 3);
		var empty = ' '.repeat(max);
		const width = process.stdout.columns;
		var item, w = 0, l;
		const lines = [''];

		for(var i = 0, j = 0; i < this.counting.length; ++i)
		{
			if(!this.counting[i][3] && !process.ansi)
			{
				item = empty;
			}
			else if(!this.counting[i][4])
			{
				item = empty;
			}
			else
			{
				key = open + this.counting[i][1] + close;
				value = this.counting[i][2];
				item = key + ' ' + value;

				if(process.ansi && !this.counting[i][3] && !this.empty)
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
		process.exit();
	}
	
	finish(_util = this.util)
	{
		switch(_util)
		{
			case 'count':
				this.showCount();
				break;
			default:
				throw new Error('Invalid utility; unexpected!');
		}
		
		return process.exit();
	}
	
	prepare(_util = this.util)
	{
		switch(_util)
		{
			case 'count':
				this.counting = new Array(256).fill(0);
				break;
			default:
				throw new Error('Invalid utility chosen');
		}
	}
	
	onData(_chunk, ... _args)
	{
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

