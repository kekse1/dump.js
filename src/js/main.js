/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
import * as globals from '../shared/globals.js';
import * as server from '../shared/server.js';
import getopt from '../shared/getopt.js';
import Dump from './dump.js';
import Utility from './utility.js';

//
const param = getopt(true);

//
const utilities = Utility.utilities;
var utility = '';
var dump = null;

//
var u; for(var i = 0; i < param.length; ++i)
{
	if(string(param[i], false))
	{
		if(utilities.includes(u = param[i].toLowerCase()))
		{
			utility = param.splice(i, 1)[0];
			break;
		}
	}
}

if(!utility)
{
	dump = new Dump(param);
}
else
{
	dump = new Utility(param, utility);
}

//

