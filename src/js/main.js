/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
import * as globals from '../shared/globals.js';
import * as server from '../shared/server.js';
import getopt from '../shared/getopt.js';
import Dump from './dump.js';
import Utility from './util.js';

//
const param = getopt(true);

//
var dump = null;

//
if(param.util)
{
	const utils = Utility.utilities;
	var util = '';

	var u; for(var i = 0; i < param.length; ++i)
	{
		if(string(param[i], false))
		{
			if(utils.includes(u = param[i].toLowerCase()))
			{
				util = param.splice(i--, 1)[0];
			}
			else if(param[i].toLowerCase() === 'help')
			{
				Utility.help(0);
				break;
			}
		}
	}

	if(!util)
	{
		Utility.help(1);
	}
	else
	{
		delete param.util;
	}

	dump = new Utility(param, util);
}
else
{
	dump = new Dump(param);
}

//

