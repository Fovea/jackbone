SRC_FILE=jackbone.js

build: configure
	@echo 'build'

doc: configure
	@node_modules/docco/bin/docco ${SRC_FILE}

min: build
	@echo 'min'

lint: configure
	@node_modules/jslint/bin/jslint.js --nomen --vars ${SRC_FILE}

configure: check-npm
	@npm install

check-npm:
	@which npm > /dev/null || ( echo 'Please Install Node Package Manager, http://nodejs.org/'; exit 1 )

