#!/usr/bin/env bash
#
# Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
# https://kekse.biz/ https://github.com/kekse1/scripts/
# v0.3.1
#

# set to zero(0) to enable this whole tool! .. ^_^
_DRY_RUN=1

#
_real="$(realpath "$0")"
_dir="$(dirname "$_real")"
_count="$(realpath "${_dir}/zero-count.sh")"

#
[[ ! -f "$_count" ]] && _count=""

#
syntax()
{
	echo -e "This script will copy all matching files into a (newly created) target directory," >&2
	echo -e "each with a numerical, counted prefix to keep the order of files, which will be" >&2
	echo -e "enumerated by their file size (ascending by default).\n" >&2
	echo -e "\tSyntax: \$0 < target directory > [ < start > [ < glob > || < ... > ] ]" >&2
	echo -e "\t\t\t[ --count / -c ]\n" >&2
	echo -e "Please run this command in the directory where the files you need are located." >&2
	echo -e "You first *need* to argue with a target directory path which doesn't already exist." >&2
	echo -e "\n\tPossible parameters:\n" >&2
	echo -e "The 'target directory' is the place to copy the file listing into." >&2
	echo -e "The 'glob' is '*' by default. You can change it; BUT PUT IT INTO QUOTES, LIKE: '*.log'!" >&2
	echo -e "The 'start' changes from where the counting will start. Empty value will start with (1) by default." >&2
	echo -e "\nTo bypass a parameter and define a subsequent one, just use an empty string like this: ''.\n" >&2
	echo -e "NEW: Call with \`--count / -c\` to:\n" >&2
	echo -e "\t(a) Use the results of counting one byte via \`zero-count.sh\`." >&2
	echo -e "\t(b) Instead of the 'glob' parameter you can start there to define" >&2
	echo -e "\t    all parameters to \`zero-count.sh\`." >&2
	echo >&2
}

errorCase()
{
	[[ ! -d "$_TARGET" ]] && return 0

	local _print=$1
	local _force=$2

	rmdir "$_TARGET"
	local _res=$?
	
	if [[ $_res -eq 0 ]]; then
		[[ $_print -ne 0 ]] && echo -e "The error caused me to delete the target directory." >&2
		return 0
	fi

	if [[ $_print -ne 0 || $_force -ne 0 ]]; then
		echo -e "Sorry, I tried to delete the target directory because of the error," >&2
		echo -e "but it didn't work (error code = ${_res}). Please do it manually." >&2
	fi
	
	return 1
}

confirm()
{
	[[ -n "$1" ]] && echo -ne "$1 [Yes/No]? "
	local confirm; read confirm;
	confirm="${confirm::1}"; confirm="${confirm,,}"
	[[ "$confirm" != "y" ]] && return 1
	return 0
}

#
if [[ $# -eq 0 ]]; then
	syntax
	exit 1
fi

_COUNT=0
args=()

for i in "$@"; do
	case "$i" in
		"--help"|"-h"|"-?")
			syntax
			exit
			;;
		"--count"|"-c")
			if [[ -z "$_count" ]]; then
				echo -e "Invalid: you can't use \`--count / -c\` because \`zero-count.sh\` is not found!" >&2
				exit 2
			else
				_COUNT=1
			fi
			;;
		*)
			args+=("$i")
			;;
	esac
done

#
_TARGET="${args[0]}"
_START=${args[1]:-1}

#
[[ $_DRY_RUN -ne 0 ]] && echo -e "FYI: Set \`\$_DRY_RUN\` (on top of this script) to zero(0) to really use this tool!" >&2

#
if [[ -z "$_TARGET" ]]; then
	syntax
	exit 4
