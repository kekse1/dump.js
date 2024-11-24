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
var count = false;
var dump = null;

//
for(var i = 0; i < param.length; ++i)
{
	if(param[i].toLowerCase() === 'count')
	{
		param.splice(i, 1);
		count = true;
		break;
	}
}

if(!count)
{
	dump = new Dump(param);
}
else
{
	(count = new Utility(param)).count();
}

//

