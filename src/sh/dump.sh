#!/usr/bin/env bash
#
# Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
# https://norbert.com.es/
#

#
REAL="$(realpath "$0")"
DIR="$(dirname "$REAL")"
PROJ="$(realpath "${DIR}/../")"
BASE="$(basename "$REAL")"
NAME="$(basename "$REAL" .sh)"
SOURCE="${PROJ}/js/"
TARGET="${SOURCE}/main.js"
CONFIG="${PROJ}/json/dump.json"

#
NODE="`which node 2>/dev/null`"

if [[ -z "$NODE" ]]; then
	echo "Unable to find the \`node\` interpreter!" >&2
	exit 1
fi

#
CMD="'${NODE}' '${TARGET}' --project '${PROJ}' --source '${SOURCE}' --config '${CONFIG}'"

for i in "$@"; do
	CMD="${CMD} '$i'"
done

#
eval "$CMD"