else
	_TARGET="$(realpath -m "$_TARGET")"

	if [[ -e "$_TARGET" ]]; then
		echo -e "ERROR: Target directory may not already exist: \`${_TARGET}\`" >&2
		echo -e "We need a 'clean environment' for the file listing." >&2
		exit 5
	elif [[ $_DRY_RUN -eq 0 ]]; then
		mkdir -p "$_TARGET" >/dev/null 2>&1
		
		if [[ $? -ne 0 ]]; then
			echo -e "Unable to create your target directory: \`${_TARGET}\`" >&2
			exit 6
		fi
	else
		echo -e "Because of \$_DRY_RUN we didn't create the target directory here, jfyi."
	fi
	
	echo
fi


#
if [[ $_COUNT -eq 0 ]]; then
	_GLOB="${args[2]:-*}"

	if [[ "$_GLOB" != *"*"* ]]; then
		echo -e "Your GLOB doesn't contain an asterisk '*'." >&2
		echo -e "So I think, you didn't put your glob parameter into quotes (like: '*.log')!?" >&2
		exit 3
	else
		echo -e "Using file glob: \`${_GLOB}\`."
	fi

	#
	echo -e "Using the log file sizes to sort the list (see also \`--count / -c\`)."
	mapfile -t -d '' files < <(find -mindepth 1 -maxdepth 1 -not -name '.*' -name "$_GLOB" -type f -printf "%s %f\0" | sort -zn)
else
	_BYTE="${args[2]:-0}"
	_ORDER="${args[3]:-asc}"
	
	#
	echo -e "Using the \`zero-count.sh\` instead of using file sizes (see \`--count / -c\`)."
	mapfile -t -d '' files < <("$_count" "$_BYTE" "$_ORDER" | sort -zn)
fi

#
_count=${#files[@]}

if [[ $_count -eq 0 ]]; then
	echo "No matching files found!" >&2
	errorCase 0
	exit 7
fi

#
_PADDING=${#_count}
echo "According to your file count we use a padding size of ${_PADDING} now."
echo -e "And I'm going to start counting from ${_START} (up to $(($_START+$_count-1)))."

#
_maxLen=0; for file in "${files[@]}"; do
	_len=${#file}
	[[ $_len -gt $_maxLen ]] && _maxLen=$_len
done; ((++_maxLen))

#
_errors=0
i=$_START

echo; for entry in "${files[@]}"; do
	_name="${entry#* }"
	_prefix=$(printf "%0${_PADDING}d" "$i")
	_target="${_prefix}. ${_name}"

	printf "%-${_maxLen}s \t " "$_target"
	#echo -e "\t${_target}"

	if [[ $_DRY_RUN -eq 0 ]]; then
		cmd="cp '$_name' '${_TARGET}/${_target}'"
		eval "$cmd"
		
		if [[ $? -eq 0 ]]; then
			echo "ok"
		else
			((++_errors))
			echo "failed (${_errors} now)"
		fi
	else
		echo "test"
	fi
	
	((++i))
done; echo

_dryTest()
{
	if [[ $_DRY_RUN -ne 0 ]]; then
		echo -e "\nRemember: this was a \`\$_DRY_RUN\` only!"
		rmdir "$_TARGET" || echo -e "FAILED to remove the target directory afterwards!"
	fi
}

#
if [[ $_COUNT -eq 0 ]]; then
	echo -e "We used the FILE SIZEs to sort the log files."
else
	echo -e "We used the counted bytes of \`zero-count.sh\` to sort the log files."
fi

#
if [[ $_errors -eq 0 ]]; then
	echo -e "Finished to copy ${_count} files into \`$(realpath --relative-to . "${_TARGET}")\`! :-)"
	echo -e "\t${_TARGET}"
	_dryTest
elif [[ $_errors -eq $_count ]]; then
	echo -en "SORRY: not a single file could be copied, " >&2
	echo -e "everything went wrong! :-(" >&2
	errorCase 1
	exit 9
else
	_success=$(($_count-$_errors))
	echo -en "Sorry: ${_success} files could be copied, "
	echo -e "but ${_errors} files couldn't." >&2
	echo -e "\t${_TARGET}"
	_dryTest
	exit 10
fi
