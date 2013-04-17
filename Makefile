SRC_FILE=jackbone.js

build: configure
	@echo 'build'

doc: configure
	@node_modules/docco/bin/docco ${SRC_FILE}
	@cat docs/header.html > docs/index.html
	@./tools/Markdown_1.0.1/Markdown.pl --html4tags README.md >> docs/index.html
	@cat docs/footer.html >> docs/index.html

min: build
	@echo 'min'

lint: configure
	@node_modules/jslint/bin/jslint.js --nomen --plusplus --vars ${SRC_FILE}

tests: check-phantomjs
	@phantomjs tools/phantom-qunit-runner.js tests/init.html
	@phantomjs tools/phantom-qunit-runner.js tests/navigation.html

configure: check-npm
	@npm install

check-npm:
	@which npm > /dev/null || ( echo 'Please Install Node Package Manager, http://nodejs.org/'; exit 1 )

check-phantomjs:
	@which phantomjs > /dev/null || ( echo 'Please PhantomJS, http://phantomjs.org/'; exit 1 )

all: build doc lint tests
	@echo 'done'
