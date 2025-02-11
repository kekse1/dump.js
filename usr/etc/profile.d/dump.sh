#
# Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
# https://kekse.biz/ https://github.com/kekse1/dump.js/
#

# 
# some easy key bindings (aliases) for (my) most called dump functionality..
# copy to '/etc/profile.d/dump.sh' to apply 'em automatically on login.
#

alias d="dump --tail 80% --replace no"
alias c="dump.count --sort yes --chars yes"
alias p="dump.printable"
alias t="dump.text"

