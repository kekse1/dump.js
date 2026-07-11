#!/usr/bin/env bash
#
# Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
# https://norbert.com.es/
# v0.3.0
#

#
# Using the `dump.count` to create a list of all '*.log' files
# sorted by the amount of their zero(0) bytes.
#
# You can also set another byte (first parameter), and you can
# change the order via second parameter [ `asc`, `desc` ]; ...
#
# FYI: You can use the `sh/sorted-file-list.sh` for the usual
# logic of creating a sorted file list into a target directory
# by file COPIES. Use the `sorted-file-list` w/ `--count / -c`
# parameters for this. See also it's `--help / -h / -?` inf0!
#

#
_BYTE="${1:-0}"
_ORDER="${2,,}"; [[ -z "$_ORDER" ]] && _ORDER="asc"
_NULL="$3"

if [[ -z "$_NULL" ]]; then
	_NULL=0
else
	case "$_NULL" in
		"0"|"no"|"false"|"off")
			_NULL=0
			;;
		"1"|"yes"|"true"|"on")
			_NULL=1
			;;
		*)
			_NULL=0
			;;
	esac
fi

#
syntax()
{
	[[ $_NULL -ne 0 ]] && exit 255

	local _code=$1; [[ -z "$_code" ]] && _code=0

	echo -e "\nThis script will call my \`dump.util count\`."
	echo -e "It'll only count the zeros (0) to create a list"
	echo -e "of all '*.log' files sorted by their zero count.\n"
	echo -e "You can also set an other byte, instead of zero(0)."
	echo -e "The default order is 'asc(ending)', btw."

	local _syntax="\n\tSyntax: \$0 [ < byte > [ < asc/desc > ] ]\n"

	if [[ $_code -eq 0 ]]; then
		echo -e "$_syntax"
		exit 0
	fi

	echo -e "$_syntax" >&2
	exit $_code
}

#
case "$_ORDER" in
	"asc") _ORDER="";;
	"desc") _ORDER="r";;
	*)
		[[ $_NULL -ne 0 ]] && exit 254
		echo -e "Invalid parameter! Expecting [asc/desc] only (for the sort order)." >&2
		syntax 1
		;;
esac

if [[ $_BYTE -lt 0 || $_BYTE -gt 255 ]]; then
	[[ $_NULL -ne 0 ]] && exit 253
	echo -e "Invalid byte! The allowed range is [ 0 .. 255 ] only!" >&2
	syntax 2
fi

if [[ $_NULL -eq 0 ]]; then
	echo -en "Counting byte: (${_BYTE})\nOrder: "
	[[ -z "$_ORDER" ]] && echo "(ascending)" || echo "(descending)"
	echo
fi

#
for i in *.log; do
	if [[ $_NULL -eq 0 ]]; then
		echo -e "$(dump.util count --only ${_BYTE} --compact on --pairs yes "$i") $i"
	else
		echo -e "$(dump.util count --only ${_BYTE} --compact on --pairs yes --sep null "$i") $i\0"
	fi
done | sort -k 1,1${_ORDER}n

#

