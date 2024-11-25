/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_PARAM_SCHEME_JSON = '../../json/param/dump.util.json';
const DEFAULT_SILENT = true;

const DEFAULT_RADIX = 10;
const DEFAULT_SORT = null;

//
import Quant from '../shared/quant.js';
import Application from '../shared/app.js';
import Parameter from '../shared/param.js';

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
			if(isRadix(this.param.radix))
			{
				this.radix = this.param.radix;
			}
			else
			{
				this.radix = this.getConfig('radix');
			}
			
			if(bool(this.param.sort))
			{
				this.sort = !this.param.sort;
			}
			else if(this.param.sort === null)
			{
				this.sort = null;
			}
			else
			{
				this.sort = this.getConfig('sort');
			}

			//
			this[this.util](this.param);
		}, path.join(this.param.script, DEFAULT_PARAM_SCHEME_JSON), this.param);
	}

	count(_param = this.param)
	{
throw new Error('TODO: migrate old `count()`');
	}
}

export default Utility;

//
