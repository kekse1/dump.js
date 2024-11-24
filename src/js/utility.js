/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_SILENT = true;

//
import Quant from '../shared/quant.js';
import Application from '../shared/app.js';

//
class Utility extends Quant
{
	constructor(_param = null, ... _args)
	{
		//
		super(null, ... _args);
		
		//
		if(!(this.param = _param))
		{
			throw new Error('Missing _param argument');
		}

		//
		Application.registerExitHandler((... _a) => this.onExit(... _a));
	}

	onExit(_name, _code, ... _args)
	{
		//
	}

	count(... _args)
	{
		throw new Error('TODO (migrate code)');
	}
}

export default Utility;

//

