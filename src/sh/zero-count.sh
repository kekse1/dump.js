#!/usr/bin/env bash
#
# Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
# https://norbert.com.es/
# v0.2.2
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

#
syntax()
{
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
	*) echo -e "Invalid parameter! Expecting [asc/desc] only (for the sort order)." >&2
		syntax 1;;
esac

if [[ $_BYTE -lt 0 || $_BYTE -gt 255 ]]; then
	echo -e "Invalid byte! The allowed range is [ 0 .. 255 ] only!" >&2
	syntax 2
fi

echo -en "Counting byte: (${_BYTE})\nOrder: "
[[ -z "$_ORDER" ]] && echo "(ascending)" || echo "(descending)"
echo

#
for i in *.log; do
	echo "$(dump.util count --only ${_BYTE} --compact on --pairs yes "$i") $i";
done | sort -k 1,1${_ORDER}n

#

