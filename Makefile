SRC_FILE=jackbone.js

build: lint minify doc
	@echo 'build'

doc: configure
	@node_modules/.bin/docco ${SRC_FILE}
	@cat docs/header.html > docs/index.html
	@./tools/Markdown_1.0.1/Markdown.pl --html4tags README.md >> docs/index.html
	@cat docs/footer.html >> docs/index.html

minify: configure
	@node_modules/.bin/uglifyjs jackbone.js --lint --compress warnings=true --mangle --output jackbone.min.js

lint: configure
	@node_modules/.bin/jshint ${SRC_FILE}

tests: check-phantomjs
	@phantomjs tools/phantom-qunit-runner.js tests/init.html
	@phantomjs tools/phantom-qunit-runner.js tests/navigation.html

configure: check-npm
	@npm install

check-npm:
	@which npm > /dev/null || ( echo 'Please Install Node Package Manager, http://nodejs.org/'; exit 1 )

check-phantomjs:
	@which phantomjs > /dev/null || ( echo 'Please PhantomJS, http://phantomjs.org/'; exit 1 )

all: build tests
	@echo 'done'

clean:
	@find . -name '*~' -exec rm '{}' ';'
	@rm -fr docs/docco.css docs/index.html docs/jackbone.html docs/public/
