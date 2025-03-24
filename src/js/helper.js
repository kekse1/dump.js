/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_THROW = true;

//
class Helper
{
	static parseBytes(_input, _radix = 10)
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
		var number, min, max, step, idx, radix;
		
		for(var i = 0; i < _input.length; ++i)
		{
			if(_input[i].length === 0)
			{
				continue;
			}

			idx = _input[i].lastIndexOf('/');
			
			if(idx === -1)
			{
				radix = _radix || 10;
			}
			else
			{
				if((radix = Number(_input[i].substr(idx + 1))) < 2 || radix > 36)
				{
					continue;
				}
				
				_input[i] = _input[i].substr(0, idx);
			}

			if(_input[i].substr(1).includes('-'))
			{
				if((idx = _input[i].lastIndexOf('+')) === -1)
				{
					step = 1;
				}
				else
				{
					if(isNaN(step = parseInt(_input[i].substr(idx + 1), radix)))
					{
						step = 1;
					}
					else
					{
						step = (Math.int(step) % 256);
					}

					_input[i] = _input[i].substr(0, idx);
				}

				if(_input[i][0] === '-')
				{
					if((idx = _input[i].substr(1).indexOf('-')) === -1)
					{
						continue;
					}
					else
					{
						++idx;
					}
				}
				else if((idx = _input[i].indexOf('-')) === -1)
				{
					continue;
				}
				
				_input[i] = [
					_input[i].substr(0, idx),
					_input[i].substr(idx + 1)
				];

				if(isNaN(_input[i][0] = parseInt(_input[i][0], radix)))
				{
					continue;
				}

				if(isNaN(_input[i][1] = parseInt(_input[i][1], radix)))
				{
					continue;
				}
				
				if((_input[i][0] = Math.int(_input[i][0] % 256)) < 0)
				{
					_input[i][0] = (256 + _input[i][0]);
				}
				
				if((_input[i][1] = Math.int(_input[i][1] % 256)) < 0)
				{
					_input[i][1] = (256 + _input[i][1]);
				}

				if(_input[i][0] === _input[i][1])
				{
					result.add(_input[i][0]);
				}
				else if(_input[i][0] > _input[i][1]) for(var j = _input[i][0]; j >= _input[i][1]; j -= step)
				{
					result.add(j);
				}
				else for(var j = _input[i][0]; j <= _input[i][1]; j += step)
				{
					result.add(j);
				}
			}
			else if(!isNaN(_input[i] = parseInt(_input[i], radix)))
			{
				if((_input[i] = Math.int(_input[i] % 256)) < 0)
				{
					_input[i] = (256 + _input[i]);
				}
				
				result.add(_input[i]);
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
