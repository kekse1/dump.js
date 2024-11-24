#!/usr/bin/env bash

# 
# Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
# https://norbert.com.es/
# 

#
BASH="bash"
BASH="`which $BASH 2>/dev/null`"

if [[ $? -ne 0 ]]; then
	echo "Your \`bash\` wasn't found!" >&2
	exit 1
fi

#
REAL="$(realpath "$0")"
DIR="$(dirname "$REAL")"
MAIN="$(realpath "${DIR}/dump.sh")"

#
CMD="${BASH} '${MAIN}' count"

for i in "$@"; do
	CMD="${CMD} '$i'"
done

#
eval "$CMD"

