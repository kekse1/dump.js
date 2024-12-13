/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_THROW = true;

//
class Helper
{
	static parseBytes(_input)
	{
		const result = new Set();
		
		if(int(_input))
		{
			result.add(_input % 256);
			return result;
		}
		else if(!string(_input, false))
		{
			return result;
		}
		
		_input = _input.split(',');
		var number, min, max, step, idx;
		
		for(var i = 0; i < _input.length; ++i)
		{
			if(_input[i].length === 0)
			{
				continue;
			}
			else if(!isNaN(_input[i]))
			{
				number = Math.int(Number(_input[i]) % 256);

				if(number < 0)
				{
					number = (256 + number);
				}
				
				result.add(number);
			}
			else if(_input[i].includes('-'))
			{
				idx = _input[i].lastIndexOf('+');
				step = 1;
				
				if(idx > -1)
				{
					if(isNaN(step = _input[i].substr(idx + 1)))
					{
						step = 1;
					}
					else
					{
						step = Math.int(Number(step) % 256);
					}
					
					_input[i] = _input[i].substr(0, idx);
				}
				
				if((_input[i] = _input[i].split('-')).length !== 2)
				{
					continue;
				}
				
				if(isNaN(_input[i][0]) || isNaN(_input[i][1]))
				{
					continue;
				}
				
				if((_input[i][0] = Math.int(Number(_input[i][0]) % 256)) < 0)
				{
					_input[i][0] = (256 + _input[i][0]);
				}
				
				if((_input[i][1] = Math.int(Number(_input[i][1]) % 256)) < 0)
				{
					_input[i][1] = (256 + _input[i][1]);
				}
				
				min = Math.min(_input[i][0], _input[i][1]);
				max = Math.max(_input[i][0], _input[i][1]);
				
				for(var i = min; i <= max; i += step)
				{
					result.add(i);
				}
			}
		}

		return result;
	}

	static parseColors(_string, _throw = DEFAULT_THROW)
	{
		if(_string.length === 0)
		{
			return null;
		}
		
		var colors;
		var sep;
		
		if(_string.includes(';'))
		{
			sep = ';';
			colors = _string.split(';');
		}
		else
		{
			sep = ',';
			
			if((colors = _string.split(',')).length < 3)
			{
				if(_throw)
				{
					throw new Error('Invalid color string (nothing found)');
				}
				
				return null;
			}
			
			const rest = (colors.length % 3);
			
			if(rest !== 0)
			{
				if(_throw)
				{
					throw new Error('Invalid colorization length (' + colors.length + ' % 3 != 0)');
				}
				
				colors.length = (colors.length - rest);
			}
			
			const temp = [ ... colors ];
			colors.length = 0;
			
			for(var i = 0, j = -1; i < temp.length; ++i)
			{
				if((i % 3) === 0)
				{
					colors[++j] = new Array(3);
				}
				
				if(isNaN(colors[j][i % 3] = (Number(temp[i]) % 256)))
				{
					if(_throw)
					{
						throw new Error('Item[' + i + '] was not a byte (of color[' + j + '][' + (i % 3) + '])');
					}
					
					return null;
				}
			}

			return colors;
		}
		
		for(var i = 0; i < colors.length; ++i)
		{
			if((colors[i] = colors[i].split(',')).length < 3)
			{
				colors.splice(i--, 1);
			}
			else
			{
				colors[i].length = 3;
			}
		}
		
		if(colors.length === 0)
		{
			if(_throw)
			{
				throw new Error('Invalid color string (nothing found)');
			}
			
			return null;
		}
		
		var color; for(var i = 0; i < colors.length; ++i)
		{
			color = new Array(3);
			
			for(var j = 0; j < colors[i].length; ++j)
			{
				if(isNaN(colors[i][j]))
				{
					if(_throw)
					{
						throw new Error('Item[' + i + '][' + j + '] was not a byte');
					}
					
					color = null;
					break;
				}
				
				color[j] = (Number(colors[i][j]) % 256);
			}
			
			if(color)
			{
				colors[i] = color;
			}
			else
			{
				colors.splice(i--, 1);
			}
		}
		
		if(colors.length === 0)
		{
			return null;
		}
		
		return colors;
	}
}

export default Helper;

//
